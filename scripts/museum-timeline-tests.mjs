import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

// Unit tests for the museum timeline evaluator. Pure logic only: no DOM, no browser.
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = join(srcRoot, specifier.slice(2));
      const withExt = target.endsWith(".ts") ? target : `${target}.ts`;
      return { url: pathToFileURL(withExt).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { evaluateMuseumFrame, JOIN_ACTIVE_AT } = await import("../src/lib/museumTimeline.ts");
const { cameraAt, sceneOpacity, within } = await import("../src/lib/museumCamera.ts");
const { MUSEUM_BEATS, MUSEUM_COPY, MUSEUM_SCENES, SCENE_FADE, ENTER_PROGRESS, SCENE_THREE_PLATES, SCENE_TWO_PLATES } =
  await import("../src/lib/museumConfig.ts");

const samples = Array.from({ length: 401 }, (_, i) => i / 400);
const frame = (progress, reducedMotion = false, counterCount = 4) =>
  evaluateMuseumFrame({ progress, reducedMotion, counterCount });

// 1. Parity: the evaluator must produce the same numbers the previous component computed inline.
for (const p of samples) {
  const f = frame(p);
  const cam = cameraAt(p);
  assert.equal(f.camera.zoom, cam.zoom, `camera zoom at ${p}`);
  assert.equal(f.camera.x, cam.x, `camera x at ${p}`);
  for (const scene of MUSEUM_SCENES) {
    assert.equal(f.scenes.opacity[scene.id], sceneOpacity(scene.id, p), `${scene.id} opacity at ${p}`);
  }
  assert.equal(f.yeriel.nameOpacity, within(p, ...MUSEUM_BEATS.yeriel.nameIn), `name in at ${p}`);
  assert.equal(f.yeriel.nameY, within(p, ...MUSEUM_BEATS.yeriel.nameShrink) * -28, `name y at ${p}`);
  assert.equal(f.yeriel.nameScale, 1 - within(p, ...MUSEUM_BEATS.yeriel.nameShrink) * 0.5, `name scale at ${p}`);
  assert.equal(f.enter.opacity, Math.max(0, Math.min(1, 1 - p / ENTER_PROGRESS)), `enter at ${p}`);
  assert.equal(f.join.active, p >= JOIN_ACTIVE_AT, `join active at ${p}`);
}

// 2. Reduced motion: no camera travel, no crossfade, no overlapping scenes.
for (const p of samples) {
  const f = frame(p, true);
  assert.deepEqual(f.camera, { zoom: 1, x: 0 }, `rm camera at ${p}`);
  assert.equal(f.scenes.transition, null, `rm transition at ${p}`);
  const visible = MUSEUM_SCENES.filter((s) => f.scenes.opacity[s.id] > 0).length;
  assert.ok(visible <= 1, `rm shows ${visible} scenes at ${p}`);
  for (const scene of MUSEUM_SCENES) {
    const o = f.scenes.opacity[scene.id];
    assert.ok(o === 0 || o === 1, `rm scene opacity must be a hard 0 or 1 at ${p}`);
  }
  assert.equal(f.yeriel.nameY, 0, `rm name must not travel at ${p}`);
  assert.equal(f.yeriel.nameScale, 1, `rm name must not scale at ${p}`);
  for (const plate of f.mofundo.plates) assert.equal(plate.dx, 0, `rm plate drift at ${p}`);
  for (const plate of f.rememberHim.plates) assert.equal(plate.scale, 1, `rm plate depth at ${p}`);
}

// 3. Reduced motion shows the final scene at progress 1 (the last scene holds to the end).
assert.equal(frame(1, true).scenes.opacity.join, 1, "rm join visible at end of track");

// 4. Every opacity stays inside 0..1 across the whole track, in both modes.
for (const rm of [false, true]) {
  for (const p of samples) {
    const f = frame(p, rm);
    const all = [
      ...Object.values(f.scenes.opacity),
      f.enter.opacity,
      f.yeriel.nameOpacity,
      f.yeriel.metaOpacity,
      ...f.yeriel.fragmentOpacity,
      f.mofundo.nameOpacity,
      f.mofundo.waveformOpacity,
      ...f.mofundo.plates.map((x) => x.opacity),
      f.rememberHim.questionOpacity,
      ...f.rememberHim.plates.map((x) => x.opacity),
      ...f.rememberHim.evidenceOpacity,
      ...f.rememberHim.fragmentOpacity,
      f.join.countersOpacity,
      ...f.join.counterOpacity,
      ...f.join.lineOpacity,
      f.join.joinOpacity,
      f.join.ctaOpacity,
    ];
    for (const v of all) assert.ok(v >= 0 && v <= 1, `opacity ${v} out of range at ${p} rm=${rm}`);
  }
}

// 5. Transitions: present only inside a scene boundary window, with a valid from/to pair.
const boundaries = MUSEUM_SCENES.slice(1).map((s) => s.start);
for (const b of boundaries) {
  const mid = frame(b).scenes.transition;
  assert.ok(mid, `transition expected at boundary ${b}`);
  assert.ok(mid.amount >= 0 && mid.amount <= 1);
}
assert.equal(frame(0.12).scenes.transition, null, "no transition mid-scene");
assert.equal(frame(0.38).scenes.transition, null, "no transition mid-scene");
const t = frame(boundaries[0]).scenes.transition;
assert.equal(t.from, "yeriel");
assert.equal(t.to, "mofundo");
assert.ok(Math.abs(t.amount - 0.5) < 1e-9, "amount is 0.5 exactly at the boundary");
assert.equal(frame(boundaries[0] + SCENE_FADE + 0.001).scenes.transition, null, "transition ends after the fade window");

// 6. Join threshold: the CTA becomes active only once the join beat is reached.
assert.equal(frame(MUSEUM_BEATS.join.joinIn[0] - 0.01).join.active, false);
assert.equal(frame(JOIN_ACTIVE_AT).join.active, true);
assert.equal(frame(1).join.active, true);

// 7. ENTER: visible at the start, inert once it is mostly faded out.
assert.equal(frame(0).enter.opacity, 1);
assert.equal(frame(0).enter.inert, false);
assert.equal(frame(ENTER_PROGRESS).enter.opacity, 0);
assert.equal(frame(ENTER_PROGRESS).enter.inert, true);

// 8. Scene 03 plates carry the 0.85 cap; Scene 02 plates do not.
// Sample after the last plate has fully arrived (its plateIn window ends at 0.60 and 0.38).
const late = frame(0.61);
for (const plate of late.rememberHim.plates) assert.ok(Math.abs(plate.opacity - 0.85) < 1e-9, "scene 03 cap is 0.85");
const twoLate = frame(0.39);
for (const plate of twoLate.mofundo.plates) assert.ok(Math.abs(plate.opacity - 1) < 1e-9, "scene 02 is full opacity");

// 9. Plate depth scale and drift follow the config.
const depthFrame = frame(0.55);
SCENE_THREE_PLATES.forEach((plate, i) => {
  assert.equal(depthFrame.rememberHim.plates[i].scale, plate.depth ?? 1, `depth scale ${plate.id}`);
});
const driftFrame = frame(MUSEUM_BEATS.mofundo.drift[1]);
SCENE_TWO_PLATES.forEach((plate, i) => {
  assert.equal(driftFrame.mofundo.plates[i].dx, plate.drift ?? 0, `drift ${plate.id}`);
});

// 10. Lists follow their inputs: counters, and the fragment count from the copy.
assert.equal(frame(0.8, false, 0).join.counterOpacity.length, 0, "no counters, no entries");
assert.equal(frame(0.8, false, 6).join.counterOpacity.length, 6, "counter entries follow the count");
assert.equal(frame(0.2).yeriel.fragmentOpacity.length, MUSEUM_COPY.yeriel.fragments.length);
assert.equal(frame(0.2).join.lineOpacity.length, MUSEUM_COPY.join.lines.length);

// 11. Message lines hand off in order: the current line is visible on its beat, and lines two or more
// ahead are hidden. Adjacent lines may overlap briefly, because they crossfade by design.
const lineFrames = MUSEUM_BEATS.join.lineStarts.map((s) => frame(s + 0.01).join.lineOpacity);
lineFrames.forEach((lines, i) => {
  assert.ok(lines[i] > 0, `line ${i} visible on its beat`);
  lines.forEach((v, j) => {
    if (j >= i + 2) assert.equal(v, 0, `line ${j} hidden on line ${i}'s beat`);
  });
});

// 11b. Baseline lock: reduced motion switches outgoing content off at the START of the next beat
// (the behavior of the pre-extraction component). A change here is a visible behavior change.
const fragStart = MUSEUM_BEATS.yeriel.fragmentOut(0)[0];
assert.equal(frame(fragStart, true).yeriel.fragmentOpacity[0] > 0, false, "reduced-motion fragment is off at its out-beat start");
assert.equal(frame(fragStart - 0.001, true).yeriel.fragmentOpacity[0] > 0, true, "reduced-motion fragment is still on just before its out-beat");

// 12. Purity: the same input always gives the same output.
assert.deepEqual(frame(0.37), frame(0.37));

// 13. Spatial world (cinematic layer). The renderer reads only these values.
const { WORLD_PLATES } = await import("../src/lib/museumConfig.ts");
const plateOf = (f, id) => f.world.plates.find((x) => x.id === id);

// Camera moves toward the scene: depth never increases across the sequence.
let lastZ = Infinity;
for (let i = 0; i <= 480; i += 1) {
  const z = frame(0.05 + (i / 480) * 0.43).world.cameraZ;
  assert.ok(z <= lastZ + 1e-9, "camera depth never increases through the sequence");
  lastZ = z;
}
assert.ok(frame(0).world.cameraZ >= 8, "camera starts far back");

// The first portrait is in front and fully visible while the camera approaches it.
assert.equal(plateOf(frame(0.12), "portrait-01").opacity, 1, "YERIEL portrait is visible on arrival");

// The camera passes the YERIEL fragment between 0.27 and 0.34: it is visible before, and gone after.
assert.ok(plateOf(frame(0.2), "fragment-01").opacity > 0.99, "YERIEL fragment is visible before the camera passes it");
assert.equal(plateOf(frame(0.34), "fragment-01").opacity, 0, "YERIEL fragment is passed by 0.34");

// The first portrait is passed before the last plate is reached.
assert.equal(plateOf(frame(0.4), "portrait-01").opacity, 0, "YERIEL portrait is behind the camera by 0.40");

// Far plates are fogged; near plates are clear.
assert.equal(plateOf(frame(0.05), "portrait-04").fog, 1, "distant plate is fully fogged");
assert.ok(plateOf(frame(0.2), "portrait-01").fog < 0.6, "near plate is clear");

// Survival invariant: the fragment is a crop of the same photograph as the YERIEL portrait.
const fragment = WORLD_PLATES.find((x) => x.id === "fragment-01");
const yeriel = WORLD_PLATES.find((x) => x.id === "portrait-01");
assert.equal(fragment.asset, yeriel.asset, "the fragment is drawn from the YERIEL photograph");
assert.notDeepEqual(fragment.crop, [0, 0, 1, 1], "the fragment is a crop, not the whole image");

// Plate ids are unique, and every value stays in range across the track, with and without reduced motion.
assert.equal(new Set(WORLD_PLATES.map((x) => x.id)).size, WORLD_PLATES.length, "plate ids are unique");
for (const rm of [false, true]) {
  for (const q of samples) {
    const w = frame(q, rm).world;
    assert.ok(w.dustOpacity >= 0 && w.dustOpacity <= 0.6, "dust stays within its budget");
    for (const pl of w.plates) {
      assert.ok(pl.opacity >= 0 && pl.opacity <= 1, "plate opacity in range");
      assert.ok(pl.fog >= 0 && pl.fog <= 1, "plate fog in range");
    }
  }
}

// Determinism of the spatial state.
assert.deepEqual(frame(0.31).world, frame(0.31).world);

console.log("museum timeline tests ok");
