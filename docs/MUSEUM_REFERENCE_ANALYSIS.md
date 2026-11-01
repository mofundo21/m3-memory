# Museum Reference Analysis (Phase 1)

Status: Phase 1 complete for EDOLUS. Active Theory is only partially analyzed (see Gaps).
Tier: 1 (documentation only). No application code changed.
Scope rule: references are evidence for principles, not templates. Nothing here copies source code, assets, copy, or branding.

## 1. Method

- Repository inspection: `CLAUDE.md`, `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/HISTORICAL_INTEGRITY.md`, `docs/AI_SYSTEM.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`, `package.json`, `src/**`, `supabase/schema.sql`.
- Live reference capture: headless Chrome via the project's existing `puppeteer` devDependency, run from a scratch folder (not committed). Desktop 1440x900 and mobile 390x844 @2x. Screenshots at top and at 25/50/85% scroll on desktop.
- `WebFetch` was tried first and returned only the page title for both sites. Both are JavaScript-driven, so static fetching is not a valid method for them.
- Caveat: headless screenshots show loading and early states. Full timing, audio, and interaction feel still need a human pass on real hardware.

## 2. What the Repository Already Has (inspection findings)

These constrain the museum design. Do not ignore them.

| Area | Current state | Implication |
|---|---|---|
| Stack | Next.js 16 (App Router), React 19, TypeScript, plain CSS in `src/app/globals.css`. No Three.js, R3F, GSAP, Motion, or Lenis in `package.json`. | Any WebGL work adds dependencies. Ponytail scope check required first. |
| Dev deps | `puppeteer` is already present. | Browser QA needs no new tooling. |
| Design tokens | Dark `--bg #0B1012`, `--paper #F2EADB`, `--purple #B89BFF`, serif Playfair Display, sans Inter, script Caveat. | The museum should reuse these tokens so it reads as the same project. |
| Home `/` | Two-column hero with `PhotoPlaceholder`, a "What is M3 Memory?" text block, and a placeholder Polaroid gallery ("Festival Memory", "Friends"...). | Placeholders already exist. Museum must replace them with honest placeholders. |
| `/remember` | `CinematicIntro` already exists: scroll-scrub `<video>` with a `ScrollMemory` text fallback. `public/media/` has **no video files**, so users always see the text fallback. | The scroll-scrub architecture is real but dormant. Reuse its tunables and reduced-motion gating rather than building a second scroll engine. |
| Interview entry | `/submit` is only a redirect to `/remember`. The actual interview is `/remember` (intro) then `/remember/write` (Step 2 of 4), `/remember/details`, `/remember/final`. | The brief's "`/submit`" target must be mapped to the real entry. See Decision D1. |
| Data | All archive data is server-side: SQLite locally, Supabase in production with RLS. `anon` has no table grants. Admin reads use an allowlisted JWT. | There is **no public-safe read API** today. The museum cannot show real people, encounters, or counters yet. |
| Stats | No public counters exist. | Act 04 counters must be "pending" until a public-safe aggregate view exists. |
| Sound | None in the repo. | Sound is new. Keep it off by default. |
| Accessibility | Skip link and focusable CTA exist in `CinematicOverlay`. Reduced-motion check exists in `useCinematicAvailability`. | Keep these patterns. |

## 3. Reference Observations

### 3.1 EDOLUS (https://edolus.com/) — observed

Measured in headless Chrome with WebGL2 enabled.

- **Engine / stack:** PlayCanvas (`playcanvas-stable.min.js`), GSAP, a PlayCanvas-style module/start/loading script chain, and a single `<canvas>`. Fonts: JetBrains Mono (labels) and General Sans (body/display). The page is a 3D engine app, not a document. `document.scrollHeight` equals the viewport height, so the scroll model is inside the engine.
- **Loading:** A full-screen black loader. The wordmark "EDOLUS" is centered with a live percentage counter underneath (observed 4%→77% over the first seconds). The percentage is a real progress readout, not decoration.
- **Entry:** After loading, the scene is a blurred, dimmed photographic/video backdrop. The headline reads "Edolus never existed." with a weight contrast (light first clause, heavy second clause). Below it is a mono-spaced line and a single boxed control with letter-spaced mono characters ("AE"). The brand copy explicitly cues audio: "INITIATE SYSTEM EXPERIENCE WITH HEADPHONES" / "EXPERIENCE WITH HEADPHONES" with an icon.
- **Media:** Two `<video>` elements and about 49 MB of transferred content on desktop (approximate, from `content-length`), versus about 0.28 MB on mobile. The mobile path loads a much lighter set of assets.
- **Typography:** Strong contrast of weight within one headline. Small, tracked, uppercase mono for system/UI text. Large sans for the statement. Very few words on screen at once.
- **Mood:** Restrained, dark, one focal headline, a clear single call to action.

What this teaches us:
1. A loader that shows real percentage progress makes waiting feel intentional.
2. One sentence on a dark, dimmed, moving backdrop is enough to set a scene.
3. Weight contrast can carry the hierarchy without color.
4. Sound is introduced as an invitation, not an auto-start.
5. Mobile gets a much lighter asset load. This is the right performance instinct.

What not to copy:
- The "headphones" gate and any text that demands audio. Yeriel has said no headphone cue. Sound is an optional layer, never an instruction.
- The mono code-like boxed control and its "AE" glyph styling. It is an engine-UI aesthetic, which conflicts with our warm, archival direction.
- Its visual identity, wordmark, and copy.

### 3.2 Active Theory (https://activetheory.net/) — partially observed

- Title: "Active Theory · Creative Digital Experiences". Font requested: `nbarchitekt`.
- With WebGL2 enabled in headless Chrome, the site still rendered **"Your browser is not supported"** on both desktop and mobile, with no canvas. Nothing else loaded.
- The gate is likely a capability or feature check that headless SwiftShader does not satisfy. It could also be a real support decision. I cannot tell which from this capture.

Result: **no usable scene, camera, transition, or sound observations.** I will not infer Active Theory's techniques from its name or reputation.

Gap closure (needed before Phase 2 relies on Active Theory principles): a manual browser visit on a real GPU desktop and a real phone, recording scroll and transition behavior. Yeriel or a reviewer should do this, or it should be done in a headed browser session.

## 4. Principles to Carry Forward (original MOFUNDO translation)

These are principles, expressed in our own system.

| Principle | Use in MOFUNDO |
|---|---|
| Loading as ritual | Quiet loader with honest progress. The first screen is a name, then the wordmark, then the story. |
| One sentence per beat | Each act leads with one line on a dark, dimmed field. |
| Weight over color | Hierarchy from heavy vs. light Playfair/Inter contrast, not neon. |
| Invitation, not gate | Sound and motion are offered. Nothing is blocked behind them. |
| Light payloads on mobile | Lighter textures, fewer nodes, no video on low-power devices. |
| Scroll as a timeline controller | Reuse the existing scrub tunables. Use stillness between beats. |
| Transition carries the object | The chosen node or photo becomes the next scene's first frame. Implement only after the architecture works. |

## 5. Techniques and Their Cost in Our Stack

Every option is weighed against the Ponytail rule: prefer the smallest justified stack.

| Need | Lowest-cost option | Heavier option | Recommendation |
|---|---|---|---|
| Scroll-driven acts | Existing `useScrollScrub` + CSS sticky | GSAP ScrollTrigger | Start with what exists. Add GSAP only if timeline complexity demands it. |
| Ambient depth / particles | CSS + canvas 2D | R3F + drei + three | Prototype with canvas 2D first. Justify three.js per act later. |
| Photo layers / parallax | CSS transforms + layered `<img>` | Depth-separated WebGL | CSS first. Depth scan only once real assets exist. |
| Node constellation (Act 03) | SVG or canvas 2D with a typed data adapter | three.js point cloud | Canvas 2D for ~50 nodes. Re-evaluate at higher counts. |
| Sound | Native `<audio>`, one looping track, Web Audio gain for fades | Howler.js | Native `<audio>` is enough for one background track. |
| Smooth scroll | Native scroll | Lenis | Native scroll. Lenis is not needed. |

Current conclusion: no new frontend dependency is justified yet. Prove the architecture with the existing stack first.

## 6. Mobile Observations

- EDOLUS sends a much lighter payload to mobile (approximately 0.28 MB vs 49 MB on desktop, both approximate from `content-length`). Mobile must receive a separate, lighter asset set.
- Mobile screenshots show a single centered wordmark and loader. Layout is not a shrunk desktop scene.
- Rule for us: no hover-dependent discovery. Tap reveals the label. Everything that matters must still work without a pointer.

## 7. Performance Observations

- The reference sites load tens of megabytes on desktop. The museum target should stay well below that. Initial payload target: under 300 KB before the first scene, excluding fonts. This is a proposed budget, to be measured in Phase 3.
- Engine-based loaders hide the cost behind a progress readout. We should do the same if preloading is needed, and avoid preloading media that is not on the first screen.

## 8. Sound Direction (from Yeriel's note, incorporated)

- No headphone prompt and no audio gate.
- Background music is wanted. For now, use an **external, licensed** ambient track as a placeholder. The user will replace it with their own music later.
- Requirements:
  - Off by default until the visitor enables it. Never autoplay with sound.
  - Persistent, obvious sound toggle.
  - Volume fades in and out on toggle. Fade on route exit.
  - `prefers-reduced-motion` governs motion, not audio. Audio stays off by default regardless of that setting.
  - The experience must read fully with sound off.
- Do not fetch or commit any track yet. Licensing must be confirmed for whatever track is used. The track path goes in a configurable manifest so it can be swapped without code changes.

## 9. Decisions Needed

- **D1: Interview target. DECIDED.** The final CTA routes to `/remember/write`, the real interview start. Route names are not restructured now.
- **D2: Background track. DECIDED.** Audio architecture is configured in `src/lib/museumAudioConfig.ts` with the placeholder path `/media/museum-ambient.mp3`. No track is bundled. The museum works without the file.
- **D3: Real archive data. DECIDED (Yeriel, confirmed).** Act 03 and Act 04 use clearly marked placeholders from a typed adapter until a **public-safe view or API** exists. That view requires a Tier 3 review (RLS, grants, contributor privacy). Do not weaken RLS.
- **D4: Active Theory. ATTEMPTED, BLOCKED.** One headed (visible) browser attempt with WebGL2 available still showed "Your browser is not supported" and no canvas. Per the decision, no further bypass attempts. Active Theory's principles are not used in the design bible. A real-device visit remains optional.

## 10. Gaps and Limits

- Active Theory was not analyzed beyond its gate (see 3.2).
- Headless captures do not show frame rate, GPU load, or real audio behavior.
- Payload sizes are approximate, from response `content-length` headers. Chunked responses are undercounted.
- No Active Theory or EDOLUS code, assets, or copy is reproduced in this repository.

## 11. Next Step

Phase 2: write `docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md` covering the five acts, typography, color, motion, camera, transitions, sound, archive-data philosophy, mobile, accessibility, and asset requirements. No major visual implementation until that document is approved.
