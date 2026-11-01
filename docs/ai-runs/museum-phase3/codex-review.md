NOT READY — the foundation is promising, but reduced-motion content loss, inaccessible focus behavior, a potentially hanging CTA transition, and a production Supabase failure in the final interview action are release-blocking.

1. **Blocker — legitimate**  
   **Files:** `src/app/remember/actions.ts:87`, `src/lib/db.ts:582`  
   **Problem:** `updatePreferencesAction()` calls `updateSubmissionPreferences()` without an admin token, while the Supabase branch requires one and throws `UNAUTHENTICATED`. Moving `redirect()` outside the `try` correctly fixes SQLite redirect handling, but does not make the production action work.  
   **Failure scenario:** A production contributor reaches `/remember/final`, selects attribution preferences, presses “Send My Memory,” and receives “Failed to save preferences: UNAUTHENTICATED” instead of `/thanks`. The SQLite smoke test passes and hides the production failure.  
   **Suggested fix:** Create a narrowly scoped server-side preference-update path authorized by an unguessable submission-scoped capability, or another reviewed contributor-safe mechanism. Do not grant anonymous general update access and do not reuse admin credentials in the browser. Add a Supabase-path test.  
   **Why legitimate:** This follows directly from `requireSupabaseAdminToken()` throwing when no token is provided.

2. **Major — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:72`, `src/components/museum/MuseumSequence.tsx:256`, `src/components/museum/MuseumSequence.tsx:275`, `src/lib/museumCamera.ts:56`  
   **Problem:** Reduced-motion mode makes `reveal()` return `1` for every interval. Expressions intended to fade content out therefore become `1 * (1 - 1)`, hiding the Scene 04 counters and every message line permanently. At progress exactly `1`, `sceneActive()` also hides the final scene because it tests `p < scene.end`.  
   **Failure scenario:** A visitor with `prefers-reduced-motion: reduce` never sees the counters or the three central invitation statements; at the bottom of the track the entire final visual scene disappears. This violates the design contract’s “no combination removes any story content” invariant.  
   **Suggested fix:** Define explicit static reduced-motion compositions instead of substituting `1` into timeline math. Keep all required Scene 04 content visible, use discrete scene crossfades, and make the final scene active at `p === 1`.

3. **Major — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:129`, `src/components/museum/MuseumSequence.tsx:134`, `src/components/museum/MuseumSequence.tsx:285`  
   **Problem:** The visual stage has `aria-hidden="true"` but contains the ENTER button and final CTA, both keyboard-focusable. Elements hidden from the accessibility tree must not remain in the tab order. The CTA is also focusable from initial page load despite being visually transparent.  
   **Failure scenario:** A keyboard or screen-reader visitor tabs onto controls that have no accessible representation and may be completely invisible. Automated accessibility tools should flag focusable descendants of `aria-hidden`.  
   **Suggested fix:** Keep interactive controls outside the `aria-hidden` subtree, or expose the stage semantically and hide only its decorative layers. Gate the CTA with `inert`/tab-index and visibility state until its beat is active.

4. **Major — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:84`, `src/components/museum/MuseumSequence.tsx:105`, `src/components/museum/MuseumSequence.tsx:294`, `src/components/museum/museum.css:430`  
   **Problem:** The skip link prevents normal fragment navigation and only scrolls the cinematic track. It does not transfer focus to the destination. Its target is a permanently visually hidden section rather than an operable “Join the story” destination. That hidden section also contains a focusable link, producing another invisible tab stop.  
   **Failure scenario:** A keyboard visitor activates “Skip to Join the story,” focus stays on the skip link, and the next Tab returns to early chrome/ENTER controls rather than the CTA. Later, focus can land on the visually hidden duplicate CTA.  
   **Suggested fix:** Give the visible final CTA region a focusable target and focus it after scrolling, or provide a visible “Read as text” route/panel. Ensure only one CTA is keyboard-focusable at a time.

5. **Major — legitimate**  
   **Files:** `src/hooks/useMuseumAudio.ts:43`, `src/hooks/useMuseumAudio.ts:68`, `src/components/museum/MuseumSequence.tsx:93`  
   **Problem:** `ramp()` promises resolve only when their interval reaches its final step. `stopRamp()` clears the interval without resolving the pending promise. An audio error or a competing ramp can therefore leave `fadeOut()` unresolved, while `onJoin()` awaits it before calling `router.push()`.  
   **Failure scenario:** Audio errors during exit, or a rapid sound-toggle/CTA sequence cancels the current ramp. The visitor clicks the CTA and remains on the museum indefinitely.  
   **Suggested fix:** Store and settle the active ramp promise whenever it is cancelled, and put a bounded timeout or `finally`-based navigation around exit fading. Audio cleanup must never be allowed to block routing.

6. **Major — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:141`, `src/components/museum/MuseumSequence.tsx:178`, `src/components/museum/MuseumSequence.tsx:206`, `src/lib/museumAssets.ts:22`  
   **Problem:** Every museum image is rendered immediately. The placeholder SVGs are cheap, but swapping manifest entries for the planned real portrait and photographs will eagerly request the entire sequence on entry. This contradicts the design bible’s requirement to load assets only when within one scene.  
   **Failure scenario:** The later cinematic version requests the portrait plus six full photographs before the visitor enters, exceeding the mobile first-scene budget and delaying interactivity.  
   **Suggested fix:** Make asset activation part of scene state and mount/preload only the current and adjacent scenes. Add explicit image dimensions or equivalent stable sizing and responsive sources before real assets arrive.

7. **Major — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:14`, `src/components/museum/MuseumSequence.tsx:28`, `src/components/museum/MuseumSequence.tsx:38`, `src/components/museum/MuseumSequence.tsx:152`, `src/lib/museumConfig.ts:44`  
   **Problem:** Scene ranges, camera frames, and copy are configured, but most choreography remains hard-coded in the React component: plate layouts, evidence positions, message starts, reveal windows, transforms, and the join beat. A future WebGL renderer cannot consume “the same scene state” without reimplementing these numbers.  
   **Failure scenario:** CSS and WebGL renderers drift because timing changes require edits across JSX, config, and renderer code. Adding or reordering evidence/fragments also breaks index-based placement assumptions.  
   **Suggested fix:** Before adding WebGL, move scene beats, element timing, layout slots, and derived render state into typed scene definitions or a pure timeline evaluator. Keep DOM and WebGL as consumers of that evaluated state.

8. **Minor — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:224`, `src/components/museum/MuseumSequence.tsx:238`, `src/lib/museumArchive.ts:49`  
   **Problem:** Evidence is capped to six positions, but fragments are unbounded and positioned through index arithmetic. Counter rendering largely infers state from `dataset.source` and `value === null` instead of honoring each counter’s declared `status`.  
   **Failure scenario:** A future public-safe adapter returns more fragments or a mixed pending/live dataset. Fragments run off-screen, and pending or placeholder counters can be mislabeled.  
   **Suggested fix:** Put display limits and layout slots in the scene contract, validate adapter output, and render labels directly from each counter’s `status`.

9. **Minor — legitimate**  
   **Files:** `src/components/museum/MuseumSequence.tsx:42`, `src/components/museum/MuseumSequence.tsx:196`  
   **Problem:** `waveformPath()` performs 121 trigonometric calculations and string formatting on every scroll-driven render. The entire component and all mapped scene elements also rerender once per animation frame.  
   **Failure scenario:** This is acceptable with the current small DOM, but becomes avoidable main-thread work when scene density, real assets, or a cinematic renderer is added.  
   **Suggested fix:** Compute the deterministic waveform once at module scope. Longer term, expose progress through a renderer boundary or CSS variables so React does not reconcile the full scene tree every frame.  
   **Why not higher severity:** The present element count is small enough that this is primarily a scaling concern.

10. **Minor — legitimate**  
    **Files:** `src/components/museum/museum.css:30`, `src/components/museum/museum.css:95`, `src/components/museum/museum.css:440`, `src/hooks/useMuseumScroll.ts:54`  
    **Problem:** The stage uses `100dvh`, but the track is sized in `vh`; mobile chrome lacks safe-area padding. Address-bar changes therefore mix dynamic viewport measurements with traditional viewport units, while controls may sit under a notch or browser inset.  
    **Failure scenario:** At 390px on iOS, collapsing browser chrome changes `innerHeight` and sticky-stage height while the `400vh` track follows different viewport semantics. Progress density can jump, and the top controls can overlap the safe area.  
    **Suggested fix:** Use a consistent measured/dynamic viewport strategy for both track and stage, preserve progress across resize, and add `env(safe-area-inset-*)` to fixed chrome.  
    **Why not higher severity:** Exact behavior varies by browser and needs real-device confirmation.

11. **Major — legitimate**  
    **Files:** `scripts/v01-smoke-test.mjs:98`, `scripts/v01-smoke-test.mjs:140`, `scripts/v01-smoke-test.mjs:173`  
    **Problem:** The rewritten browser journey meaningfully exercises the current interview UI and catches the redirect regression, but it covers only SQLite. It removed the prior `mediaConsent` persistence assertion and does not exercise a non-default attribution choice, custom attribution, final notes, or any `/museum` behavior.  
    **Failure scenario:** The smoke test passes while production preference submission is broken, reduced-motion museum content is absent, and media consent stops propagating from the current details UI.  
    **Suggested fix:** Retain the browser-driven journey, add a consent-bearing fictional submission, select a non-default attribution option, assert the related mutable columns while proving `original_json` is unchanged, and add focused museum browser checks for keyboard order, reduced motion, mobile viewport, CTA routing, and absence of an audio request before interaction. Add a reviewed Supabase-path test separately.  
    **Why legitimate:** The removed media test did not validate SQLite file storage, so removing that claim was justified; removing its consent-persistence coverage was not.

12. **Minor — debatable**  
    **Files:** `src/components/museum/MuseumSequence.tsx:293`, `src/components/museum/MuseumSequence.tsx:295`  
    **Problem:** The text version is described as the “whole sequence,” but omits the Scene 01 fragments and contributor-style placeholder fragments. Its heading hierarchy also uses `MOFUNDO` as the `<h1>`, whereas the design contract specifies one `<h1>` for Yeriel/Scene 01.  
    **Failure scenario:** Screen-reader users receive a materially shorter version than sighted visitors, contrary to the declared accessible-equivalent contract.  
    **Suggested fix:** Generate both visual and text representations from the same scene content model and align the heading hierarchy with the approved contract.  
    **Why debatable:** Some placeholder decoration could reasonably be considered nonessential, but the current comment and design contract promise content equivalence.

Explicitly checked and found sound:

- The museum client imports only the placeholder adapter; no Supabase, private table, contact, review, or `original_json` path reaches it.
- Placeholder records are fictional role labels, and image plates are clearly marked as placeholders.
- Current counter values receive a visible `PLACEHOLDER VALUES` tag.
- Audio is off by default; constructing/requesting the missing file occurs only after a visitor gesture. The missing-file `play()` rejection is caught.
- Modified CTA clicks retain native anchor behavior, normal clicks use `router.push()` and therefore preserve back-button history, and the `href` provides a basic no-JS destination—although the visible CTA is unavailable without hydration.
- Scroll and media-query listeners are removed, pending animation frames are cancelled, and scroll events are coalesced through `requestAnimationFrame`.
- The redirect-outside-`try` change itself is correct. Other redirect sites found are not swallowed by the same catch pattern.
- Preference updates modify separate attribution/note columns, not `original_json`.
- Review create/update smoke assertions still verify that `original_json` remains byte-for-byte unchanged.
- TypeScript checking and the repository lint command both pass.