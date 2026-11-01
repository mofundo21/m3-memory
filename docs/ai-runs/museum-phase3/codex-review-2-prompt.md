You are the independent cross-model reviewer (codex-reviewer) doing a SECOND pass on the M3 Memory MOFUNDO museum prototype. Claude addressed your first review. Do NOT edit files. Read-only.

First read: docs/ai-runs/museum-phase3/codex-review.md (your first review, with its findings numbered 1–12), then the current code.

Claimed fixes to verify (for each, say FIXED, PARTIAL, or NOT FIXED with evidence from the code):

1. Blocker (Supabase preference save, UNAUTHENTICATED): NOT FIXED ON PURPOSE. It needs a Tier 3 design (a contributor-scoped capability). Confirm the current state and that no new exposure was added. Do not propose an implementation; state the risk only.
2. Reduced-motion content loss and sceneActive at p=1: now discrete beats (each group switches on and off at its own timing; no overlapping groups). sceneActive includes the final scene at p=1. Verify.
3. Focusable controls inside aria-hidden: the stage is now split into a decorative .museum-visual (aria-hidden) and a .museum-controls layer that holds ENTER and the CTA. ENTER and the CTA are set inert when not active. Verify no focusable element sits inside aria-hidden.
4. Skip link focus: the skip link now scrolls to the end and moves focus to the CTA once it is active. The sr-only duplicate CTA was removed; the text version is now a visible panel reached through a "Read as text" toggle. Verify focus order and that there is no invisible tab stop.
5. Audio fade hang: cancelled ramps now settle their promise, and onJoin races the fade against a timeout. Verify no path leaves navigation blocked.
6. Eager assets: scene content (images) mounts only when the scene is current or adjacent (sceneNear with margin 0.12). Verify.
7. Choreography in config: plate slots, evidence and fragment slots, and all beat timings now live in src/lib/museumConfig.ts (MUSEUM_BEATS, SCENE_TWO_PLATES, SCENE_THREE_PLATES, EVIDENCE_SLOTS, FRAGMENT_SLOTS). Note: a full pure timeline evaluator is still NOT built; say whether the current split is enough before a WebGL renderer, or what is still missing.
8. Counters use each counter's status; fragments and evidence are capped to slot counts.
9. Waveform computed once at module scope.
10. Track height uses a CSS variable with dvh; chrome uses safe-area insets.
11. Smoke tests: the interview smoke test now covers a media link with consent (selected by label), a non-default attribution, final notes, and an admin/immutability path. A new museum browser test covers gesture-gated audio, inert CTA, skip focus, CTA routing and Back, reduced-motion beats, text mode, and mobile overflow. Check whether any assertion is weak, tautological, or would pass while the feature is broken.
12. Text version: now a visible panel with the full content, including Yeriel fragments and the placeholder fragments, with one h1 (page level) and h2 sections.

Also check, for the changed src/app/remember/actions.ts: the redirect is outside the try block, and nothing else in the file is affected.

Then report NEW issues introduced by these changes, if any. Be specific: file, line, failure scenario, suggested fix. Mark each as legitimate or debatable. Do not invent issues.

Output format:
- Verdict line: READY FOR VISUAL QA / READY WITH FIXES / NOT READY, plus one sentence.
- A table or list: finding number, FIXED / PARTIAL / NOT FIXED / DEFERRED, one-line evidence.
- New findings (numbered, with severity, file and line, failure scenario, fix).
- A short list of what you explicitly checked and found sound.
