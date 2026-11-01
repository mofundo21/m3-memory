import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

// Unit tests for the museum tier decision. Pure logic: no browser, no WebGL.
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return { url: pathToFileURL(join(srcRoot, `${specifier.slice(2)}.ts`)).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { decideMuseumTier, detectWebGL2 } = await import("../src/lib/museumCapability.ts");

const base = { optedIn: true, reducedMotion: false, webgl2: true, contextFailed: false };

// Cinematic only when the visitor opted in, the browser can do it, motion is allowed, and no context failure was seen.
assert.equal(decideMuseumTier(base), "cinematic");

// Without the opt-in (the default), the page stays on the DOM tier even on a capable browser.
assert.equal(decideMuseumTier({ ...base, optedIn: false }), "dom");

// Reduced motion always wins, even with full WebGL support.
assert.equal(decideMuseumTier({ ...base, reducedMotion: true }), "dom");

// No WebGL2: DOM tier.
assert.equal(decideMuseumTier({ ...base, webgl2: false }), "dom");

// A failure is sticky for the visit: once recorded, the tier stays DOM.
assert.equal(decideMuseumTier({ ...base, contextFailed: true }), "dom");

// Every combination of the three inputs resolves to one of the two tiers, and only one combination is cinematic.
let cinematic = 0;
for (const optedIn of [false, true]) {
  for (const reducedMotion of [false, true]) {
    for (const webgl2 of [false, true]) {
      for (const contextFailed of [false, true]) {
        const tier = decideMuseumTier({ optedIn, reducedMotion, webgl2, contextFailed });
        assert.ok(tier === "cinematic" || tier === "dom");
        if (tier === "cinematic") cinematic += 1;
      }
    }
  }
}
assert.equal(cinematic, 1, "exactly one input combination is cinematic");

// Server-side (no document): the probe reports no WebGL and never throws.
assert.equal(detectWebGL2(), false, "probe is false outside the browser");

console.log("museum capability tests ok");
