'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MUSEUM_AMBIENT_TRACK, MUSEUM_AUDIO_DEFAULT_ENABLED } from '@/lib/museumAudioConfig';

const STORAGE_KEY = 'm3-museum-sound';
const FADE_STEPS = 24;

export type MuseumAudioStatus = 'off' | 'on' | 'missing';

export interface MuseumAudioState {
  status: MuseumAudioStatus;
  /** Toggle from a user gesture only. Never called automatically. */
  toggle: () => void;
  /** Called from the ENTER gesture. Starts playback only if the visitor chose sound on before. */
  resumeIfChosen: () => void;
  /** Fades to silence and resolves when done. Used at the hand-off to the interview. */
  fadeOut: () => Promise<void>;
}

/**
 * Background music for the museum.
 *
 * Rules (docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md §9, src/lib/museumAudioConfig.ts):
 * - Off by default. Never autoplays. The file is not requested until the visitor turns sound on.
 * - Fades in and out over the configured duration.
 * - A missing or undecodable file sets status to 'missing' and stays silent. No error UI.
 * - The on/off choice is stored in localStorage only.
 */
export function useMuseumAudio(): MuseumAudioState {
  const [status, setStatus] = useState<MuseumAudioStatus>('off');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rampSettleRef = useRef<(() => void) | null>(null);
  const chosenRef = useRef<boolean>(MUSEUM_AUDIO_DEFAULT_ENABLED);

  /**
   * Stops the current ramp. A cancelled ramp still settles its promise, so a caller
   * awaiting a fade (for example the hand-off to the interview) is never left hanging.
   */
  const stopRamp = () => {
    if (rampRef.current) {
      clearInterval(rampRef.current);
      rampRef.current = null;
    }
    const settle = rampSettleRef.current;
    rampSettleRef.current = null;
    settle?.();
  };

  const ramp = useCallback((from: number, to: number, ms: number) => {
    stopRamp();
    return new Promise<void>((resolve) => {
      const audio = audioRef.current;
      if (!audio) return resolve();
      const stepMs = ms / FADE_STEPS;
      let step = 0;
      audio.volume = from;
      rampSettleRef.current = resolve;
      rampRef.current = setInterval(() => {
        step += 1;
        const t = Math.min(1, step / FADE_STEPS);
        if (audioRef.current) audioRef.current.volume = from + (to - from) * t;
        if (t >= 1) stopRamp();
      }, stepMs);
    });
  }, []);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(MUSEUM_AMBIENT_TRACK.src);
    audio.loop = MUSEUM_AMBIENT_TRACK.loop;
    audio.preload = 'none';
    audio.addEventListener('error', () => {
      stopRamp();
      setStatus('missing');
    });
    audioRef.current = audio;
    return audio;
  }, []);

  const play = useCallback(async () => {
    const audio = ensureAudio();
    try {
      audio.volume = 0;
      await audio.play();
      setStatus('on');
      await ramp(0, MUSEUM_AMBIENT_TRACK.volume, MUSEUM_AMBIENT_TRACK.fadeMs);
    } catch {
      // Missing file, decode error, or playback refused: stay silent.
      setStatus('missing');
    }
  }, [ensureAudio, ramp]);

  const fadeOut = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    await ramp(audio.volume, 0, MUSEUM_AMBIENT_TRACK.fadeMs);
    audio.pause();
    setStatus('off');
  }, [ramp]);

  const toggle = useCallback(() => {
    if (status === 'on') {
      chosenRef.current = false;
      localStorage.setItem(STORAGE_KEY, 'off');
      void fadeOut();
      return;
    }
    chosenRef.current = true;
    localStorage.setItem(STORAGE_KEY, 'on');
    void play();
  }, [status, fadeOut, play]);

  const resumeIfChosen = useCallback(() => {
    if (chosenRef.current && status === 'off') void play();
  }, [status, play]);

  // Read the stored choice once. Playback still waits for a gesture (resumeIfChosen).
  useEffect(() => {
    chosenRef.current = localStorage.getItem(STORAGE_KEY) === 'on';
    return () => {
      stopRamp();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      audioRef.current = null;
    };
  }, []);

  return { status, toggle, resumeIfChosen, fadeOut };
}
