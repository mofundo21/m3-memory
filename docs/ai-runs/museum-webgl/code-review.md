VERDICT: REQUEST CHANGES

1. **[medium] `src/lib/museumTimeline.ts:125`** — Reduced-motion fade-outs now switch at `from`; the previous component switched at `to`. Fragments, counters, and message lines therefore disappear earlier, violating DOM parity. Minimal fix: use `p >= to` for reduced-motion `fadeOut`, and add boundary assertions covering both endpoints.

2. **[medium] `src/components/museum/MuseumWebGL.tsx:124`** — If one texture load rejects after others succeeded, `Promise.all` discards the successfully created textures without disposing them. Repeated mounts or failures can leak GPU resources. Minimal fix: retain and dispose every fulfilled texture on failure, using an accumulator or `Promise.allSettled`.

3. **[low] `scripts/museum-webgl-test.mjs:142`** — `rendererRequests` is populated but never asserted. An eager three.js/WebGL download under reduced motion would pass despite the lazy-loading requirement. Minimal fix: assert that the WebGL dynamic chunk is absent in DOM/reduced-motion visits and requested only after the cinematic tier mounts.

4. **[low] `src/components/museum/MuseumSequence.tsx:287`** — The previous DOM appended `· PENDING` when either `status === "pending"` or `value === null`; the rewrite checks only status. A null-valued counter with another status loses its visible pending label. Minimal fix: restore `counter.status === 'pending' || counter.value === null`.

Verified correct:

- Scene 03 retains its 0.85 plate-opacity cap; join/CTA inert threshold, counter staggering, normal-motion line timing, and transition windows otherwise match.
- Cinematic tier is opt-in, uses `next/dynamic` with `ssr:false`, demand rendering, an aria-hidden/non-focusable canvas, sticky context-failure fallback, and cinematic-only CSS hiding of the DOM portrait and Scene 02 plates.
- Normal unmount disposes loaded textures and dust geometry; React Three Fiber owns the declarative geometry/material lifecycle.
- Name and email flow through the wizard into creation; final no longer asks for them; blank names still become `Anonymous`.
- Typecheck, timeline unit tests, and capability unit tests pass. Browser tests were inspected but not executed because they create build/database artifacts under the requested read-only constraint.