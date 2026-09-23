'use client';

import { useEffect, useState } from 'react';
import { useScrollScrub } from '@/hooks/useScrollScrub';
import { CINEMATIC_SOURCES } from '@/lib/cinematicConfig';

/**
 * Sticky scroll-scrubbed video layer.
 *
 * Renders a tall scroll container with a fixed <video> element inside.
 * As the user scrolls, the video's currentTime updates to match scroll position.
 *
 * Video source (desktop vs. mobile) is chosen once at mount based on device type.
 * Supports the poster image as a fallback while the video is loading.
 */
export function ScrollScrubVideo() {
  const { trackRef, videoRef, progress } = useScrollScrub();
  const [isMobile, setIsMobile] = useState(false);

  // Detect device type once at mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const isNarrow = window.innerWidth <= 860;
      setIsMobile(isCoarse || isNarrow);
    }
  }, []);

  const source = isMobile ? CINEMATIC_SOURCES.mobile : CINEMATIC_SOURCES.desktop;

  return (
    <section
      ref={trackRef}
      className="cinematic-track"
      style={{
        position: 'relative',
        background: 'var(--bg)',
        minHeight: '100vh', // Minimum height; will be set by useScrollScrub
      }}
    >
      {/* Fixed video layer */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--bg)',
          zIndex: 0,
        }}
      >
        <video
          ref={videoRef}
          src={source}
          poster={CINEMATIC_SOURCES.poster}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {/* Scroll track container (no visual content) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'none', // Don't block scroll/pointer events
        }}
      />
    </section>
  );
}
