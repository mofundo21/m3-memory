You are the independent cross-model reviewer (codex-reviewer) for the M3 Memory MOFUNDO museum prototype (Phase 3). Claude built it. Your job is adversarial review. Do NOT edit any files. Read the code and report findings only.

Context to read first (read-only):
- AGENTS.md, CLAUDE.md, docs/PRODUCT.md, docs/ARCHITECTURE.md, docs/HISTORICAL_INTEGRITY.md, docs/AI_SYSTEM.md, docs/DECISIONS.md
- docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md (the design contract; the four-scene structure is the current direction)
- docs/MUSEUM_REFERENCE_ANALYSIS.md

Implementation under review:
- src/app/museum/page.tsx
- src/components/museum/MuseumSequence.tsx
- src/components/museum/museum.css
- src/hooks/useMuseumScroll.ts
- src/hooks/useMuseumAudio.ts
- src/lib/museumConfig.ts (scene registry, camera keyframes, copy)
- src/lib/museumCamera.ts (pure interpolation and visibility helpers)
- src/lib/museumArchive.ts (typed archive adapter; placeholder data only)
- src/lib/museumAssets.ts (asset manifest)
- src/lib/museumAudioConfig.ts (audio config; no audio file is bundled)
- public/media/museum/placeholders/*.svg (placeholder images)
- src/app/remember/actions.ts (updatePreferencesAction was changed: redirect() moved outside try/catch)
- scripts/v01-smoke-test.mjs (the smoke test was rewritten to drive the current interview UI in headless Chrome)

Constraints the review must respect:
- Archive isolation: the museum must never query Supabase or any private table from the client, and must not expose private submissions or contact data. Placeholder data is the only data source until a public-safe view exists (decision D3). Do not weaken RLS.
- Historical integrity: contributor submissions are immutable source records. Check the changed actions.ts and the smoke test for anything that could mutate original_json.
- No new dependencies were added. The prototype is DOM/CSS only, by design.
- Audio is off by default, never autoplays, must work when the audio file is absent (it is absent today, deliberately).
- The interview (/remember/write, /remember/details, /remember/final) must not be redesigned. Only the server-action redirect fix is in scope there.

Review specifically:
1. Scene architecture: is the scene registry, camera, and per-scene opacity logic coherent and maintainable? Are copy and timing properly separated from components?
2. Scroll architecture: correctness of progress mapping, track height, resize and mobile handling, scroll-to-progress behavior, listener cleanup, rAF usage. Any jank or leak risks?
3. Accessibility: focus order, skip link target, aria-hidden use on the visual stage, the text version, reduced-motion behavior, keyboard operation of ENTER and the CTA, contrast of text on images.
4. Mobile behavior: layout at 390px, touch targets, safe areas, 100dvh use, behavior when the address bar changes.
5. Route transition: the CTA handoff to /remember/write (preventDefault + audio fadeOut + router.push). Check back-button history, modified-click handling, what happens if fadeOut hangs, and no-JS behavior.
6. Placeholder and archive isolation: does any placeholder content look like real personal data? Are counters honest (tagged PLACEHOLDER VALUES or PENDING)? Can any real data path reach the client?
7. Audio architecture: lifecycle (create, play, fade, pause, unmount), the missing-file path, localStorage handling, whether any audio request happens before the visitor acts, and error handling in play().
8. Performance risks: per-frame work, layout thrash, image sizes, the number of elements per scene, DOM work per scroll event, and anything that would not scale to the cinematic version.
9. Maintainability: naming, duplicated logic, dead code, fragile selectors, brittle assumptions about element indices (for example EVIDENCE_POSITIONS and MESSAGE_STARTS).
10. Stale test changes: review the rewritten scripts/v01-smoke-test.mjs. Does it test meaningful current behavior? Does any assertion weaken the test? Is anything skipped that the old test covered (media upload, consent) and is that skip justified? Is the puppeteer dependency used correctly?
11. The actions.ts change: is the redirect-outside-try fix correct? Are there other redirect-inside-try cases in src/app/remember/actions.ts or elsewhere?
12. Readiness: is this implementation a sound foundation for a later cinematic renderer (WebGL) that consumes the same scene state? What would need to change first?

Output format:
- Start with a verdict line: READY / READY WITH FIXES / NOT READY, and a one-sentence reason.
- Then a numbered findings list. For each finding give: severity (blocker, major, minor, nit), file and line (repo-relative path), the problem, a concrete failure scenario, and a suggested fix.
- Mark each finding clearly as "legitimate" or "debatable" with a one-line reason. Be specific. Do not invent issues to fill the list. If an area is fine, say so in one line.
- End with a short list of what you explicitly checked and found sound.
