# Cinematic Video Sources

**CINEMATIC SOURCE PENDING**

This directory is reserved for Yeriel's cinematic video introduction to the M3 Memory `/remember` journey.

## Expected Files

The scroll-scrubbed video experience at `/remember` is architecturally complete and will automatically detect these files when they exist:

### Desktop (Landscape)
- **Filename:** `m3-memory-intro-desktop.mp4`
- **Resolution:** 1920×1080 or similar landscape aspect ratio
- **Duration:** ~60–90 seconds (flexible; will map to scroll timeline)
- **Codec:** H.264 (AVC), muted audio
- **Encoding hints:** 
  - CRF 20 (quality), fast-start (MP4 atom ordering for immediate seek)
  - GOP/keyframe interval: 8–12 frames (~250–400ms at 30fps) for smooth seeking
  - No audio track

### Mobile (Portrait)
- **Filename:** `m3-memory-intro-mobile.mp4`
- **Resolution:** 1080×1920 or similar portrait aspect ratio (9:16)
- **Duration:** Same as desktop (~60–90 seconds)
- **Codec:** H.264 (AVC), muted audio
- **Encoding hints:**
  - CRF 20 (quality)
  - GOP/keyframe interval: 4 frames (~130ms at 30fps) — tighter for mobile's slower seeking
  - No audio track

### Poster/Fallback
- **Filename:** `m3-memory-intro-poster.jpg`
- **Resolution:** Landscape (1920×1080 or similar) — used as `<video poster>` on desktop
- **Content:** First frame or thematic still from the video, or final book composition

## Timeline Mapping

The video will be synchronized to this scroll-driven timeline (normalized 0..1 progress):

| Segment | Start | End | Content |
|---------|-------|-----|---------|
| THOUGHT | 0.00 | 0.18 | Metaphorically entering a thought, a small warm light forms |
| MEMORY FRAGMENTS | 0.18 | 0.38 | Fragments of Yeriel's life appear (friends, childhood, places) |
| PHOTOGRAPHS | 0.38 | 0.58 | Fragments become photographs, still blurry initially, sharpening |
| ARCHIVE | 0.58 | 0.78 | Photographs transition into an archive aesthetic |
| BOOK | 0.78 | 0.94 | Memory enters a physical room with a desk and an unfinished book |
| YOUR TURN | 0.94 | 1.00 | Final composition: open, unfinished book with room for memories |

These ranges are **placeholders** and can be adjusted based on the actual video timing. After dropping the video in, the timeline can be fine-tuned in `src/lib/cinematicConfig.ts`.

## Fallback Experience

Until these files exist, the `/remember` page will silently render the text-based scroll narrative (`ScrollMemory.tsx`), so users see a polished experience with no visible "pending" placeholder or broken state. The fallback is fully tested and deployed.

## Architecture Notes

- The scroll-scrub engine lives in `src/hooks/useScrollScrub.ts` (inspired by scroll-world's scrub-engine.js)
- Timeline configuration is in `src/lib/cinematicConfig.ts`
- Video availability is checked via `src/hooks/useCinematicAvailability.ts` (HEAD request, ~1.5s timeout)
- The page routes to `/remember/write` (Step 2 of 4) via the final CTA: "LET'S REMEMBER →"

No changes needed to the backend, forms, or Supabase integration to enable this.

---

**When your video is ready:** Upload both MP4 files to this directory, then commit and deploy. The page will auto-detect them and transition seamlessly from the fallback to the cinematic experience.
