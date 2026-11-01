# Museum Phase 3: Headed Visual QA

Date: 2026-10-31
Build: production build of the DOM/CSS prototype at `/museum`, after the Codex second-pass fixes.
Method: headed Chrome (visible window), desktop 1440×900 and emulated mobile 390×844 @2x. Frames are in `qa/`, named by point in the sequence.
Not done: real devices, real GPU profiling, slow-network throttling.

## Frames

| # | Point | Desktop frame | Mobile frame |
|---|---|---|---|
| 1 | ENTER | `qa/desktop-01-enter.png` | `qa/mobile-01-enter.png` |
| 2 | YERIEL (progress 0.15) | `qa/desktop-02-yeriel.png` | `qa/mobile-02-yeriel.png` |
| 3 | Transition Yeriel → MOFUNDO (0.265) | `qa/desktop-03-transition-yeriel-mofundo.png` | `qa/mobile-03-transition-yeriel-mofundo.png` |
| 4 | MOFUNDO (0.38) | `qa/desktop-04-mofundo.png` | `qa/mobile-04-mofundo.png` |
| 5 | Transition MOFUNDO → Remember him (0.50) | `qa/desktop-05-transition-mofundo-remember.png` | `qa/mobile-05-transition-mofundo-remember.png` |
| 6 | How do you remember him? (0.58) | `qa/desktop-06-remember-him.png` | `qa/mobile-06-remember-him.png` |
| 7 | Counters (0.78) | `qa/desktop-07-counters.png` | `qa/mobile-07-counters.png` |
| 8 | Message lines (0.92) | `qa/desktop-08-message-lines.png` | `qa/mobile-08-message-lines.png` |
| 9 | Join and CTA (1.0) | `qa/desktop-09-join-cta.png` | `qa/mobile-09-join-cta.png` |
| 10 | CTA before hand-off | `qa/desktop-10-cta-before-handoff.png` | — |
| 11 | Interview after hand-off (`/remember/write`) | `qa/desktop-11-interview-landing.png` | — |

## Assessment

### What already works

- **Restraint and palette.** Near-black field, warm paper type, and one muted accent. Nothing competes with the words.
- **Type hierarchy.** The single large serif name, small tracked metadata, and generous negative space read as an exhibition wall, not a dashboard.
- **Beat timing.** Counters now hold for about 0.12 of progress (about 430px of scroll on desktop, frame 7). One message line is visible at a time (frame 8). The join beat isolates the CTA (frame 9).
- **Honesty markers.** TO CONFIRM, PLACEHOLDER, and PLACEHOLDER VALUES are visible everywhere they apply.
- **Hand-off.** The CTA leads to the real interview (frame 11). Back returns to the museum (covered by the browser test).
- **Mobile layout.** No horizontal overflow. Type scales. CTA is full width.

### What reads as a webpage, not a journey

1. **Scene 01 has no visible person.** The portrait placeholder is a dark gradient, so the frame is black with type on it. The centerpiece the brief asks for is absent. Scale only changes the typography, so this reads as a title card.
2. **Transitions are crossfades between full-screen slides.** Frame 3 shows YERIEL fading to a ghosted MOFUNDO. No object carries across, and the camera move that should sell the change is invisible on a near-black plate.
3. **Photographs look like wireframes.** The six placeholder plates are flat grey rectangles with tiny captions. They take up space but have no depth, light, or texture, so they read as layout blocks (frames 4 and 6).
4. **Scene 03 reads as UI cards.** "PERSON A · PLACEHOLDER", "PLACE 1 · PLACEHOLDER", and the boxed tags look like labeled UI elements scattered across the screen. This is the "floating cards" risk the brief warns about. The question also overlaps a plate on the right (frame 6).
5. **Scene 04 counters look like a stats grid.** A centered 3×2 grid of numbers with labels and a tag is the shape of a landing-page statistics block (frame 7). It needs to sit inside the environment and pull outward, not sit on its own.
6. **The join is a website hero.** Centered heading, paragraph, and a solid button (frame 9). Correct content, but the composition is an ordinary landing block.
7. **Sound and motion are invisible.** The sound control shows "No track yet", and the camera zoom and drift move nothing visible, so the prototype has no sensory sign of traveling.

### Verdict

Strong typographic and tonal foundation. The layout is currently a sequence of centered web blocks with fades between them. It does not yet feel like moving through a space. The gap is spatial: depth, objects in motion, and an environment that persists across scenes. That is what the rendering layer must provide, and it is why the next step is a renderer proposal, not more DOM polish.

## Follow-ups (recorded, not done in this pass)

- Scene 01: a centerpiece that is visible even as a placeholder (for example a clearly generic silhouette plate, lit, with depth layers).
- Scene 02 and 03: photographs with depth (parallax in space), not flat plates.
- Scene 04: counters placed in the environment as the camera pulls out, not as a grid.
- Transitions: objects carry across scenes (see `docs/MUSEUM_RENDERING_PROPOSAL.md`).
