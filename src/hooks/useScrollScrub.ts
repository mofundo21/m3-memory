'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { SCROLL_TRACK_HEIGHT_VH, LERP_RATE, SEEK_EPSILON_DESKTOP, SEEK_EPSILON_MOBILE } from '@/lib/cinematicConfig';

interface ScrollScrubState {
  trackRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  progress: number;
}

/**
 * React hook implementing scroll-scrubbed video playback.
 *
 * As the user scrolls through a tall container, video.currentTime updates to match
 * scroll position (0..1 normalized progress → 0..duration).
 *
 * Borrows techniques from scroll-world's scrub-engine.js:
 * - Coalesced seeking: skips currentTime writes while video.seeking is true
 * - Epsilon threshold: only seeks if delta exceeds device-specific threshold
 * - iOS priming: first touch triggers play().then(pause()) so subsequent seeks paint instantly
 * - Resize resilience: ignores height-only changes on mobile (URL bar collapse)
 * - Cleanup: removes all listeners and cancels rAF loop on unmount
 *
 * Call this hook and bind the returned refs to a scroll container (track) and <video> element.
 * Returns current scroll progress (0..1) for external components (e.g., overlay opacity).
 */
export function useScrollScrub(): ScrollScrubState {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  // Track state (all refs so they're accessible in event listeners without re-creating them)
  const stateRef = useRef({
    progress: 0,
    smoothProgress: 0,
    videoDuration: 0,
    videoReady: false,
    userReady: false,
    isCoarse: false,
    laidOutW: 0,
    scrollTop: 0,
    rafId: 0,
    ticking: false,
  });

  // Detect device type once at mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      stateRef.current.isCoarse = window.matchMedia('(pointer: coarse)').matches;
    }
  }, []);

  // Prime video on first user interaction (iOS optimization)
  const primeVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.readyState) return;

    video.muted = true;
    video.play().then(() => video.pause()).catch(() => {
      // Play may fail on some browsers when not user-initiated; that's ok
    });
  }, []);

  // Layout: compute scroll track height once per orientation/resize
  const layout = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const trackHeightVh = SCROLL_TRACK_HEIGHT_VH;
    const trackHeightPx = (trackHeightVh / 100) * window.innerHeight;
    track.style.height = `${trackHeightPx}px`;

    stateRef.current.laidOutW = window.innerWidth;
  }, []);

  // Read scroll position and update progress
  const read = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const trackHeight = rect.height;
    const viewportHeight = window.innerHeight;

    // Clamp scroll progress to 0..1
    const progress = Math.max(0, Math.min(1, (window.scrollY - trackTop) / (trackHeight - viewportHeight)));
    stateRef.current.progress = progress;
    stateRef.current.scrollTop = window.scrollY;

    setProgress(progress);
  }, []);

  // Continuous rAF loop: lerp smoothProgress toward target and update video.currentTime
  const loop = useCallback(() => {
    const video = videoRef.current;
    const state = stateRef.current;

    if (!video || !state.videoReady || !state.videoDuration) {
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    const target = state.progress * state.videoDuration;
    const current = video.currentTime;
    const delta = Math.abs(target - current);
    const isCoarse = state.isCoarse;
    const seekEpsilon = isCoarse ? SEEK_EPSILON_MOBILE : SEEK_EPSILON_DESKTOP;

    // Skip seek if delta is below threshold or video is already seeking
    if (delta > seekEpsilon && !video.seeking) {
      video.currentTime = target;
    }

    // Lerp smoothProgress (for external consumers, e.g., overlay opacity)
    state.smoothProgress += (state.progress - state.smoothProgress) * LERP_RATE;

    state.rafId = requestAnimationFrame(loop);
  }, []);

  // Scroll listener (throttled with ticking flag)
  const onScroll = useCallback(() => {
    const state = stateRef.current;
    if (!state.ticking) {
      state.ticking = true;
      requestAnimationFrame(() => {
        read();
        state.ticking = false;
      });
    }
  }, [read]);

  // Resize listener (ignore height-only changes on mobile)
  const onResize = useCallback(() => {
    const state = stateRef.current;

    if (state.isCoarse) {
      // On mobile, ignore height changes (URL bar collapse).
      // Only re-layout on width change.
      if (window.innerWidth !== state.laidOutW) {
        layout();
      }
    } else {
      // On desktop, always re-layout.
      layout();
    }
  }, [layout]);

  // Mount: set up video, listeners, rAF loop
  useEffect(() => {
    const video = videoRef.current;
    const track = trackRef.current;

    if (!video || !track) return;

    // Set up video element
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const onLoadedMetadata = () => {
      stateRef.current.videoDuration = video.duration;
      stateRef.current.videoReady = true;
      read();
    };

    const onSeeked = () => {
      // Once a real frame has painted, consider user ready
      if (!stateRef.current.userReady) {
        stateRef.current.userReady = true;
      }
    };

    const onPointerDown = () => {
      if (!stateRef.current.userReady) {
        stateRef.current.userReady = true;
        primeVideo();
      }
    };

    const onTouchStart = onPointerDown; // iOS fallback

    // Initial layout
    layout();

    // Attach listeners
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', layout);

    if (stateRef.current.isCoarse) {
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
    }

    // Start rAF loop
    loop();

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', layout);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('touchstart', onTouchStart);

      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
      }
    };
  }, [read, layout, loop, primeVideo]);

  return {
    trackRef,
    videoRef,
    progress,
  };
}
