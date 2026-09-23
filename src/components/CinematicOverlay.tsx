'use client';

import { useEffect, useRef, useState } from 'react';
import { CINEMATIC_TIMELINE } from '@/lib/cinematicConfig';

interface CinematicOverlayProps {
  progress: number;
}

/**
 * Timeline-driven narrative overlay with scroll-controlled copy opacity.
 *
 * Renders narrative labels for each CINEMATIC_TIMELINE segment, fading in/out
 * based on scroll progress. Each label peaks at 50% through its segment and
 * fades at the edges.
 *
 * Also renders a persistent final CTA that always remains in the DOM and focusable,
 * with opacity animating with scroll progress but pointer-events never blocked.
 *
 * Includes an accessible skip link at the top for users who prefer not to scroll.
 */
export function CinematicOverlay({ progress }: CinematicOverlayProps) {
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Compute opacity for a narrative segment based on scroll progress.
  // Fade in first ~20% of segment, peak at 50%, fade out in last ~20%.
  const getSegmentOpacity = (start: number, end: number): number => {
    const segmentLength = end - start;
    const posInSegment = Math.max(0, Math.min(1, (progress - start) / segmentLength));

    if (posInSegment < 0.2) {
      // Fade in first 20%
      return (posInSegment / 0.2) * 0.8;
    } else if (posInSegment < 0.8) {
      // Hold in middle 60%
      return 0.8;
    } else {
      // Fade out last 20%
      return 0.8 * (1 - (posInSegment - 0.8) / 0.2);
    }
  };

  return (
    <>
      {/* Accessible skip link (visually hidden, visible on focus) */}
      <a
        href="#cinematic-cta"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: 'translateY(-100%)',
          background: 'var(--purple)',
          color: 'var(--bg)',
          padding: '12px 16px',
          zIndex: 9999,
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '14px',
        }}
        onFocus={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.transform = 'translateY(-100%)';
        }}
      >
        Skip to "Let&apos;s Remember"
      </a>

      {/* Fixed overlay container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 10,
          pointerEvents: 'none', // Don't block scroll/pointer events
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        {/* Narrative timeline labels */}
        <div
          style={{
            position: 'absolute',
            textAlign: 'center',
            maxWidth: '600px',
            transition: 'opacity 200ms ease-out',
          }}
        >
          {CINEMATIC_TIMELINE.map((segment) => {
            const opacity = getSegmentOpacity(segment.start, segment.end);
            return (
              <div
                key={segment.id}
                style={{
                  opacity: Math.max(0, opacity),
                  fontSize: 'clamp(28px, 6vw, 56px)',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'var(--purple-soft)',
                  textShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}
              >
                {segment.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Persistent final CTA (always in DOM, always focusable, opacity animates) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
          padding: '40px 16px 60px',
          textAlign: 'center',
          pointerEvents: progress > 0.85 ? 'auto' : 'none', // Unblock pointer near end
          opacity: Math.max(0, (progress - 0.85) / 0.15), // Fade in final 15% of scroll
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(18px, 5vw, 24px)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 12px 0',
            lineHeight: 1.3,
          }}
        >
          WHAT DO YOU REMEMBER?
        </p>
        <p
          style={{
            fontSize: 'clamp(14px, 4vw, 18px)',
            color: 'var(--muted)',
            margin: '0 0 32px 0',
            lineHeight: 1.6,
            maxWidth: '500px',
          }}
        >
          It doesn&apos;t have to be perfect.<br />It just has to be yours.
        </p>
        <a
          id="cinematic-cta"
          ref={ctaRef}
          href="/remember/write"
          className="primary-action"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          LET&apos;S REMEMBER →
        </a>
      </div>
    </>
  );
}
