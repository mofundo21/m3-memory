'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useMuseumScroll } from '@/hooks/useMuseumScroll';
import { useMuseumAudio } from '@/hooks/useMuseumAudio';
import { placeholderArchiveAdapter, type MuseumDataset } from '@/lib/museumArchive';
import { getMuseumAsset } from '@/lib/museumAssets';
import { MUSEUM_AMBIENT_TRACK } from '@/lib/museumAudioConfig';
import {
  EVIDENCE_SLOTS,
  FRAGMENT_SLOTS,
  INTERVIEW_HREF,
  JOIN_PROGRESS,
  ENTER_PROGRESS,
  MUSEUM_COPY,
  SCENE_THREE_PLATES,
  SCENE_TWO_PLATES,
} from '@/lib/museumConfig';
import { evaluateMuseumFrame } from '@/lib/museumTimeline';
import { decideMuseumTier, detectWebGL2 } from '@/lib/museumCapability';
import './museum.css';

/** The cinematic layer loads only when the tier needs it, so the DOM-only page never downloads three.js. */
const MuseumWebGL = dynamic(() => import('@/components/museum/MuseumWebGL'), { ssr: false });

/** Deterministic waveform, computed once. */
const WAVEFORM_D = (() => {
  const points: string[] = [];
  for (let i = 0; i <= 120; i += 1) {
    const x = (i / 120) * 1000;
    const y = 30 + Math.sin(i * 0.55) * 12 * Math.sin(i * 0.11 + 1) + Math.sin(i * 1.7) * 4;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
})();

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function MuseumSequence() {
  const router = useRouter();
  const scroll = useMuseumScroll();
  const audio = useMuseumAudio();
  const [data, setData] = useState<MuseumDataset | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [focusCtaOnArrival, setFocusCtaOnArrival] = useState(false);
  const [webgl2, setWebgl2] = useState(false);
  const [contextFailed, setContextFailed] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const counters = data?.counters ?? [];
  const hasPlaceholderCounters = counters.some((c) => c.status === 'placeholder');
  const evidence = (data?.evidence ?? []).slice(0, EVIDENCE_SLOTS.length);
  const fragments = (data?.fragments ?? []).slice(0, FRAGMENT_SLOTS.length);

  // The single timing source. Both the DOM layer below and any future renderer read this frame.
  const frame = useMemo(
    () => evaluateMuseumFrame({ progress: scroll.progress, reducedMotion: scroll.reducedMotion, counterCount: counters.length }),
    [scroll.progress, scroll.reducedMotion, counters.length]
  );
  const { scenes, enter, join } = frame;
  const tier = decideMuseumTier({ optedIn, reducedMotion: scroll.reducedMotion, webgl2, contextFailed });
  const portrait = getMuseumAsset('portrait');

  // Capability is probed once, on the client, after mount. The server renders the DOM tier.
  useEffect(() => {
    setWebgl2(detectWebGL2());
    setOptedIn(new URLSearchParams(window.location.search).get('cinematic') === '1');
  }, []);

  useEffect(() => {
    let live = true;
    placeholderArchiveAdapter.load().then((d) => {
      if (live) setData(d);
    });
    return () => {
      live = false;
    };
  }, []);

  const soundLabel = audio.status === 'on' ? 'Sound: On' : audio.status === 'missing' ? 'No track yet' : 'Sound: Off';

  // Skip link: after the scroll lands, move focus to the CTA once it is active.
  useEffect(() => {
    if (focusCtaOnArrival && join.active && ctaRef.current) {
      ctaRef.current.focus();
      setFocusCtaOnArrival(false);
    }
  }, [focusCtaOnArrival, join.active]);

  const onEnter = () => {
    audio.resumeIfChosen();
    scroll.scrollToProgress(ENTER_PROGRESS);
  };

  const onSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setFocusCtaOnArrival(true);
    scroll.scrollToProgress(JOIN_PROGRESS);
  };

  const onJoin = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new tabs and modified clicks normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    // A stalled fade must never block the way into the interview.
    if (!scroll.reducedMotion) await Promise.race([audio.fadeOut(), wait(MUSEUM_AMBIENT_TRACK.fadeMs + 400)]);
    router.push(INTERVIEW_HREF);
  };

  const camera = frame.camera;

  return (
    <div className={`museum-root${textMode ? ' is-text' : ''}${tier === 'cinematic' ? ' is-cinematic' : ''}`}>
      <a className="museum-skip" href="#museum-join" onClick={onSkip}>
        Skip to Join the story
      </a>

      <header className="museum-chrome">
        <Link className="museum-leave" href="/">
          Leave
        </Link>
        <div className="museum-chrome-controls">
          <button
            type="button"
            className="museum-text-toggle"
            aria-pressed={textMode}
            onClick={() => setTextMode((v) => !v)}
          >
            {textMode ? 'Back to the sequence' : 'Read as text'}
          </button>
          <button
            type="button"
            className="museum-sound"
            aria-pressed={audio.status === 'on'}
            disabled={audio.status === 'missing'}
            onClick={audio.toggle}
          >
            {soundLabel}
          </button>
        </div>
      </header>

      <h1 className="museum-sr-only">MOFUNDO, the living museum</h1>

      <div
        ref={scroll.trackRef}
        className="museum-track"
        style={{ '--museum-track-vh': scroll.trackVh } as CSSProperties}
      >
        <div className="museum-stage">
          {/* Decorative layer. Nothing here is focusable; the text version carries the content. */}
          <div className="museum-visual" aria-hidden="true">
            {tier === 'cinematic' && <MuseumWebGL frame={frame} onFail={() => setContextFailed(true)} />}

            {/* 01 YERIEL */}
            <div className="museum-scene museum-scene-01" style={{ opacity: scenes.opacity.yeriel }}>
              {scenes.near.yeriel && (
                <img
                  className="museum-portrait"
                  src={portrait.src}
                  alt=""
                  style={{ transform: `translate3d(${camera.x}%, 0, 0) scale(${camera.zoom})` }}
                />
              )}
              <div className="museum-beam" />
              <p className="museum-placeholder-note">Placeholder portrait · replace with approved photograph</p>
              <h2
                className="museum-name"
                style={{
                  opacity: frame.yeriel.nameOpacity,
                  transform: `translate3d(0, ${frame.yeriel.nameY}vh, 0) scale(${frame.yeriel.nameScale})`,
                }}
              >
                {MUSEUM_COPY.yeriel.name}
              </h2>
              <p className="museum-meta" style={{ opacity: frame.yeriel.metaOpacity }}>
                {MUSEUM_COPY.yeriel.meta}
                <span className="museum-tag">{MUSEUM_COPY.yeriel.metaTag}</span>
              </p>
              {MUSEUM_COPY.yeriel.fragments.map((text, i) => (
                <p
                  key={text}
                  className={`museum-fragment museum-fragment-${i}`}
                  style={{ opacity: frame.yeriel.fragmentOpacity[i] }}
                >
                  {text}
                </p>
              ))}
            </div>

            {/* 02 MOFUNDO */}
            <div className="museum-scene museum-scene-02" style={{ opacity: scenes.opacity.mofundo }}>
              <h2 className="museum-name museum-name-second" style={{ opacity: frame.mofundo.nameOpacity }}>
                {MUSEUM_COPY.mofundo.name}
              </h2>
              {scenes.near.mofundo &&
                SCENE_TWO_PLATES.map((plate, i) => {
                  const asset = getMuseumAsset(plate.id);
                  const f = frame.mofundo.plates[i];
                  return (
                    <img
                      key={plate.id}
                      className="museum-plate museum-plate-soft"
                      src={asset.src}
                      alt=""
                      style={{
                        left: `${plate.left + f.dx}%`,
                        top: `${plate.top}%`,
                        width: `${plate.width}%`,
                        opacity: f.opacity,
                      }}
                    />
                  );
                })}
              <svg className="museum-waveform" viewBox="0 0 1000 60" preserveAspectRatio="none" style={{ opacity: frame.mofundo.waveformOpacity }}>
                <path d={WAVEFORM_D} />
              </svg>
            </div>

            {/* 03 HOW DO YOU REMEMBER HIM? */}
            <div className="museum-scene" style={{ opacity: scenes.opacity['remember-him'] }}>
              <h2 className="museum-question" style={{ opacity: frame.rememberHim.questionOpacity }}>
                {MUSEUM_COPY.rememberHim.question}
              </h2>
              {scenes.near['remember-him'] &&
                SCENE_THREE_PLATES.map((plate, i) => {
                  const asset = getMuseumAsset(plate.id);
                  const f = frame.rememberHim.plates[i];
                  return (
                    <img
                      key={plate.id}
                      className="museum-plate museum-plate-soft"
                      src={asset.src}
                      alt=""
                      style={{
                        left: `${plate.left}%`,
                        top: `${plate.top}%`,
                        width: `${plate.width}%`,
                        opacity: f.opacity,
                        transform: `scale(${f.scale})`,
                      }}
                    />
                  );
                })}
              {evidence.map((item, i) => (
                <span
                  key={item.id}
                  className="museum-evidence"
                  style={{
                    left: `${EVIDENCE_SLOTS[i].left}%`,
                    top: `${EVIDENCE_SLOTS[i].top}%`,
                    opacity: frame.rememberHim.evidenceOpacity[i],
                  }}
                >
                  {item.label}
                  <span className="museum-tag">PLACEHOLDER</span>
                </span>
              ))}
              {fragments.map((fragment, i) => (
                <p
                  key={fragment.id}
                  className="museum-caveat"
                  style={{
                    left: `${FRAGMENT_SLOTS[i].left}%`,
                    top: `${FRAGMENT_SLOTS[i].top}%`,
                    opacity: frame.rememberHim.fragmentOpacity[i],
                  }}
                >
                  {fragment.text}
                  <span className="museum-caveat-attribution">{fragment.attribution} · PLACEHOLDER</span>
                </p>
              ))}
            </div>

            {/* 04 JOIN THE STORY: counters, then the simplification, then the message. */}
            <div className="museum-scene museum-scene-join" style={{ opacity: scenes.opacity.join }}>
              <div className="museum-counters" style={{ opacity: join.countersOpacity }}>
                {counters.map((counter, i) => (
                  <div key={counter.id} className="museum-counter" style={{ opacity: join.counterOpacity[i] }}>
                    <span className="museum-counter-value">{counter.value ?? '—'}</span>
                    <span className="museum-counter-label">
                      {counter.label}
                      {counter.status === 'pending' ? ' · PENDING' : ''}
                    </span>
                  </div>
                ))}
                {hasPlaceholderCounters ? <p className="museum-tag museum-counters-tag">{MUSEUM_COPY.join.placeholderTag}</p> : null}
              </div>

              <div className="museum-message">
                {MUSEUM_COPY.join.lines.map((line, i) => (
                  <p key={line} className="museum-line" style={{ opacity: join.lineOpacity[i] }}>
                    {line}
                  </p>
                ))}
              </div>

              <div className="museum-join" style={{ opacity: join.joinOpacity }}>
                <h2 className="museum-join-heading">{MUSEUM_COPY.join.heading}</h2>
                <p className="museum-join-explanation">{MUSEUM_COPY.join.explanation}</p>
              </div>
            </div>
          </div>

          {/* Controls layer: the only focusable elements on the stage. Inert while not visible. */}
          <div className="museum-controls">
            <div className="museum-enter" style={{ opacity: enter.opacity }} inert={enter.inert}>
              <button type="button" className="museum-enter-button" onClick={onEnter}>
                {MUSEUM_COPY.enter.cta}
              </button>
            </div>

            <div className="museum-cta-slot" id="museum-join" style={{ opacity: join.ctaOpacity }} inert={!join.active}>
              <a ref={ctaRef} className="museum-cta" href={INTERVIEW_HREF} onClick={onJoin}>
                {MUSEUM_COPY.join.cta}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Text version: the same content, in order, as a visible panel. Shown by "Read as text". */}
      <section className="museum-text-panel" aria-label="The sequence as text">
        <h2>{MUSEUM_COPY.yeriel.name}</h2>
        <p>
          {MUSEUM_COPY.yeriel.meta} ({MUSEUM_COPY.yeriel.metaTag})
        </p>
        <ul>
          {MUSEUM_COPY.yeriel.fragments.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>

        <h2>{MUSEUM_COPY.mofundo.name}</h2>
        <p>{MUSEUM_COPY.mofundo.itemMeta}</p>

        <h2>{MUSEUM_COPY.rememberHim.question}</h2>
        <ul>
          {(data?.evidence ?? []).map((item) => (
            <li key={item.id}>{item.label} (PLACEHOLDER)</li>
          ))}
        </ul>
        <ul>
          {(data?.fragments ?? []).map((fragment) => (
            <li key={fragment.id}>
              “{fragment.text}” {fragment.attribution} (PLACEHOLDER)
            </li>
          ))}
        </ul>

        <h2>{MUSEUM_COPY.join.heading}</h2>
        <ul>
          {counters.map((c) => (
            <li key={c.id}>
              {c.label}: {c.value ?? 'pending'}
              {c.status === 'placeholder' ? ` (${MUSEUM_COPY.join.placeholderTag})` : ''}
            </li>
          ))}
        </ul>
        {MUSEUM_COPY.join.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>{MUSEUM_COPY.join.explanation}</p>
        <p>
          <a className="museum-cta" href={INTERVIEW_HREF} onClick={onJoin}>
            {MUSEUM_COPY.join.cta}
          </a>
        </p>
      </section>
    </div>
  );
}
