# Museum Cinematic Rendering: Technical Proposal

Status: **Proposal only. No dependencies installed. Awaiting approval before the rendering layer starts.**
Tier: 2 (new rendering architecture on a user-facing route). Second-model review required before merge.
Inputs: `docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md`, `docs/ai-runs/museum-phase3/codex-review*.md`, `docs/ai-runs/museum-phase3/visual-qa.md`.

## 1. Question

Is WebGL (Three.js / React Three Fiber) justified for the cinematic experience, or is CSS enough?

## 2. Verdict per requirement

Each effect is judged on whether a DOM/CSS version can do it acceptably. "Justified" means CSS cannot, or cannot do it at the needed quality or scale.

| Requirement | CSS 3D possible? | WebGL needed? | Verdict |
|---|---|---|---|
| Real camera movement through depth | Yes, with `perspective` and `translateZ` on layers | Cleaner, one shared camera | Partly. CSS works for a few layers |
| Layered photographs occupying 3D space | Yes, for a handful of planes | Yes for many planes sharing one camera and lighting | Justified at scale (about 10+ planes) |
| Parallax beyond simple transforms | Limited. No per-pixel depth | Yes, with a depth map and displacement | **Justified** (needs a depth map) |
| Particles assembling or disassembling imagery | Canvas 2D handles about 1–2k points | GPU points handle tens of thousands | **Justified** |
| Photographs passing the camera | Yes, with CSS 3D | Yes | Not decisive alone |
| Spatial constellation behavior | Yes, for about 16 nodes (SVG/DOM) | Not needed | **Not justified** |
| Depth-based transitions | No | Yes (shader) | **Justified** |
| Environmental lighting | Gradients only | Yes | Not justified for v1. Restraint is the goal |
| Shader-based image transitions (dissolve, displacement) | No | Yes | **Justified**, strongest payoff |
| One continuous visual world across scenes | Only by cross-fading DOM | One persistent canvas and camera carry objects across scenes | **Justified**. This is the core reason |

**Conclusion:** WebGL is justified. The reasons are one continuous world with a shared camera, shader transitions, and GPU particles. Those are the things the visual QA said are missing. The brief also says no 3D assets are needed, so there is no model-loading cost.

**Not justified for v1:** post-processing stacks, lighting rigs, 3D models, physics, and general-purpose animation libraries.

## 3. Minimum dependency set

| Package | Role | Why this one |
|---|---|---|
| `three` | Rendering: scene, planes, points, custom shader material | The rendering core. Only the modules used get bundled |
| `@react-three/fiber` (v9, targets React 19) | React binding for the canvas, render loop, and disposal | Keeps the renderer in the React lifecycle and drives it from the same scene state the DOM uses. Thin |
| `@types/three` (dev) | TypeScript types | Needed for typed code |

**Explicitly not proposed:** `@react-three/drei` (helpers we do not need yet), `gsap` and ScrollTrigger (scroll progress already exists in `useMuseumScroll`), Lenis (native scroll is correct), `postprocessing`, `motion`, `zustand`, `leva`.

**Alternative if bundle size fails the budget:** `three` alone, with the canvas created in a `useEffect` and disposed on unmount. Roughly the same features, more lifecycle code. Decide after measuring.

Versions must be confirmed at install time (peer ranges against React 19 and Next 16).

## 4. Architecture

```
MUSEUM EXPERIENCE

Content / archive adapter            (src/lib/museumArchive.ts: placeholder only today)
        │
        ▼
Timeline evaluator (pure)            (NEW, prerequisite: src/lib/museumTimeline.ts)
  input:  progress, reducedMotion, tier
  output: MuseumFrame { activeScene, sceneOpacity, camera, beat visibility, layout }
        │
        ├──────────────────────────────┐
        ▼                              ▼
DOM + accessibility layer            Cinematic renderer (lazy, optional)
  text, controls, CTA, text panel      canvas: planes, points, shader transitions
  always present                       consumes MuseumFrame only
  (current prototype, unchanged)
```

### Rules
- **One story, one state.** Both layers consume the same `MuseumFrame`. Neither re-derives timing.
- **The DOM layer is never removed.** It is the accessibility layer, the text version, and the fallback.
- **The canvas is decorative.** It is `aria-hidden`, contains no controls, and never carries information that the DOM does not also carry.
- **Renderer code loads lazily.** `next/dynamic` with `ssr: false`, only when the tier is `cinematic` or `light`.

### Capability tiers (decided once, on load)

| Tier | When | Renders |
|---|---|---|
| `cinematic` | WebGL2 available, not reduced motion, not low-power (see below) | Full: planes with depth, shader transitions, particles, shared camera |
| `light` | WebGL2 available but low-power or small screen | Fewer planes (≤ 4), no particles, shader transitions only at scene boundaries |
| `dom` | Reduced motion, WebGL unavailable, or context lost | Current DOM/CSS prototype, no canvas |

Low-power signals: `navigator.hardwareConcurrency < 4`, `navigator.deviceMemory < 4`, coarse pointer with width ≤ 600px, or a measured frame-time sample above budget in the first 2 seconds. A `webglcontextlost` event drops to `dom` and does not retry automatically.

**Reduced motion always resolves to `dom`.** It gets the discrete-beat layout already built.

## 5. Performance implications

Measured numbers do not exist yet. These are targets from the design bible and estimates to verify.

| Concern | Plan | Status |
|---|---|---|
| JS bundle | Renderer lazy-loaded, out of the initial route bundle. Target ≤ 250 KB gzip for `three` + R3F | Estimate. Measure with `next build` output before merge |
| Initial paint | DOM layer renders first. Canvas mounts after first frame | Designed |
| GPU memory | Placeholder SVG textures now. Real photos as AVIF/WebP, ≤ 1600px long edge, mounted per scene | Designed (asset budget in the bible §19) |
| Frame cost | `frameloop="demand"`: render only when progress or state changes, not every frame | To implement |
| Pixel cost | DPR cap 2 desktop, 1.5 mobile. Adaptive down on sustained overruns | To implement |
| Particles | ≤ 300 desktop, ≤ 40 mobile, 0 in `light` and `dom` | Designed |
| Lifecycle | Dispose geometries, materials, textures on scene leave and unmount. Test with repeated enter and leave | To implement and test |
| Power | Pause the render loop when the tab is hidden or the stage is off-screen | To implement |

**Biggest risk:** mobile GPU fill rate with full-screen shader passes. Mitigation: shaders run only on the focal plane and only during transitions, and the `light` tier removes particles and most passes.

## 6. Build order (after approval)

0. **Prerequisite, no new dependencies:** extract the timeline evaluator into `src/lib/museumTimeline.ts`. Move all beat and reveal logic out of `MuseumSequence.tsx` (Codex review 1, finding 7). Add pure unit tests for it. Keep the DOM output identical, which the existing browser tests check.
1. **Capability module:** `src/lib/museumCapability.ts`. Pure tier decision, with tests for each branch (reduced motion, no WebGL, low-power, desktop).
2. **Install** `three`, `@react-three/fiber`, `@types/three`. Record the bundle size delta.
3. **First experiment (below).** Decision gate before anything else.
4. Remaining scenes, each behind the same frame contract.

## 7. First WebGL experiment (proposed)

**Scope:** one persistent canvas for Scenes 01 and 02 only, placeholder plates only.

- Three planes: the portrait placeholder (back), a photo placeholder (front), and a waveform strip (side).
- Camera driven by `cameraAt(progress)` mapped to z and x. The DOM text layer is unchanged.
- One shader dissolve between the portrait plate and the photo plate during the 01 → 02 transition.
- Dust particles (≤ 300 desktop) in one beam over the portrait.
- No real photos, no 3D assets, no post-processing.

**Success criteria (all required):**

1. Desktop: p95 frame time ≤ 16.7 ms on a mid laptop, measured with the Chrome performance panel during a full scroll.
2. Mid Android phone, headed on a real device: p95 ≤ 33 ms. If real-device testing is not available, the decision is deferred, not assumed.
3. Added JS ≤ 250 KB gzip, measured.
4. DOM accessibility layer unchanged. Browser tests pass. Focus and inert behavior unchanged.
5. With WebGL disabled (`--disable-webgl` launch flag), the page renders the `dom` tier with no errors.
6. Visual: Yeriel reviews the frames and judges whether it reads as moving through a space rather than as slides. This is a creative gate, not a metric.

**Stop condition:** if criterion 6 fails, or criteria 1–3 fail with no cheap fix, stop WebGL. Return to CSS 3D for depth, and keep the shared timeline.

## 8. Open items and risks

- **Blocker, not rendering:** production preference save (`updatePreferencesAction` without a token, Supabase mode). Needs a Tier 3 design for a contributor-scoped write capability. Unrelated to the renderer, but it blocks the interview hand-off in production. See `docs/ai-runs/museum-phase3/codex-review.md` finding 1.
- **Depth-displacement portrait** needs a depth map for Yeriel's photograph. Generating one from a face needs consent review. Do not auto-generate.
- **Real photos** arrive from Yeriel. Until then, the experiment uses placeholders, so the visual judgment in criterion 6 is about the choreography, not the images.
- **Active Theory** was not analyzed (blocked in headless and headed attempts). Its techniques are not part of this proposal.

## 9. Decision requested

1. Approve the prerequisite (timeline evaluator extraction, no new dependencies).
2. Approve the three-package dependency set, or ask for the `three`-only alternative.
3. Approve the first experiment and its stop condition.
