/**
 * MOFUNDO Museum scene registry (Phase 3).
 *
 * One scroll track, four scenes, one camera. Scroll progress is normalized 0..1
 * across the whole track. Scenes overlap by SCENE_FADE so one dissolves into the
 * next. See docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md §2, §4, §11.
 */

/** Track height in viewports. Shorter on mobile to reduce fatigue (bible §15). */
export const TRACK_VH_DESKTOP = 5;
export const TRACK_VH_MOBILE = 4;

/** Width of the crossfade at each scene boundary, in normalized progress. */
export const SCENE_FADE = 0.03;

/** Where the sequence hands off to the interview (decision D1). */
export const INTERVIEW_HREF = '/remember/write';

/** Progress at which the skip link lands: the end of the track, where the CTA is active. */
export const JOIN_PROGRESS = 1;

/** Progress after ENTER: the first scene's start. */
export const ENTER_PROGRESS = 0.05;

/**
 * Beat timings, in normalized progress. Every reveal in the sequence reads from
 * here, so a future renderer can consume the same timing without copying numbers.
 * Scene 04 is deliberately the longest scene: counters need time to register.
 */
export const MUSEUM_BEATS = {
  yeriel: {
    nameIn: [0.06, 0.12],
    nameShrink: [0.2, 0.28],
    metaIn: [0.1, 0.16],
    fragmentIn: (i: number) => [0.09 + i * 0.03, 0.13 + i * 0.03] as const,
    fragmentOut: (i: number) => [0.2 + i * 0.01, 0.24 + i * 0.01] as const,
  },
  mofundo: {
    nameIn: [0.26, 0.31],
    drift: [0.27, 0.48],
    plateIn: (i: number) => [0.27 + i * 0.03, 0.32 + i * 0.03] as const,
    waveformIn: [0.3, 0.35],
  },
  rememberHim: {
    questionIn: [0.49, 0.54],
    plateIn: (i: number) => [0.49 + i * 0.03, 0.54 + i * 0.03] as const,
    evidenceIn: (i: number) => [0.5 + i * 0.02, 0.55 + i * 0.02] as const,
    fragmentIn: (i: number) => [0.58 + i * 0.02, 0.62 + i * 0.02] as const,
  },
  join: {
    countersIn: [0.68, 0.74],
    countersOut: [0.86, 0.9],
    counterStagger: 0.005,
    /** Start of each message line. Each holds until the next one arrives. */
    lineStarts: [0.9, 0.93, 0.96] as const,
    /** The join beat: heading, explanation and CTA. Nothing else remains. */
    joinIn: [0.97, 0.995] as const,
  },
} as const;

export type MuseumSceneId = 'enter' | 'yeriel' | 'mofundo' | 'remember-him' | 'join';

export interface CameraKeyframe {
  at: number;
  /** Dolly: 1 = neutral, >1 = closer. */
  zoom: number;
  /** Lateral drift, percent of stage width. */
  x: number;
}

export interface MuseumScene {
  id: MuseumSceneId;
  /** Scene start and end in normalized scroll progress. */
  start: number;
  end: number;
  /** Visible label for the scene heading (also used in the text version). */
  heading: string;
}

export const MUSEUM_SCENES: MuseumScene[] = [
  { id: 'yeriel', start: 0.05, end: 0.27, heading: 'Yeriel' },
  { id: 'mofundo', start: 0.27, end: 0.48, heading: 'MOFUNDO' },
  { id: 'remember-him', start: 0.48, end: 0.66, heading: 'How do you remember him?' },
  { id: 'join', start: 0.66, end: 1, heading: 'Join the story' },
];

/** One camera for the whole sequence. Piecewise linear, eased per segment. */
export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { at: 0, zoom: 1, x: 0 },
  { at: 0.05, zoom: 1, x: 0 },
  { at: 0.19, zoom: 1.22, x: 0 },
  { at: 0.27, zoom: 1, x: 0 },
  { at: 0.38, zoom: 1.04, x: -6 },
  { at: 0.48, zoom: 0.96, x: -10 },
  { at: 0.66, zoom: 0.9, x: 0 },
  { at: 1, zoom: 0.84, x: 0 },
];

/** Copy for the four scenes. Placeholder-driven content is marked in the component. */
export const MUSEUM_COPY = {
  enter: {
    wordmark: 'MOFUNDO',
    tagline: 'the living museum',
    cta: 'Enter',
  },
  yeriel: {
    name: 'YERIEL',
    meta: '1991 · BRONX, NEW YORK',
    metaTag: 'TO CONFIRM',
    fragments: ['EARLY FRAGMENT · PLACEHOLDER', 'DATE · PLACEHOLDER', 'OBJECT · PLACEHOLDER'],
  },
  mofundo: {
    name: 'MOFUNDO',
    // No category labels on screen (bible §11.2). Items arrive as one flow.
    itemMeta: 'PLACEHOLDER',
  },
  rememberHim: {
    question: 'HOW DO YOU REMEMBER HIM?',
  },
  join: {
    lines: [
      "ONE PERSON CAN'T REMEMBER AN ENTIRE LIFE.",
      "THAT'S WHERE YOU COME IN.",
      'YOU MAY REMEMBER A PIECE I DON’T.',
    ],
    heading: 'JOIN THE STORY',
    explanation:
      "If we've crossed paths, tell me how you remember it. Where were we? What happened? Even a small detail can become part of the archive.",
    cta: 'TELL ME HOW WE MET →',
    placeholderTag: 'PLACEHOLDER VALUES',
  },
} as const;

/**
 * Layout slots, as percent of the stage. Content is placed by slot, never by index
 * arithmetic on the data, so an adapter returning more items cannot push them off-screen.
 * A renderer must cap items to the slot count.
 */
export interface PlateSlot {
  id: 'photo-01' | 'photo-02' | 'photo-03' | 'photo-04' | 'photo-05' | 'photo-06' | 'portrait-02' | 'portrait-03' | 'portrait-04';
  left: number;
  top: number;
  width: number;
  /** Lateral drift over the scene, percent. Scene 02 only. */
  drift?: number;
  /** Scale hint for depth. Scene 03 only. */
  depth?: number;
}

export const SCENE_TWO_PLATES: PlateSlot[] = [
  { id: 'photo-01', left: 3, top: 12, width: 14, drift: 4 },
  { id: 'photo-02', left: 70, top: 10, width: 13, drift: -4 },
  { id: 'photo-03', left: 76, top: 58, width: 12, drift: 3 },
];

export const SCENE_THREE_PLATES: PlateSlot[] = [
  // Scene 03 uses the supplied portraits as soft fragments (CSS feathered), not placeholder cards.
  { id: 'portrait-02', left: 3, top: 20, width: 14, depth: 0.9 },
  { id: 'portrait-03', left: 80, top: 28, width: 14, depth: 1.05 },
  { id: 'portrait-04', left: 44, top: 68, width: 11, depth: 0.8 },
];

/** Evidence labels for Scene 03, placed around the question. Role labels only. */
export const EVIDENCE_SLOTS: { left: number; top: number }[] = [
  { left: 10, top: 14 },
  { left: 78, top: 12 },
  { left: 22, top: 78 },
  { left: 60, top: 80 },
  { left: 86, top: 46 },
  { left: 6, top: 52 },
];

/** Contributor-voice fragments for Scene 03. Three at most. */
export const FRAGMENT_SLOTS: { left: number; top: number }[] = [
  { left: 20, top: 70 },
  { left: 42, top: 76 },
  { left: 64, top: 70 },
];


/**
 * Spatial world for the cinematic layer (YERIEL → MOFUNDO). The renderer reads only what the timeline evaluator
 * derives from these values. Camera path and plate reveal windows live here, next to the other beats.
 *
 * Coordinates: the camera looks toward −Z. A plane is in front of the camera while cameraZ > plane.z, and it is
 * passed when cameraZ falls below plane.z. Units are world units. Sizes are chosen so a plane at distance d
 * occupies about height / (0.63·d) of the viewport height (35° vertical field of view).
 *
 * Art direction only. The four portraits are not in chronological order here.
 */
export interface WorldCameraKey {
  at: number;
  x: number;
  y: number;
  z: number;
}

/** A deliberate dolly: forward travel, a lateral pass beside the portrait, and a small rise. No rotation. */
export const WORLD_CAMERA_KEYFRAMES: WorldCameraKey[] = [
  { at: 0, x: 0, y: 0, z: 14 },
  { at: 0.05, x: 0, y: 0, z: 13.6 },
  { at: 0.2, x: -0.5, y: 0.25, z: 10 },
  { at: 0.27, x: 0.2, y: 0.1, z: 7.2 },
  { at: 0.36, x: 0.9, y: -0.2, z: -1 },
  { at: 0.44, x: -0.6, y: 0.35, z: -11 },
  { at: 0.48, x: -0.2, y: 0.2, z: -16 },
];

export interface WorldPlate {
  id: 'fragment-01' | 'portrait-01' | 'portrait-02' | 'portrait-03' | 'portrait-04';
  /** Asset id in museumAssets. The fragment reuses portrait-01 with a crop. */
  asset: 'portrait-01' | 'portrait-02' | 'portrait-03' | 'portrait-04';
  x: number;
  y: number;
  z: number;
  height: number;
  /** Normalized crop: [offsetX, offsetY, repeatX, repeatY] in texture space. Full image is [0, 0, 1, 1]. */
  crop: [number, number, number, number];
  /** Progress window in which the plate fades in. Arrival is gradual, so nothing pops in. */
  revealFrom: number;
  revealTo: number;
}

export const WORLD_PLATES: WorldPlate[] = [
  // YERIEL: a single dominant portrait at the origin, seen from far away with space around it.
  { id: 'portrait-01', asset: 'portrait-01', x: 0, y: 0, z: 0, height: 4.0, crop: [0, 0, 1, 1], revealFrom: 0, revealTo: 0.04 },
  // The surviving YERIEL fragment: the upper-left crop of the same photograph, off to the right and in front of
  // the camera's path. The camera passes it at about p≈0.30. This is the required close pass.
  { id: 'fragment-01', asset: 'portrait-01', x: 1.3, y: -0.5, z: 5.5, height: 2.2, crop: [0, 0.5, 0.5, 0.5], revealFrom: 0.12, revealTo: 0.18 },
  // Revealed after the close pass, far to the left and raised, so it reads as separate from the first portrait.
  { id: 'portrait-02', asset: 'portrait-02', x: -3.2, y: 1.5, z: -8, height: 2.6, crop: [0, 0, 1, 1], revealFrom: 0.26, revealTo: 0.33 },
  // Deeper and to the right, partly out of the upper frame at its nearest point.
  { id: 'portrait-03', asset: 'portrait-03', x: 3.0, y: -1.0, z: -15, height: 4.6, crop: [0, 0, 1, 1], revealFrom: 0.32, revealTo: 0.4 },
  // The farthest and strongest image, emerging as the camera settles toward MOFUNDO.
  { id: 'portrait-04', asset: 'portrait-04', x: -0.4, y: 0.6, z: -24, height: 3.8, crop: [0, 0, 1, 1], revealFrom: 0.4, revealTo: 0.46 },
];

/** Distance over which a plate that has been passed fades out, in world units. */
export const WORLD_PASS_FADE = 0.9;
/** Distance at which far planes reach full atmospheric fog. Spans the whole ~33-unit depth range. */
export const WORLD_FOG_DISTANCE = 30;
