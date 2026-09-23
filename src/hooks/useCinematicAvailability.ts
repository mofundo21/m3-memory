'use client';

import { useState, useEffect } from 'react';
import { CINEMATIC_SOURCES } from '@/lib/cinematicConfig';

type AvailabilityState = 'checking' | 'available' | 'unavailable';

/**
 * Detects whether the cinematic video source is available.
 *
 * Returns 'unavailable' immediately if prefers-reduced-motion is set (no network request).
 * Otherwise performs a HEAD request with a timeout to check source availability.
 * Falls back to ScrollMemory treatment if unavailable or on any error.
 *
 * The real video source is expected at one of:
 * - /media/m3-memory-intro-desktop.mp4 (desktop)
 * - /media/m3-memory-intro-mobile.mp4 (mobile)
 *
 * CINEMATIC SOURCE PENDING: this hook silently returns 'unavailable' until those files exist,
 * causing the page to render the fallback ScrollMemory component instead. No user sees a
 * placeholder or broken state.
 */
export function useCinematicAvailability(): AvailabilityState {
  const [state, setState] = useState<AvailabilityState>('checking');

  useEffect(() => {
    // Early return: if prefers-reduced-motion is set, skip video entirely.
    // Mirrors scroll-world's behavior of never loading clips under reduced motion.
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setState('unavailable');
        return;
      }
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    (async () => {
      try {
        // Choose source based on device characteristics (same logic as scroll-world).
        // Use mobile variant if coarse pointer OR viewport ≤ 860px.
        const isCoarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
        const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 860;
        const source = isCoarse || isNarrow ? CINEMATIC_SOURCES.mobile : CINEMATIC_SOURCES.desktop;

        // HEAD request to check availability without downloading the file.
        const response = await fetch(source, {
          method: 'HEAD',
          signal: controller.signal,
        });

        if (isMounted) {
          setState(response.ok ? 'available' : 'unavailable');
        }
      } catch {
        // Network error, timeout, or AbortError → fall back to ScrollMemory.
        if (isMounted) {
          setState('unavailable');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
