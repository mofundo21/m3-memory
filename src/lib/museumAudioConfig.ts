/**
 * Museum audio configuration.
 *
 * No audio file is bundled. Yeriel's own MOFUNDO track will replace the
 * placeholder path below later. The museum must work when the file is absent:
 * the sound control reports "no track" and the experience stays silent.
 *
 * Rules (see docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md, Sound Philosophy):
 * - Audio is OFF by default and never autoplays.
 * - A persistent sound control is always visible.
 * - Volume fades in and out on toggle and on leaving the museum.
 */

export interface MuseumAudioTrack {
  id: string;
  src: string;
  title: string;
  loop: boolean;
  /** Target volume, 0..1. Kept low so the track sits under the narrative. */
  volume: number;
  /** Fade in/out duration on toggle, in milliseconds. */
  fadeMs: number;
}

export const MUSEUM_AMBIENT_TRACK: MuseumAudioTrack = {
  id: 'museum-ambient',
  // PLACEHOLDER: no file is committed. Drop a licensed track here, or replace with MOFUNDO music.
  src: '/media/museum-ambient.mp3',
  title: 'Museum ambient',
  loop: true,
  volume: 0.35,
  fadeMs: 1200,
};

/** Audio is never enabled without an explicit visitor action. */
export const MUSEUM_AUDIO_DEFAULT_ENABLED = false;
