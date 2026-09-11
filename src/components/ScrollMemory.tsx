"use client";

import React, { useEffect, useRef } from "react";

export interface MemoryScene {
  id: string;
  title: string;
  text: string;
  photoCategory: string;
  photoAlt: string;
}

const scenes: MemoryScene[] = [
  {
    id: "crossing-paths",
    title: "Crossing Paths",
    text: "Every person we meet leaves a mark. The conversations that stick with us, the moments that feel significant — these are the seeds of memory.",
    photoCategory: "memory-hero",
    photoAlt: "Two people meeting"
  },
  {
    id: "however-long",
    title: "However Long",
    text: "Whether it was five minutes or five years, time doesn't measure the weight of connection. What matters is what was exchanged: a story, a laugh, a piece of yourself.",
    photoCategory: "memory-festival-01",
    photoAlt: "Festival gathering"
  },
  {
    id: "different-pieces",
    title: "Different Pieces",
    text: "You remember details. The jacket they wore. What they were talking about. The small things that made the encounter real and specific, not generic.",
    photoCategory: "memory-dj-01",
    photoAlt: "Close detail photograph"
  },
  {
    id: "a-lot-of-life",
    title: "A Lot of Life",
    text: "Your life contains thousands of these encounters. Each one shaped how you think, who you became, where you are now. They're worth preserving.",
    photoCategory: "memory-chess-01",
    photoAlt: "Life milestone"
  },
  {
    id: "the-gap",
    title: "The Gap",
    text: "But without you, these stories disappear. They live only in your mind. And when life moves on, they fade.",
    photoCategory: "memory-friends-01",
    photoAlt: "Nostalgic photograph"
  },
  {
    id: "why-m3-exists",
    title: "Why M3 Memory Exists",
    text: "M3 Memory collects these stories. Not for a book. Not for publication. Just... kept. Preserved. A record of the people who touched your life, in your own words.",
    photoCategory: "memory-night-01",
    photoAlt: "Evening reflection"
  },
  {
    id: "source-not-story",
    title: "Source ≠ Story",
    text: "Your original memory is sacred — unchanged, forever your version. If your words ever inspire something larger, that's a separate step, a different choice, made carefully and separately.",
    photoCategory: "memory-old-01",
    photoAlt: "Historical archive"
  },
  {
    id: "enter-memory",
    title: "Enter the Memory",
    text: "Tell us about someone you remember. What you saw, felt, exchanged. Your words. Your account. No judgment, no editing. Just kept.",
    photoCategory: "memory-life-01",
    photoAlt: "Personal reflection"
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
    <div ref={containerRef} className="relative w-full min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden">
      {/* Prefers-reduced-motion: static layout, no animation */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .scroll-scene {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Scene Container */}
      <div className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[index] = el;
            }}
            className="scroll-scene relative mb-32 lg:mb-48 opacity-0 transition-all duration-700 ease-out"
            style={{
              transform: "translateY(20px)",
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}
          >
            {/* Photo placeholder */}
            <div
              className="absolute inset-0 rounded-lg overflow-hidden opacity-30 lg:opacity-50 -z-10"
              style={{
                backgroundImage: `linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
              aria-label={`Placeholder for ${scene.photoAlt}`}
            />

            {/* Text content */}
            <div className="relative z-10 text-center space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">{scene.title}</h2>
              <p className="text-lg lg:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">{scene.text}</p>
            </div>

            {/* Scroll indicator on first scene only */}
            {index === 0 && (
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-1 h-2 bg-white rounded-full"></div>
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
          className="scroll-scene relative mb-20 opacity-0 transition-all duration-700 ease-out"
          style={{
            transform: "translateY(20px)"
          }}
        >
          <div className="text-center space-y-8">
            <p className="text-slate-300 text-lg">Your memory matters.</p>
            <a
              href="/remember/write"
              className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              I'M READY — LET'S REMEMBER →
            </a>
          </div>
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style>{`
        @media (max-width: 768px) {
          .scroll-scene {
            min-height: 50vh !important;
          }
          .scroll-scene h2 {
            font-size: 2rem;
          }
          .scroll-scene p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
