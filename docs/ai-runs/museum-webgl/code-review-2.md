VERDICT: REQUEST CHANGES

1. **[medium] `src/lib/museumTimeline.ts:125`** — Reduced-motion fade-outs switch at the start of each interval, whereas the previous component switched at the end. Consequently, fragments, counters, and message lines disappear up to `0.02` progress early, breaking DOM parity. Minimal fix: make reduced-motion `fadeOut` use `p >= to`, and add endpoint assertions for fragments, counters, and lines.

2. **[low] `src/components/museum/MuseumSequence.tsx:287`** — A counter with `value === null` but a status other than `"pending"` no longer displays `· PENDING`, unlike the previous component. Minimal fix: append the marker when `counter.status === 'pending' || counter.value === null`.

Verified correct:

- Scene 03 retains the `0.85` plate cap; normal-motion counter/line timing, join/CTA inert logic, and transition detection are correct.
- WebGL is conditionally mounted through `next/dynamic` with `ssr:false`; reduced motion and failures fall back to DOM.
- Canvas is decorative, aria-hidden, non-focusable, and uses demand rendering.
- Only cinematic-rendered DOM imagery is hidden: the Scene 01 portrait and Scene 02 plates.
- Texture partial failures and unmounts dispose loaded textures; dust geometry is disposed, and React Three Fiber owns declarative material/geometry cleanup.
- Context loss is handled and failure remains sticky for the visit.
- Name and email reach submission creation; final no longer requests them; blank names still become `Anonymous`.
- Timeline tests, capability tests, and typecheck pass. Browser tests were inspected but not executed because they create build/database artifacts.