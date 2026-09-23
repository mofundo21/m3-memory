'use client';

import { useCinematicAvailability } from '@/hooks/useCinematicAvailability';
import { ScrollScrubVideo } from './ScrollScrubVideo';
import { CinematicOverlay } from './CinematicOverlay';
import { ScrollMemory } from './ScrollMemory';
import { useState, useEffect } from 'react';

/**
 * Orchestrator component for the cinematic intro experience.
 *
 * State machine:
 * - 'checking': Video availability is being verified → show minimal placeholder
 * - 'available': Video source exists → render scroll-scrubbed cinematic
 * - 'unavailable': No video source (yet) → fall back to ScrollMemory narrative
 *
 * CINEMATIC SOURCE PENDING: if the real video doesn't exist, users see the
 * existing ScrollMemory treatment seamlessly. No dev placeholder or broken state.
 */
export function CinematicIntro() {
  const availability = useCinematicAvailability();
  const [progress, setProgress] = useState(0);

  // When cinematic is unavailable, just render the fallback
  if (availability === 'unavailable') {
    return <ScrollMemory />;
  }

  // While checking, show a minimal placeholder (same BG, no content)
  if (availability === 'checking') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      />
    );
  }

  // Cinematic is available: render the full scroll-scrubbed experience
  // Use a wrapper to track scroll progress for the overlay
  return (
    <ScrollProgressTracker onProgressChange={setProgress}>
      <ScrollScrubVideo />
      <CinematicOverlay progress={progress} />
    </ScrollProgressTracker>
  );
}

/**
 * Helper component to track scroll progress and pass it to the overlay.
 * This is a thin wrapper that measures scroll position relative to the cinematic section.
 */
interface ScrollProgressTrackerProps {
  children: React.ReactNode;
  onProgressChange: (progress: number) => void;
}

function ScrollProgressTracker({ children, onProgressChange }: ScrollProgressTrackerProps) {
  useEffect(() => {
    const onScroll = () => {
      const cinematicSection = document.querySelector('.cinematic-track') as HTMLElement | null;
      if (!cinematicSection) return;

      const rect = cinematicSection.getBoundingClientRect();
      const trackTop = window.scrollY + rect.top;
      const trackHeight = rect.height;
      const viewportHeight = window.innerHeight;

      const progress = Math.max(0, Math.min(1, (window.scrollY - trackTop) / (trackHeight - viewportHeight)));
      onProgressChange(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Call once immediately
    return () => window.removeEventListener('scroll', onScroll);
  }, [onProgressChange]);

  return <>{children}</>;
}
