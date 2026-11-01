READY WITH FIXES — the accessibility and loading blockers are substantially addressed, but reduced-motion beats still overlap, mobile safe-area protection is overridden, and several browser assertions are too weak to prove the claimed behavior.

| # | Status | Evidence |
|---|---|---|
| 1 | DEFERRED | Supabase still calls `updateSubmissionPreferences()` without a token ([actions.ts:85](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:85)), while the Supabase branch still requires an admin token ([db.ts:582](C:/Users/yerie/m3-memory/src/lib/db.ts:582)). No anonymous update path or credential exposure was added. Risk remains: production contributors receive `UNAUTHENTICATED` instead of reaching `/thanks`. |
| 2 | PARTIAL | `sceneActive()` correctly includes the final scene at `p === 1` ([museumCamera.ts:59](C:/Users/yerie/m3-memory/src/lib/museumCamera.ts:59)). However, reduced-motion `fadeOut()` switches at the end of its interval ([MuseumSequence.tsx:69](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:69)), so adjacent message lines and the final join beat overlap for 0.02 progress intervals. |
| 3 | FIXED | `.museum-visual` is `aria-hidden` and contains no controls; ENTER and CTA are siblings in `.museum-controls` ([MuseumSequence.tsx:150](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:150), [MuseumSequence.tsx:316](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:316)). Both are inert when inactive. |
| 4 | FIXED | Skip scrolls to progress 1 and focuses the active CTA ([MuseumSequence.tsx:75](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:75)). The duplicate sr-only destination is gone; the text CTA is inside a `display:none` panel until text mode is enabled, so it is not an invisible tab stop. |
| 5 | FIXED | `stopRamp()` settles the active promise ([useMuseumAudio.ts:41](C:/Users/yerie/m3-memory/src/hooks/useMuseumAudio.ts:41)), and navigation races the fade against a bounded timeout ([MuseumSequence.tsx:94](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:94)). Audio cleanup can no longer indefinitely block routing. |
| 6 | FIXED | Portrait and plate images mount only behind `sceneNear()` checks ([MuseumSequence.tsx:153](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:153), [MuseumSequence.tsx:194](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:194), [MuseumSequence.tsx:223](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:223)); the helper defaults to a `0.12` margin. |
| 7 | PARTIAL | Slots and beat constants have moved into [museumConfig.ts](C:/Users/yerie/m3-memory/src/lib/museumConfig.ts:30). This is an adequate DOM-prototype split, but not yet sufficient for WebGL: reduced-motion switching, element opacity composition, `JOIN_ACTIVE_AT`, and evaluated render state remain component logic. A pure timeline evaluator is still needed before adding another renderer. |
| 8 | PARTIAL | Evidence and fragments are correctly capped to slot counts ([MuseumSequence.tsx:105](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:105)). Counter presentation now consults `status`, but still labels any `null` value as pending regardless of status ([MuseumSequence.tsx:286](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:286)); placeholder annotation is aggregate rather than per counter. |
| 9 | FIXED | The deterministic waveform is computed once at module scope ([MuseumSequence.tsx:26](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:26)). |
| 10 | PARTIAL | Track height now uses a CSS variable and `dvh` ([museum.css:125](C:/Users/yerie/m3-memory/src/components/museum/museum.css:125)). Desktop chrome uses safe-area insets, but the mobile rule replaces that padding with fixed values ([museum.css:540](C:/Users/yerie/m3-memory/src/components/museum/museum.css:540)). |
| 11 | PARTIAL | The interview smoke test now covers labeled media consent, non-default attribution, final notes, admin access, and source immutability. Museum coverage is useful, but reduced-motion assertions miss overlap windows; text mode merely checks a generic `PLACEHOLDER`; mobile only checks initial horizontal overflow; and no assertion proves complete keyboard tab order or absence of hidden focus targets. |
| 12 | FIXED | The visible text panel includes Yeriel fragments, all evidence and contributor fragments, counters, invitation copy, and CTA ([MuseumSequence.tsx:333](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:333)). The page has one sr-only `h1` and section-level `h2`s. |

The `actions.ts` change is correctly scoped: `redirect("/thanks")` is outside the `try` block, and the diff contains no other behavioral change in that file.

## New findings

1. **Medium — legitimate: reduced-motion groups still overlap**  
   **File:** [MuseumSequence.tsx:67](C:/Users/yerie/m3-memory/src/components/museum/MuseumSequence.tsx:67)  
   **Failure:** At `p = 0.93–0.95`, message lines one and two are simultaneously visible. At `p = 0.97–0.99`, the third line overlaps the join heading and CTA. The test at exactly `0.92` cannot detect this.  
   **Fix:** In reduced-motion mode, switch outgoing content at the next beat’s start, or evaluate a single active beat index rather than reusing fade intervals.

2. **Low — legitimate: mobile CSS cancels the safe-area fix**  
   **File:** [museum.css:540](C:/Users/yerie/m3-memory/src/components/museum/museum.css:540)  
   **Failure:** On a notched mobile viewport, `padding: 16px 20px` overrides the earlier `env(safe-area-inset-*)` declaration, allowing chrome beneath the notch.  
   **Fix:** Preserve `max(..., env(safe-area-inset-*)))` in the mobile override.

## Explicitly checked and sound

- No new Supabase preference-update exposure or browser credential path was introduced.
- No focusable descendant remains inside `aria-hidden`.
- Audio remains off and unrequested until a user gesture.
- Modified CTA clicks retain native anchor behavior; normal routing preserves Back history.
- Text mode has a single page-level `h1` and visible, ordered sections.
- Source submissions remain separate from reviews and preference columns.
- `actions.ts` changed only the redirect placement.
- TypeScript checking and repository lint both pass.
- Browser smoke tests were inspected statically; they were not executed because this review was explicitly read-only and they create SQLite test files.