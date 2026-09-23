/**
 * Cinematic intro configuration for /remember
 *
 * This file documents the expected video specs and timeline.
 * The actual MP4 files are not yet in the repo; see public/media/README.md for details.
 */

export interface CinematicSource {
  desktop: string;
  mobile: string;
  poster: string;
}

export interface CinematicSegment {
  id: string;
  label: string;
  start: number; // 0..1 normalized progress
  end: number;
}

// Expected video sources. These paths will be populated once Yeriel provides the video.
// Desktop: landscape, 1920×1080 or similar, H.264, muted, fast-start
// Mobile: portrait 9:16, 1080×1920, H.264, muted, fast-start, lighter GOP for mobile
export const CINEMATIC_SOURCES: CinematicSource = {
  desktop: '/media/m3-memory-intro-desktop.mp4',
  mobile: '/media/m3-memory-intro-mobile.mp4',
  poster: '/media/m3-memory-intro-poster.jpg',
};

// Narrative timeline segments and their scroll-progress ranges
// These are placeholders matching Yeriel's brief; exact timings will be tuned after video exists.
export const CINEMATIC_TIMELINE: CinematicSegment[] = [
  {
    id: 'thought',
    label: 'THOUGHT',
    start: 0,
    end: 0.18,
  },
  {
    id: 'fragments',
    label: 'MEMORY FRAGMENTS',
    start: 0.18,
    end: 0.38,
  },
  {
    id: 'photographs',
    label: 'PHOTOGRAPHS',
    start: 0.38,
    end: 0.58,
  },
  {
    id: 'archive',
    label: 'ARCHIVE',
    start: 0.58,
    end: 0.78,
  },
  {
    id: 'book',
    label: 'BOOK',
    start: 0.78,
    end: 0.94,
  },
  {
    id: 'your-turn',
    label: 'YOUR TURN',
    start: 0.94,
    end: 1.0,
  },
];

// Scroll scrubbing tunables (borrowed from scroll-world's architecture)

/**
 * Scroll track height multiplier.
 * The scroll container is this many viewport heights tall.
 * Larger = more granular scroll control, but more scrolling needed.
 */
export const SCROLL_TRACK_HEIGHT_VH = 420;

/**
 * Lerp rate for smooth-progress toward target video progress.
 * Higher = snappier seek; lower = smoother but slower response.
 * scroll-world uses 0.18; we'll match it.
 */
export const LERP_RATE = 0.18;

/**
 * Seek epsilon: skip video.currentTime writes if the delta is smaller than this.
 * Prevents excessive decoder thrashing and decouples scroll jitter from video seeks.
 * Desktop: 0.008 (0.8% of a 1min video = ~480ms)
 * Mobile: 0.02 (coarser to reduce decodes on slower devices)
 */
export const SEEK_EPSILON_DESKTOP = 0.008;
export const SEEK_EPSILON_MOBILE = 0.02;

/**
 * Linger-ease factor: controls how copy opacity peaks mid-scene and settles at seams.
 * 0 = none (linear); 0.6 = prominent. scroll-world defaults to 0.4–0.6.
 * Keep ≤0.6 to avoid unintuitive reversals on scroll.
 */
export const LINGER_EASE_FACTOR = 0.5;
