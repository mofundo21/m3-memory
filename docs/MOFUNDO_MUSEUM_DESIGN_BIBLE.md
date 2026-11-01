# MOFUNDO Museum — Design Bible (Revised, Phase 2)

Status: Revised to the four-scene cinematic structure. **No Phase 3 implementation until approved.**
Supersedes the earlier five-act, interactive-constellation version.
Tier: 2 for the build (new user-facing experience, route into the interview). This document is Tier 1.
Companion: `docs/MUSEUM_REFERENCE_ANALYSIS.md`.

---

## 0. Concept

A single cinematic sequence about Yeriel / MOFUNDO. The visitor enters, scrolls, and the world transforms around one person. It ends by asking the visitor for their own memory.

It is a **guided cinematic exhibition**, not an interactive museum. There are no exhibits to choose, no cards to click, no navigation between sections, and no required stops. Scroll controls progression. The camera and composition do the storytelling.

The only major action is **TELL ME HOW WE MET →**, which leads into the existing interview at `/remember/write`.

### Guiding statements

1. **One continuous sequence.** Four scenes that transform into each other. No hard cuts where avoidable.
2. **Show, don't guide.** The visual change tells the story. Copy is short.
3. **Person first.** The camera is always on Yeriel or on what surrounds him.
4. **Incomplete on purpose.** The sequence ends with the sense that the story has gaps only other people can fill.
5. **Technology disappears behind the story.** No visible UI chrome beyond what is needed.

### Not this

- Not an interactive museum or a map of exhibits.
- Not a portfolio, résumé, or grid of projects.
- Not a game menu, HUD, or cyberpunk dashboard.
- Not glassmorphism. Not neon purple gradients.
- Not a stack of five website sections.

---

## 1. Emotional Arc

| Scene | Visitor feeling | Question in their head |
|---|---|---|
| Enter | Deliberate, quiet | "What is this?" |
| 01 YERIEL | Intimacy | "Who is this?" |
| 02 MOFUNDO | Fullness, momentum | "What did he build out of his life?" |
| 03 HOW DO YOU REMEMBER HIM? | Realization | "These are other people's memories of him." |
| 04 JOIN THE STORY | Scale, then stillness, then invitation | "I have a piece of this." |
| Interview | Agency, calm | "I'm adding my part." |

Brief progression preserved: **who is this → I'm moving through his life → it's full of people and places → these are other people's memories → he's reconstructing his life from everyone who was there → I know him → I have a story → tell me how we met.**

---

## 2. Structure and Scroll

- **One sequence.** One fixed stage, one camera, one scroll track.
- **Four scenes**, each a continuous state of the same stage. Scenes do not stack as page sections.
- **Scroll is the only control.** There are no stopping points that require interaction. Holds exist for reading, but scrolling resumes without a click.
- **Length:** about 3–4 minutes for a reader. Target scroll track: about 5 viewports on desktop, about 4 on mobile. This is a tuning target, not a requirement.
- **No excessive distance.** No scene is longer than about 1.5 viewports of scroll.

### Scene ranges (normalized progress, tune in Phase 4)

| Segment | Range |
|---|---|
| Enter (ENTER control, then darkness) | 0.00 – 0.04 |
| 01 YERIEL | 0.04 – 0.30 |
| 02 MOFUNDO | 0.30 – 0.54 |
| 03 HOW DO YOU REMEMBER HIM? | 0.54 – 0.76 |
| 04 JOIN THE STORY | 0.76 – 0.98 |
| Hand-off to interview | 0.98 – 1.00 (then navigation) |

Transitions between scenes are overlapping ranges, so each scene's exit begins while the next one's entrance has started.

### Single required action

- **ENTER** is the only control before the sequence starts. It exists for two reasons: it marks a deliberate entrance, and it gives the browser the user gesture needed for optional audio. It does not branch the experience.
- **TELL ME HOW WE MET →** at the end is the only control that leads out of the sequence.

Nothing else is interactive.

---

## 3. Global Visual System

### 3.1 Color

Reuses project tokens from `src/app/globals.css`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B1012` | Stage (near-black, slight blue-green) |
| `--surface` | `#11181B` | Quiet plates |
| `--paper` | `#F2EADB` | Warm white. Interview surface and final text |
| `--text` | `#F4EFE7` | Text on dark |
| `--muted` | `#AFAEA8` | Metadata. About 8.5:1 on `--bg` |
| `--purple` | `#B89BFF` | Single accent, used on almost nothing: the ENTER control's focus ring and the CTA's underline on hover. ≤ 2% of pixels |

**Rules**
- The stage is dark for most of the sequence. Scene 04 is the darkest. The interview is paper.
- No purple backgrounds, gradients, or glows.
- Photographs keep their own color.
- Text on any image sits on a dark scrim that guarantees ≥ 4.5:1 contrast.

### 3.2 Typography

Existing fonts: Playfair Display 700 (display), Inter 400–700 (body, metadata), Caveat (reserved for contributor voice, used only in Scene 03 placeholder fragments and the interview).

| Role | Face | Desktop / mobile | Weight | Notes |
|---|---|---|---|---|
| Name (Scene 01 "YERIEL", Scene 02 "MOFUNDO") | Playfair Display | 120–180px / 52–80px | 700 | One word on screen. Letter-spacing 0.02em |
| Question (Scene 03) | Playfair Display | 64–104px / 36–52px | 700 | "HOW DO YOU REMEMBER HIM?" |
| Statement (Scene 04) | Playfair Display | 56–88px / 36–52px | 700 | One line at a time |
| Body / explanation | Inter | 20–22px / 18px | 400 | Max 52ch. Used once, in Scene 04 |
| Metadata | Inter | 12px / 12px | 600 | UPPERCASE, +0.12em tracking, tabular numerals |
| Counter figures | Playfair Display | 56–96px / 40–56px | 700 | Labels in metadata style |
| Contributor voice (placeholder) | Caveat | 24–32px | 400 | Scene 03 only |

**Behaviors**
- **Weight transform:** the name starts light (Playfair 400, opacity 0) and resolves to 700 as it becomes the focus. Scene 01 → 02: "YERIEL" does not disappear. It shrinks, moves to a metadata line above the stage, and "MOFUNDO" resolves in its place. This is the visual identity change.
- **Line reveal:** lines enter by mask (translate up 100% → 0) over 700–900ms.
- **Text is screen-anchored.** Copy does not move with the camera. Only what is behind it moves in depth.

### 3.3 Spacing

- 8px base scale: 8, 16, 24, 32, 48, 64, 96, 128.
- Stage margins 48px desktop, 20px mobile. Max text measure 52–60ch.
- At least 40% of the stage is empty at any moment of a text hold.

### 3.4 Archival metadata

Metadata appears as small labels attached to what is on screen. It is quiet and factual.

```
1991 · BRONX, NEW YORK
```

Rules
- Dates use only the precision known. `c.` for approximate. Never invented.
- Placeholder content is labeled `PLACEHOLDER` in visible text.
- Metadata is decoration for the story. It is never a list to read.

---

## 4. Camera Language

There is **one camera** on **one continuous path** through the stage. The camera never cuts. Every scene is a camera state.

| Move | Used for | Parameters |
|---|---|---|
| Dolly in | Scene 01: approaching Yeriel | Slow, 2–3 scroll-viewports of travel |
| Dolly / drift back | Scene 01 → 02: Yeriel recedes as MOFUNDO's world expands | Eased, same path, no rotation |
| Lateral drift | Scene 02: accumulation passes by | Max 10% of stage width per beat |
| Depth travel through the field | Scene 03: other people's perspectives surround him | Camera moves through layers. Depth separation increases |
| Pull back | Scene 04: the archive's scale is revealed | Slowest move in the piece |
| Settle | Scene 04 end: silence | Damped, no overshoot |

**Rules**
- No roll. Pitch and yaw ≤ 3°, and only in Scene 03 for depth feel.
- Scroll velocity is clamped. A fast flick cannot skip a scene's key moment: the camera eases to the scene's key frame.
- The camera never moves on pointer input. No parallax on desktop or mobile.
- Reduced motion: no camera travel at all. Scenes transition by crossfade and the static composition for each scene is used instead.

---

## 5. Motion Language

- **Easing:** one entrance curve `cubic-bezier(0.2, 0.7, 0.1, 1)`, one exit curve `cubic-bezier(0.6, 0, 0.8, 0.2)`, damped spring for camera settle. Nothing bounces.
- **Durations:** element enter 700–900ms; scene transform 1.6–2.4s, driven by scroll (not time).
- **Scroll is the clock.** Animations are tied to scroll progress. Time-based animation is used only for the loader, counters, and the final hand-off.
- **Permanent motion:** dust in light (desktop only) and a slow grain shift. Both stop under reduced motion.
- **Stillness is a scene element.** Scene 04's final moments are a hold with nearly no motion.

---

## 6. Transition Language

The principle: **the thing that was important carries into the next scene.** Each transition uses continuity, not cuts.

| From → To | Continuity object | What happens |
|---|---|---|
| Enter → 01 | The light | Darkness, then a single beam finds the portrait |
| 01 → 02 | The name | "YERIEL" shrinks to metadata. The portrait recedes into one photograph among many. "MOFUNDO" resolves in the same spot |
| 02 → 03 | The accumulated field | Photographs, sound lines, and artifacts drift backward into depth. They become the background layers for the other people's perspectives |
| 03 → 04 | The question | "HOW DO YOU REMEMBER HIM?" remains, then sinks to the bottom of the stage as the camera pulls out |
| 04 → Interview | The CTA | Described in §14 |

**Forbidden:** hard cuts between scenes (except reduced-motion crossfade), wipes, colored bars, page flips, loading spinners between scenes, glitch effects.

---

## 7. Particle Philosophy

- Particles are **dust in light**. They appear only in the beam over the current focal subject. They do not represent people or data.
- Counts: desktop ≤ 300; mobile ≤ 40; low-power and reduced motion: 0.
- Drift ≤ 4px/s. No pointer reactions.
- Particles fade in Scene 04 and vanish at the final message.

---

## 8. Shader Philosophy

- **At most one custom fragment shader** in v1: film grain, soft vignette, and a gentle depth blur on the focal layer.
- No animated noise backgrounds, chromatic aberration, glitch, or raymarching.
- Compiled only when needed. Disposed on leave.
- No-WebGL fallback: CSS grain (static noise texture) and CSS vignette. Depth blur becomes a single `filter: blur` or is off.

---

## 9. Sound Philosophy

Sound is a background layer that supports the sequence. The story must work without it.

### 9.1 Principles
- **Background music only.** A single ambient track for the whole sequence. No sounds tied to individual people, places, or photos. No sound-per-scene design.
- **Off by default.** Nothing plays until the visitor turns it on with the persistent sound control. No autoplay.
- **Low volume.** Default 0.35 of full scale (`museumAudioConfig.ts`).
- **Captions are not needed**, because no information is carried by sound alone.
- **Placeholder track path:** `/media/museum-ambient.mp3`. **No file is bundled.** Yeriel will replace it later with MOFUNDO's own music.

### 9.2 Behavior
- **Control:** one persistent control, top-right, text label `Sound: Off` / `Sound: On`. If the file is missing, it reads `No track yet`, muted, and is not an error.
- **Enable:** the visitor's click on the control. This is the browser's user gesture.
- **Fades:** in and out over 1.2s. Scene 04's final silence fades the bed to zero. The hand-off to the interview fades out before navigation.
- **Persistence:** the on/off choice is stored in `localStorage` only.
- **Reduced motion:** does not auto-enable audio.
- **Missing file:** the museum is completely silent and otherwise identical.

Implementation contract is in `src/lib/museumAudioConfig.ts`.

---

## 10. Loading Experience

1. **Start:** solid `--bg`. Nothing animates before first paint.
2. **Name first:** `MOFUNDO` centered, Playfair 700, 28px. Below it, `the living museum` in Inter 12px tracked.
3. **Honest progress:** a 1px hairline fills with real fetch progress for the first scene's assets. No invented percentages.
4. **Unknown progress:** a slow indeterminate pulse, no number.
5. **Ready:** the wordmark fades and ENTER appears.
6. **Failure:** if the sequence's assets fail, the 2D fallback (§15) loads. The visitor never sees an error page.

Budget: ENTER is interactive within 2.5s on a mid-range desktop and 3.5s on a mid-range phone on 4G.

---

## 11. Scene Specifications

Each scene: purpose, what the visitor sees, what changes on scroll, camera, typography, media, interaction, transition out, sound, mobile, reduced motion, placeholders, and real data.

### 11.0 Enter

- **Purpose:** a deliberate threshold.
- **Sees:** black stage, `MOFUNDO` wordmark, **ENTER**.
- **Scroll change:** none until ENTER is pressed. After ENTER, the wordmark dissolves and the light appears.
- **Camera:** still, with a 0.3% breathing scale.
- **Typography:** wordmark 28px. ENTER in Inter 600, 14px, tracked, 44px tap target.
- **Media:** none.
- **Interaction:** ENTER only.
- **Transition out:** darkness, then a single light beam falls on the portrait's position.
- **Sound:** off. Entering does not turn sound on.
- **Mobile:** ENTER centered at the bottom with safe-area padding.
- **Reduced motion:** the light is a cut.
- **Placeholders:** `portrait-placeholder.svg`.
- **Real data:** none.

### 11.1 Scene 01 — YERIEL

- **Purpose:** meet the person. *Before MOFUNDO, there was Yeriel.*
- **Sees:** a single portrait in a beam. The name **YERIEL** in Playfair 700, very large. Below it, metadata: `1991 · BRONX, NEW YORK`. **Both values need Yeriel's confirmation.** Until then they carry a `TO CONFIRM` tag.
- **Fragments:** a few small early-life fragments appear at the edges of the frame, one at a time. Maximum three visible. Each is a short metadata line (a date, a place, or an object), not a sentence. These are placeholders until approved content exists.
- **Scroll change:** the camera dollies in slowly. The name settles. Fragments enter and leave.
- **Camera:** dolly in, 2–3 viewports of travel.
- **Typography:** the name uses the weight reveal. Fragments use metadata style.
- **Media:** the portrait is a depth-separated photograph when real. **Now: `portrait-placeholder.svg`.** No generated face. Later, the portrait is split into background, subject, and foreground layers for subtle depth.
- **Interaction:** none.
- **Transition out:** the name starts to shrink and the portrait starts receding. Both continue into Scene 02 (§6).
- **Sound:** ambient bed only, if on.
- **Mobile:** portrait fills the height. Fragments appear as a single line at the bottom, one at a time. Depth layers reduced to two.
- **Reduced motion:** static composition. Fragments crossfade.
- **Placeholders:** `portrait-placeholder.svg`, with fragments labeled `PLACEHOLDER`.
- **Real data:** Yeriel's approved portrait and depth layers, confirmed metadata, and approved early fragments.

### 11.2 Scene 02 — MOFUNDO

- **Purpose:** the creative identity fills in. This is accumulation, not a list.
- **Sees:** the name **MOFUNDO** resolves into the spot where YERIEL was. Around it, the world becomes fuller, layer by layer:
  - photographs (placeholder photos) drift past at different depths, overlapping slightly
  - a sound waveform line passes behind the name, as a visual sign of music
  - artifacts (placeholder plates) pass through, with minimal labels: year and kind
  - a few video stills appear, each as a frame drifting through depth
- **No grid, no sections, no categories on screen.** No labels such as "Photography" or "Music". Items arrive as one continuous flow.
- **Scroll change:** items enter from the edges and recede into depth. Density rises slowly. Holds leave the frame at least 40% empty.
- **Camera:** lateral drift, max 10% of stage width per beat, plus a slow dolly back.
- **Typography:** MOFUNDO in display type, then shrinking to a metadata line while the field fills.
- **Media:**
  - Photos: `photo-placeholder-01.svg` through `06.svg`.
  - Video stills: placeholders reuse the photo plates with a small play glyph (not interactive).
  - Sound: a waveform SVG line.
  - Artifacts (flyers, wristbands, cameras, album covers): placeholder plates, labeled `PLACEHOLDER`. Not yet created; the plates reuse the same placeholder images.
- **Interaction:** none.
- **Transition out:** the field of items begins drifting backward into depth and the camera's focus shifts from "who is he" to "who is he to others" (§6, 02 → 03).
- **Sound:** the waveform line is visual. Music only if the ambient bed is on.
- **Mobile:** items enter one at a time from the sides, at most three on screen. Vertical scroll only.
- **Reduced motion:** items crossfade in place. No drift. The field is a static arrangement.
- **Placeholders:** six photo plates (created), one waveform SVG (to create), artifact plates (reuse the photo plates for now).
- **Real data:** approved photographs with dates and places, approved artifact scans, Yeriel's confirmation of each period, and approved names for music, shows, and festivals. Names are never inferred.

### 11.3 Scene 03 — HOW DO YOU REMEMBER HIM?

- **Purpose:** the emotional shift. The sequence moves from Yeriel's self-image to how other people hold him.
- **Sees:** the question **HOW DO YOU REMEMBER HIM?** in display type, centered. Behind and around it, the accumulated photographs and labels move into depth and begin to overlap, and other evidence enters:
  - names appear (placeholder: `Person A`, `Person B` ... with the label `PLACEHOLDER`)
  - places appear (`Place 1 — PLACEHOLDER`)
  - events and dates appear (`Event — PLACEHOLDER · Oct 2025` style, placeholder)
  - photographs move through space, overlapping
  - connections briefly form as hairlines between a name, a place, and a photo, then fade
  - short memory fragments appear in Caveat, each labeled as a placeholder, never as a testimonial
- **Scroll change:** the camera passes through layers of evidence. Each layer is a different perspective. Connections form and dissolve as the camera passes. The question stays anchored to screen center until the end.
- **Camera:** depth travel with mild pitch/yaw (≤ 3°). Layers separate in depth so the visitor perceives many perspectives at once.
- **Typography:** the question in Playfair display. Names, places, and dates in metadata style. Fragments in Caveat.
- **Media:** placeholder photos reused, with labels. Placeholder names and places are role labels, not real.
- **Interaction:** none. The visitor does not explore these relationships. The sequence shows them.
- **Transition out:** the question sinks to the bottom of the stage as the camera begins to pull back (§6, 03 → 04).
- **Sound:** ambient bed only, if on.
- **Mobile:** the depth travel is reduced. At most four evidence elements on screen at once. Fragments one per screen.
- **Reduced motion:** the question and a static arrangement of evidence, crossfading between two or three arrangements. No depth travel.
- **Placeholders:** placeholder name, place, event, and date labels (typed adapter, §20); placeholder fragments; placeholder photos.
- **Real data:** approved public-safe names and places (only with contributor attribution allowed), approved events, approved dates, and approved memory fragments with attribution respecting each contributor's preference. Anonymous stays anonymous.

### 11.4 Scene 04 — JOIN THE STORY

This scene absorbs the old "Story So Far" and its counters. It runs in four beats, all in one continuous camera move.

1. **Scale (pull back).** The camera pulls out. The accumulated names, photos, places, and fragments form a wide field. Counters appear within it, not as a dashboard:
   - PEOPLE · MEMORIES · PLACES · ENCOUNTERS · PHOTOGRAPHS · YEARS
   - Each counter is a figure in Playfair with its label beneath in metadata style.
   - **Placeholder values** are shown with a visible `PLACEHOLDER VALUES` tag on the group. They are never presented as real statistics.
   - When a counter has no computable value, it reads `—` and `PENDING`.
   - Counters count up once, over about 1.2s, then hold. They never re-animate.
2. **Simplify.** The busy world disappears. Names fade. Photos fade. Sound recedes to silence (the ambient bed fades to zero). Connections disappear. The screen empties.
3. **The message.** In sequence, one line at a time, centered:
   - **ONE PERSON CAN'T REMEMBER AN ENTIRE LIFE.**
   - **THAT'S WHERE YOU COME IN.**
   - **YOU MAY REMEMBER A PIECE I DON'T.**
4. **Join.** The final heading **JOIN THE STORY**, then a single short explanation (below), then the CTA.

**The explanation** (Inter 20px, max 2 lines, nothing more):

> If we've crossed paths, tell me how you remember it. Where were we? What happened? Even a small detail can become part of the archive.

**The CTA:** **TELL ME HOW WE MET →** (Inter 600, 18px, tracked, uppercase). It uses a `--paper` plate with `--bg` text. It is the only interactive element on the stage and the only major action in the experience.

- **Scroll change:** after the message, scroll does nothing visible. The final hold keeps the CTA fully visible. The page does not scroll past it.
- **Camera:** pull back, then settle. Final frame is still.
- **Typography:** counters in Playfair figures with metadata labels; message lines in Playfair display; explanation in Inter; CTA in Inter.
- **Media:** none in the final frames.
- **Interaction:** TELL ME HOW WE MET → only.
- **Transition out:** §14.
- **Sound:** bed rises again for the final line, then fades to silence at the CTA press.
- **Mobile:** counters in a two-column grid. Message lines one per screen. CTA full width, ≥ 56px tall, safe-area padding.
- **Reduced motion:** counters show final values at once. The pull back is a crossfade. Message lines appear one at a time with no motion.
- **Placeholders:** placeholder counter values in an adapter, clearly tagged; the message and explanation copy.
- **Real data:** a public-safe aggregate endpoint returning counts only, with no identities and no per-person dates. Until it exists, counters show placeholder values with the `PLACEHOLDER VALUES` tag or `PENDING`.

---

## 12. Navigation

The sequence does not need navigation. Minimal controls only:

- **Sound control** (top-right, always visible, §9).
- **Leave link** (top-left, small): `Leave` → `/`. The museum never traps a visitor.
- **Skip link** (visible on focus): `Skip to Join the story`, which scrolls to Scene 04's final hold. This serves keyboard and screen-reader users.
- **No act markers, no hash navigation between scenes, no menus.**

The sequence is reachable at `/museum` (proposed, §21).

---

## 13. Cursor Behavior

- The system cursor is never replaced.
- Over ENTER and the CTA: `pointer`.
- Nothing else reacts to the cursor.
- No cursor-following effects, no drag.
- Mobile: touch scroll only.

---

## 14. Hand-off Into the Interview

Approved destination (D1): **`/remember/write`**.

The principle from the brief: the JOIN THE STORY scene visually transforms into the interview. It is not a click into a random form.

### Sequence (desktop; mobile is shorter)

| Time | What happens |
|---|---|
| 0ms | The visitor activates **TELL ME HOW WE MET →**. |
| 0–600ms | The CTA's paper plate expands (FLIP) to fill the stage. The dark stage begins to disappear. |
| 200–900ms | Dust, grain, and the remaining light fade out. |
| 0–1200ms | Ambient audio fades to silence. |
| 400–1300ms | The expanded paper surface keeps **JOIN THE STORY** briefly, then its type fades. |
| ~1400ms | Client navigation to `/remember/write`. |
| 1400–2000ms | The interview's first screen settles on the paper surface. Step 2 of 4 is visible, the surface matches the interview's warm tone, and the visual handoff reads as continuous. |

### Rules
- It is a real navigation. The CTA is an `<a href="/remember/write">`. Back returns the visitor to `/museum`.
- Without JavaScript it is a plain page load.
- Reduced motion: an instant navigation.
- No museum styling or Three.js is loaded into the interview. The interview keeps its own design (not redesigned in this work).
- The hand-off does not write any state the interview depends on and does not preload its media.

---

## 15. Mobile and 2D Fallback

- **Mobile is a deliberate adaptation.** Breakpoints: `≤ 600px` phone, `601–1023px` tablet, `≥ 1024px` desktop.
- **Input:** touch scroll and two taps (ENTER, CTA). Nothing else.
- **Targets:** ≥ 44px for the two controls.
- **Safe areas:** `env(safe-area-inset-*)` respected for sound control, leave link, and CTA.
- **Viewport:** `100dvh` with a `100vh` fallback. No layout depends on the address bar.
- **Scroll track:** shorter on mobile (about 4 viewports).

### 2D fallback (WebGL unavailable or low-power device)

The same four scenes, in the same order, with the same copy, holds, and CTA, as full-screen CSS layers:
- the portrait as a single image with two-layer CSS parallax (or none)
- photographs and artifacts as drifting CSS-positioned plates
- evidence and connections as an SVG overlay
- counters as static figures
- the hand-off as a fade rather than an expansion

**The story must survive without advanced WebGL.** This is tested in Phase 4.

---

## 16. Accessibility

- **Structure:** one `<main>`, one `<h1>` ("Yeriel" for Scene 01 text), and `<h2>`s for each scene's heading, visually small or hidden where the visual is the heading.
- **Text version:** the whole sequence is also available as ordered text in the DOM, in scene order (a visually hidden block, or a "Read as text" view). Screen-reader users hear the same four scenes, the counters with their labels and placeholder/pending status, and the CTA. This is the accessible equivalent of the scroll and is not optional.
- **Focus:** 2px `--purple` ring with 2px offset. Visible on the ENTER control, the sound control, the leave link, the skip link, and the CTA.
- **Keyboard:** Tab reaches the controls in visual order. Space, Page Down and arrow keys scroll the sequence normally.
- **Live regions:** none for scroll-driven changes. Scene headings are not announced as they appear. No aria-live spam.
- **Contrast:** body and metadata ≥ 4.5:1 on `--bg`. Display text ≥ 3:1.
- **Motion:** `prefers-reduced-motion: reduce` removes camera travel, scroll-driven scrub, particles, and staggered reveals. Scenes become static compositions that crossfade.
- **Sound:** off by default. Nothing carries meaning through sound alone, so no captions are needed.
- **Images:** placeholder photos have alt text stating they are placeholders (for example "Placeholder photograph 01, date and place to confirm"). Real alt text is written with Yeriel.
- **Zoom:** 200% zoom keeps text readable without horizontal scroll.
- **Targets:** 44px minimum for touch.
- **Language:** `lang="en"`.

---

## 17. Reduced Motion, Sound Off, and WebGL Unavailable

| Condition | Camera | Particles | Shaders | Transitions | Sound | Content |
|---|---|---|---|---|---|---|
| Default desktop | Full | ≤ 300 | Grain + blur | Scroll-driven | Off until toggled | Full |
| Desktop, reduced motion | None | 0 | Static grain | Crossfades | Off | Full |
| Mobile | Reduced depth | ≤ 40 | Grain | Shorter | Off until toggled | Full |
| Low-power or WebGL unavailable | None (2D) | 0 | CSS only | Fade | Off until toggled | Full |
| Sound off (any) | Unchanged | Unchanged | Unchanged | Unchanged | Silent | Unchanged |
| Missing audio file | Unchanged | Unchanged | Unchanged | Unchanged | "No track yet" | Unchanged |
| Slow connection | 2D | Reduced | Reduced | Full | Off | Text first, media lazy |

**Invariant:** no combination removes any story content.

---

## 18. Performance Budget

Targets to be measured in Phase 3 and 4. These are proposals.

| Metric | Desktop | Mobile |
|---|---|---|
| Museum route first JS (gzip, excl. fonts) | ≤ 180 KB | ≤ 150 KB |
| Three.js + R3F (only if adopted; lazy) | ≤ 250 KB | ≤ 250 KB, capable devices only |
| First-scene payload (portrait, placeholder photos, fonts) | ≤ 600 KB | ≤ 350 KB |
| ENTER interactive | ≤ 2.5s | ≤ 3.5s (4G) |
| Frame rate, holds | 60 fps | 30 fps floor |
| Frame rate, camera travel | 60 fps | 30 fps floor |
| DPR cap | 2 | 1.5 |
| Particles | ≤ 300 | ≤ 40 |
| Visible evidence elements (Scene 03) | ≤ 16 | ≤ 4 |
| Video | none in Phase 3 | none in Phase 3 |

**Measures**
- Lazy-load each scene's assets when the visitor is within one scene of it.
- Pause rendering when the stage is off-screen or the tab is hidden.
- Dispose geometry, materials, textures, and listeners on route leave.
- Adaptive DPR when frame time exceeds budget for a sustained window.
- Explicit tier at load (`high`, `medium`, `low`) from device memory, cores, DPR, and a short frame-time sample. Not user-agent sniffing alone.
- Placeholder SVGs are small. Real photos follow the compression targets in §19.
- Each effect added in Phase 6 must show a before/after budget delta.

---

## 19. Asset Strategy

### 19.1 Now: placeholder photos

Placeholder images are generated as labeled plates, not personal imagery:

| File | Purpose |
|---|---|
| `public/media/museum/placeholders/portrait-placeholder.svg` | Scene 01 portrait |
| `public/media/museum/placeholders/photo-placeholder-01.svg` … `06.svg` | Scene 02 and 03 photographs |

Each says `PLACEHOLDER` on its face. No faces, no real places, no dates.

### 19.2 Typed manifest (Phase 3)

`src/lib/museumAssets.ts` is the single asset source. Categories: `portrait`, `childhood`, `photography`, `music`, `events`, `artifacts`, `audio`, `archiveMedia`.

Each entry: `id`, `category`, `scene` (01–04), `status` (`placeholder` | `pending-approval` | `approved`), `expectedFile`, `recommendedDimensions`, `format`, `compressionTarget`, `purpose`, `altText`, `caption`, `source` (`placeholder` | `archive`).

### 19.3 Expected real files (later, from Yeriel)

| Asset | Expected file | Size | Format | Target |
|---|---|---|---|---|
| Portrait (background) | `public/media/museum/portrait-bg.avif` | 2400×3000 | AVIF / WebP | ≤ 220 KB |
| Portrait (subject cutout) | `public/media/museum/portrait-subject.webp` | 2400×3000, alpha | WebP alpha | ≤ 260 KB |
| Photographs | `public/media/museum/photo/*.avif` | 1600 long edge | AVIF / WebP | ≤ 160 KB each |
| Artifacts | `public/media/museum/artifacts/*.avif` | 1200 long edge | AVIF / WebP | ≤ 120 KB each |
| Video stills | `public/media/museum/video/*.avif` | 1280×720 | AVIF / WebP | ≤ 120 KB each |
| Ambient bed | `public/media/museum-ambient.mp3` | stereo | MP3 / AAC 128 kbps | ≤ 2 MB, loop-clean |

### 19.4 Rules
- Nothing personal is generated: no AI faces, voices, or memories.
- No real names, dates, or places in placeholder data.
- Every placeholder labels itself.
- Real assets need `approved` status before they appear on the stage.

---

## 20. Archive Data

- **Typed adapter** `MuseumArchiveAdapter` returns a `MuseumDataset`. Every entity carries `source: 'placeholder' | 'archive'`. Every counter carries `status: 'placeholder' | 'live' | 'pending'`.
- **Placeholder adapter is the only implementation** until a public-safe view is approved (D3). Placeholder counter values are returned with `status: 'placeholder'` and rendered with the `PLACEHOLDER VALUES` tag.
- **Public-safe view or endpoint** (later, Tier 3 review): returns only approved, public-safe records. No contributor contact, no private notes, no original-submission JSON, no review fields. Names only when `attributionPreference` allows. Anonymous stays anonymous. Counts are aggregates, not per-person.
- **Client never queries private tables.** Data reaches the sequence through a server route or a reviewed view.
- **Layers stay separate** (per `docs/HISTORICAL_INTEGRITY.md`): contributor memory, Yeriel's material, AI observation, confirmed evidence, and story drafts are never merged on the stage. Only approved contributor memories and approved Yeriel-authored material appear.
- **AI never writes museum copy as fact.** AI prose is never shown as a memory.
- The existing `attributionPreference` field in `src/lib/types.ts` is the attribution control the museum must honor.

---

## 21. Routes

- `/` — existing landing page. May gain one "Enter the museum" link. Not removed.
- `/museum` — **new**, the sequence. Route name is a proposal, pending approval.
- `/remember` — existing cinematic intro, unchanged.
- `/remember/write` — the interview's real start, destination of the hand-off (D1).
- `/submit` — legacy redirect to `/remember`, unchanged.

---

## 22. Governance

- **Phase 2 (this document):** Tier 1, documentation.
- **Phase 3 onward:** Tier 2. The hand-off (Phase 5) is Tier 2. Any archive read in Phase 4 is **Tier 3**.
- **Reviewer:** per `docs/AI_SYSTEM.md`, if Claude builds, Codex reviews. Second-model review before merge.
- **Ponytail check before Phase 3:** no new dependencies are justified yet. Build on the existing stack first. Any addition (three.js, R3F, GSAP) needs its own justification.
- **Graphify:** update after code changes, per `CLAUDE.md`.

---

## 23. Phase 3 Scope Preview (not started)

After this revision is approved:
1. `/museum` route with the sequence shell: stage, scroll track, ENTER, sound control, leave link, skip link, loader.
2. Scene registry in config: four scenes, ranges, copy, placeholder references.
3. Camera state per scene with interpolation along scroll progress.
4. Typed `MuseumArchiveAdapter` (placeholder only).
5. Scene 01 and 02 with placeholder portrait and photos.
6. Reduced-motion and 2D fallback.
7. Audio controller reading `museumAudioConfig.ts`, working with no file.

Scene 03 and Scene 04 follow once 01–02 are proven. No polish, shaders, or particles until the architecture works.

---

## 24. Open Questions for Yeriel

1. **Confirm the Scene 01 metadata** (1991 · Bronx, New York). Until confirmed, it stays tagged `TO CONFIRM`.
2. **Route name:** `/museum`, or another name?
3. **Portrait:** is a depth-separated cutout of your own photograph acceptable for Scene 01 later?
4. **Scene 04 message lines:** the three lines in this document are drafts from the brief. Keep them as written, or change the wording?
