"use client";

import React, { useEffect, useRef } from "react";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

export interface MemoryScene {
  id: string;
  title: string;
  text: string;
  photoAlt: string;
}

const scenes: MemoryScene[] = [
  {
    id: "hero",
    title: "M3 MEMORY",
    text: "An autobiography written by everyone who was there.",
    photoAlt: "Central portrait"
  },
  {
    id: "one-way",
    title: "One Way",
    text: "I remember my life from my perspective.",
    photoAlt: "Personal memory"
  },
  {
    id: "another-way",
    title: "Another Way",
    text: "But everyone who was there remembers something different.",
    photoAlt: "Another perspective"
  },
  {
    id: "place",
    title: "A Place",
    text: "They remember a café. A festival. A car ride.",
    photoAlt: "Location memory"
  },
  {
    id: "one-night",
    title: "One Night",
    text: "They remember one night. A conversation that stuck.",
    photoAlt: "Evening memory"
  },
  {
    id: "ordinary",
    title: "Ordinary Life",
    text: "They remember the ordinary moments. The ones I might've forgotten.",
    photoAlt: "Everyday moment"
  },
  {
    id: "without-them",
    title: "Without Them",
    text: "But I don't remember it. But you do.",
    photoAlt: "Their memory"
  },
  {
    id: "purpose",
    title: "That's What This Is For",
    text: "These are the stories only you know. The version only you remember. It just has to be yours.",
    photoAlt: "Authentic moment"
  }
];

export function ScrollMemory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sceneRefs.current.map((element, index) => {
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
          } else {
            element.style.opacity = "0";
            element.style.transform = "translateY(20px)";
          }
        },
        { threshold: 0.3 }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((obs) => obs?.disconnect());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="scroll-memory-section"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .scroll-scene {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="scroll-memory-desktop" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 16px', position: 'relative' }}>
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[index] = el;
            }}
            className="scroll-scene"
            style={{
              opacity: 0,
              transform: 'translateY(20px)',
              transition: 'opacity 700ms ease-out, transform 700ms ease-out',
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              paddingTop: index === 0 ? '120px' : '80px',
              paddingBottom: '80px',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            {/* Background photo placeholder layer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.15,
                zIndex: 0,
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <PhotoPlaceholder
                size="large"
                aspectRatio="1"
              />
            </div>

            {/* Text content */}
            <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', padding: '0 20px' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(36px, 8vw, 72px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: index === 0 ? '2px' : '-0.5px',
                marginBottom: '24px',
                color: 'var(--text)',
                textTransform: index === 0 ? 'uppercase' : 'none'
              }}>
                {scene.title}
              </h2>
              <p style={{
                fontSize: 'clamp(18px, 5vw, 28px)',
                lineHeight: 1.6,
                color: 'var(--muted)',
                marginBottom: 0
              }}>
                {scene.text}
              </p>
            </div>

            {/* Scroll indicator on first scene */}
            {index === 0 && (
              <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                animation: 'bounce 2s infinite',
                zIndex: 10
              }}>
                <div style={{
                  width: '24px',
                  height: '40px',
                  border: '2px solid var(--purple)',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '4px',
                    height: '8px',
                    background: 'var(--purple)',
                    borderRadius: '999px'
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Final CTA */}
        <div
          ref={(el) => {
            sceneRefs.current[scenes.length] = el;
          }}
          className="scroll-scene"
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 700ms ease-out, transform 700ms ease-out',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '80px',
            paddingBottom: '120px'
          }}
        >
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <p style={{
              fontSize: '20px',
              color: 'var(--muted)',
              marginBottom: '48px',
              letterSpacing: '0.5px'
            }}>
              Tell me what you remember.
            </p>
            <a
              href="/remember/write"
              className="primary-action"
              style={{
                display: 'inline-block'
              }}
            >
              LET'S REMEMBER →
            </a>
          </div>
        </div>
      </div>

      {/* Mobile single column layout */}
      <div className="scroll-memory-mobile" style={{ maxWidth: '100%', margin: '0 auto', padding: '0 16px', position: 'relative' }}>
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[index] = el;
            }}
            className="scroll-scene"
            style={{
              opacity: 0,
              transform: 'translateY(20px)',
              transition: 'opacity 700ms ease-out, transform 700ms ease-out',
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              paddingTop: index === 0 ? '120px' : '80px',
              paddingBottom: '80px',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            {/* Background photo placeholder layer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.15,
                zIndex: 0,
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <PhotoPlaceholder
                size="large"
                aspectRatio="1"
              />
            </div>

            {/* Text content */}
            <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', padding: '0 20px' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(36px, 8vw, 72px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: index === 0 ? '2px' : '-0.5px',
                marginBottom: '24px',
                color: 'var(--text)',
                textTransform: index === 0 ? 'uppercase' : 'none'
              }}>
                {scene.title}
              </h2>
              <p style={{
                fontSize: 'clamp(18px, 5vw, 28px)',
                lineHeight: 1.6,
                color: 'var(--muted)',
                marginBottom: 0
              }}>
                {scene.text}
              </p>
            </div>

            {/* Scroll indicator on first scene */}
            {index === 0 && (
              <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                animation: 'bounce 2s infinite',
                zIndex: 10
              }}>
                <div style={{
                  width: '24px',
                  height: '40px',
                  border: '2px solid var(--purple)',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '4px',
                    height: '8px',
                    background: 'var(--purple)',
                    borderRadius: '999px'
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Final CTA */}
        <div
          ref={(el) => {
            sceneRefs.current[scenes.length] = el;
          }}
          className="scroll-scene"
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 700ms ease-out, transform 700ms ease-out',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '80px',
            paddingBottom: '120px'
          }}
        >
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <p style={{
              fontSize: '20px',
              color: 'var(--muted)',
              marginBottom: '48px',
              letterSpacing: '0.5px'
            }}>
              Tell me what you remember.
            </p>
            <a
              href="/remember/write"
              className="primary-action"
              style={{
                display: 'inline-block'
              }}
            >
              LET'S REMEMBER →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        @media (max-width: 768px) {
          .scroll-scene {
            padding-top: 40px !important;
            padding-bottom: 60px !important;
            min-height: 50vh !important;
          }
        }
      `}</style>
    </section>
  );
}
