'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TRACK_VH_DESKTOP, TRACK_VH_MOBILE } from '@/lib/museumConfig';

const MOBILE_QUERY = '(max-width: 600px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export interface MuseumScrollState {
  trackRef: React.RefObject<HTMLDivElement | null>;
  /** Normalized progress across the whole track, 0..1. */
  progress: number;
  reducedMotion: boolean;
  trackVh: number;
  scrollToProgress: (target: number) => void;
}

/**
 * Maps the page's scroll position inside one tall track to a 0..1 progress value.
 * The track is a tall empty element; the stage inside it is sticky.
 * Progress updates are coalesced to one per animation frame.
 */
export function useMuseumScroll(): MuseumScrollState {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [trackVh, setTrackVh] = useState(TRACK_VH_DESKTOP);

  // Device and preference detection, once and on change.
  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia(REDUCED_QUERY);
    const sync = () => {
      setTrackVh(mobile.matches ? TRACK_VH_MOBILE : TRACK_VH_DESKTOP);
      setReducedMotion(reduced.matches);
    };
    sync();
    mobile.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      mobile.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  // Scroll → progress, one update per frame.
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const track = trackRef.current;
      if (!track) return;
      const top = track.getBoundingClientRect().top + window.scrollY;
      const scrollable = track.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = (window.scrollY - top) / scrollable;
      setProgress(Math.max(0, Math.min(1, raw)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackVh]);

  const scrollToProgress = useCallback((target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const scrollable = track.offsetHeight - window.innerHeight;
    const y = top + Math.max(0, Math.min(1, target)) * scrollable;
    const reduced = window.matchMedia(REDUCED_QUERY).matches;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  return { trackRef, progress, reducedMotion, trackVh, scrollToProgress };
}
