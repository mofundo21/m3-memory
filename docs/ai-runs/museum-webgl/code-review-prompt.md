You are the independent cross-model code reviewer for the M3 Memory project. Do NOT edit files. Read-only.

Review the implementation changes in this working tree (not committed). Scope of this review:

1. Timeline evaluator refactor: src/lib/museumTimeline.ts (new) and src/components/museum/MuseumSequence.tsx (rewritten to consume the frame). Goal: DOM output unchanged versus the previous component. Check for any behavioral drift, especially reduced-motion behavior, the 0.85 cap on Scene 03 plates, the join/CTA inert logic, counter and line timing, and transition detection.
2. Cinematic WebGL experiment: src/components/museum/MuseumWebGL.tsx (new), src/lib/museumCapability.ts (new), CSS additions in src/components/museum/museum.css. Check: context-loss handling, texture loading and disposal, lazy-loading (next/dynamic ssr:false), that the canvas is aria-hidden and holds no focusable elements, that nothing is drawn twice (DOM portrait and Scene 02 plates are hidden only in the cinematic tier), the on-demand render loop, the GPU resource lifecycle on unmount, and any leak when the component remounts.
3. Contributor name capture: src/app/remember/write/page.tsx, src/app/remember/details/page.tsx, src/app/remember/final/content.tsx. Check that the name and email persist at creation, that the final step no longer asks for them, and that the "Anonymous" fallback is preserved.
4. Tests: scripts/museum-timeline-tests.mjs, scripts/museum-capability-tests.mjs, scripts/museum-webgl-test.mjs, scripts/v01-smoke-test.mjs (changed).

Do NOT review the contributor-capability design here; it is not implemented.

Use `git diff` and read the untracked new files. Output:
- First line: VERDICT: APPROVE | APPROVE WITH CHANGES | REQUEST CHANGES
- Numbered findings, each with severity (blocker/high/medium/low), file:line, a concrete failure scenario, and the minimal fix.
- A short list of what you verified as correct.
No padding. If an area is clean, say so in one line.
