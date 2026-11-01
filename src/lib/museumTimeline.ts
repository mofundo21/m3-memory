/**
 * MOFUNDO Museum timeline evaluator.
 *
 * The single source of truth for the museum's timing:
 *   scroll progress → evaluateMuseumFrame() → MuseumFrame
 *
 * The DOM/CSS layer and the future WebGL renderer both read the same MuseumFrame.
 * Neither may derive its own timing. This module is pure: no DOM, no React, no clock.
 */

import {
  ENTER_PROGRESS,
  EVIDENCE_SLOTS,
  FRAGMENT_SLOTS,
  MUSEUM_BEATS,
  MUSEUM_COPY,
  MUSEUM_SCENES,
  SCENE_FADE,
  WORLD_CAMERA_KEYFRAMES,
  WORLD_FOG_DISTANCE,
  WORLD_PASS_FADE,
  WORLD_PLATES,
  SCENE_THREE_PLATES,
  SCENE_TWO_PLATES,
  type MuseumSceneId,
} from '@/lib/museumConfig';
import {
  cameraAt,
  clamp01,
  sceneActive,
  sceneNear,
  sceneOpacity,
  within,
  type CameraState,
} from '@/lib/museumCamera';

export interface MuseumFrameInput {
  /** Normalized scroll progress across the whole track, 0..1. */
  progress: number;
  reducedMotion: boolean;
  /** Number of archive counters to time. Each counter staggers by one step. */
  counterCount: number;
}

export interface SceneTransition {
  from: MuseumSceneId;
  to: MuseumSceneId;
  /** How far through the crossfade, 0..1. */
  amount: number;
}

export interface PlateFrame {
  /** Horizontal drift added to the plate's base left, percent. */
  dx: number;
  opacity: number;
  /** Depth scale for Scene 03 plates. 1 for Scene 02. */
  scale: number;
}

/** One plate in the spatial world, as the renderer should draw it this frame. */
export interface WorldPlateFrame {
  id: string;
  asset: string;
  x: number;
  y: number;
  z: number;
  height: number;
  crop: [number, number, number, number];
  /** 0..1. Reveal × pass-through. 0 means the plate is not drawn. */
  opacity: number;
  /** 0..1 atmospheric fog from distance. 0 is near, 1 is far. */
  fog: number;
}

/** The spatial state for the cinematic renderer. Derived here, never in the renderer. */
export interface WorldFrame {
  /** Camera position. The camera looks straight ahead (toward −Z), so x and y are a dolly, not a rotation. */
  cameraX: number;
  cameraY: number;
  /** Camera distance along −Z. Larger is further back. */
  cameraZ: number;
  plates: WorldPlateFrame[];
  /** Dust is strongest while the camera is moving through the space. 0..1. */
  dustOpacity: number;
}

export interface MuseumFrame {
  progress: number;
  reducedMotion: boolean;
  world: WorldFrame;

  /** One camera for the whole sequence. Neutral when reduced motion is on. */
  camera: CameraState;

  scenes: {
    opacity: Record<MuseumSceneId, number>;
    /** Whether a scene's assets may be mounted (current or adjacent). */
    near: Record<MuseumSceneId, boolean>;
    /** The crossfade in progress, or null. Always null with reduced motion (no overlap). */
    transition: SceneTransition | null;
  };

  enter: {
    opacity: number;
    /** The ENTER control is inert once it is mostly faded out. */
    inert: boolean;
  };

  yeriel: {
    nameOpacity: number;
    /** Vertical offset in vh while the name shrinks away. */
    nameY: number;
    nameScale: number;
    metaOpacity: number;
    fragmentOpacity: number[];
  };

  mofundo: {
    nameOpacity: number;
    plates: PlateFrame[];
    waveformOpacity: number;
  };

  rememberHim: {
    questionOpacity: number;
    plates: PlateFrame[];
    evidenceOpacity: number[];
    fragmentOpacity: number[];
  };

  join: {
    /** True once the join beat has begun: the CTA is reachable. */
    active: boolean;
    countersOpacity: number;
    counterOpacity: number[];
    lineOpacity: number[];
    joinOpacity: number;
    ctaOpacity: number;
  };
}

/** Progress at which the join beat is considered reached (midpoint of its fade-in). */
export const JOIN_ACTIVE_AT = (MUSEUM_BEATS.join.joinIn[0] + MUSEUM_BEATS.join.joinIn[1]) / 2;

/**
 * Evaluate the whole museum at one scroll position.
 * With reduced motion, every reveal is a hard switch at its start point:
 * no camera travel, no crossfades, and no overlapping groups.
 */
export function evaluateMuseumFrame(input: MuseumFrameInput): MuseumFrame {
  const { progress: p, reducedMotion: rm, counterCount } = input;
  const { yeriel, mofundo, rememberHim, join } = MUSEUM_BEATS;

  /** Amount an element has appeared, 0..1. */
  const fadeIn = (from: number, to: number) => (rm ? (p >= from ? 1 : 0) : within(p, from, to));
  /** Amount an element has faded out, 0..1. Reduced motion switches out at the start point. */
  const fadeOut = (from: number, to: number) => (rm ? (p >= from ? 1 : 0) : within(p, from, to));

  const sceneIds = MUSEUM_SCENES.map((s) => s.id);
  const sceneOpacityMap = {} as Record<MuseumSceneId, number>;
  const sceneNearMap = {} as Record<MuseumSceneId, boolean>;
  for (const id of sceneIds) {
    sceneOpacityMap[id] = rm ? (sceneActive(id, p) as number) : sceneOpacity(id, p);
    sceneNearMap[id] = sceneNear(id, p);
  }

  const plates = (
    defs: typeof SCENE_TWO_PLATES,
    plateIn: (i: number) => readonly [number, number],
    opts: { depthScale: boolean; maxOpacity: number }
  ): PlateFrame[] =>
    defs.map((plate, i) => ({
      dx: rm ? 0 : (plate.drift ?? 0) * within(p, ...mofundo.drift),
      opacity: fadeIn(...plateIn(i)) * opts.maxOpacity,
      scale: opts.depthScale && !rm ? plate.depth ?? 1 : 1,
    }));

  const enterOpacity = clamp01(1 - p / ENTER_PROGRESS);
  const joinActive = p >= JOIN_ACTIVE_AT;

  const counterOpacity = Array.from({ length: counterCount }, (_, i) =>
    fadeIn(join.countersIn[0] + i * join.counterStagger, join.countersIn[1] + i * join.counterStagger)
  );

  const lineOpacity = MUSEUM_BEATS.join.lineStarts.map((start, i, all) => {
    const next = all[i + 1] ?? join.joinIn[0];
    return fadeIn(start, start + 0.02) * (1 - fadeOut(next, next + 0.02));
  });

  return {
    progress: p,
    reducedMotion: rm,
    world: worldFrame(p, rm),
    camera: rm ? { zoom: 1, x: 0 } : cameraAt(p),
    scenes: {
      opacity: sceneOpacityMap,
      near: sceneNearMap,
      transition: rm ? null : findTransition(p),
    },
    enter: { opacity: enterOpacity, inert: enterOpacity < 0.5 },
    yeriel: {
      nameOpacity: fadeIn(...yeriel.nameIn),
      nameY: rm ? 0 : within(p, ...yeriel.nameShrink) * -28,
      nameScale: rm ? 1 : 1 - within(p, ...yeriel.nameShrink) * 0.5,
      metaOpacity: fadeIn(...yeriel.metaIn),
      fragmentOpacity: MUSEUM_COPY.yeriel.fragments.map(
        (_, i) => fadeIn(...yeriel.fragmentIn(i)) * (1 - fadeOut(...yeriel.fragmentOut(i)))
      ),
    },
    mofundo: {
      nameOpacity: fadeIn(...mofundo.nameIn),
      plates: plates(SCENE_TWO_PLATES, mofundo.plateIn, { depthScale: false, maxOpacity: 1 }),
      waveformOpacity: fadeIn(...mofundo.waveformIn),
    },
    rememberHim: {
      questionOpacity: fadeIn(...rememberHim.questionIn),
      plates: plates(SCENE_THREE_PLATES, rememberHim.plateIn, { depthScale: true, maxOpacity: 0.85 }),
      evidenceOpacity: EVIDENCE_SLOTS.map((_, i) => fadeIn(...rememberHim.evidenceIn(i))),
      fragmentOpacity: FRAGMENT_SLOTS.map((_, i) => fadeIn(...rememberHim.fragmentIn(i))),
    },
    join: {
      active: joinActive,
      countersOpacity: fadeIn(...join.countersIn) * (1 - fadeOut(...join.countersOut)),
      counterOpacity,
      lineOpacity,
      joinOpacity: fadeIn(...join.joinIn),
      ctaOpacity: fadeIn(...join.joinIn),
    },
  };
}

/** The crossfade window at a scene boundary, if the progress is inside one. */
function findTransition(p: number): SceneTransition | null {
  for (let i = 1; i < MUSEUM_SCENES.length; i += 1) {
    const boundary = MUSEUM_SCENES[i].start;
    if (p >= boundary - SCENE_FADE && p <= boundary + SCENE_FADE) {
      return {
        from: MUSEUM_SCENES[i - 1].id,
        to: MUSEUM_SCENES[i].id,
        amount: within(p, boundary - SCENE_FADE, boundary + SCENE_FADE),
      };
    }
  }
  return null;
}

/** Piecewise-linear camera path at progress p, eased per segment, from WORLD_CAMERA_KEYFRAMES. */
export function cameraPathAt(p: number): { x: number; y: number; z: number } {
  const keys = WORLD_CAMERA_KEYFRAMES;
  if (p <= keys[0].at) return { x: keys[0].x, y: keys[0].y, z: keys[0].z };
  for (let i = 1; i < keys.length; i += 1) {
    const a = keys[i - 1];
    const b = keys[i];
    if (p <= b.at) {
      const t = within(p, a.at, b.at);
      const e = t * t * (3 - 2 * t);
      return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z: a.z + (b.z - a.z) * e };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y, z: last.z };
}

/**
 * Derive the spatial frame. With reduced motion the renderer is not mounted, so the values only need to be
 * well-formed: the camera holds still and every plate is shown at its final state.
 */
export function worldFrame(p: number, rm: boolean): WorldFrame {
  const path = rm ? WORLD_CAMERA_KEYFRAMES[0] : cameraPathAt(p);
  const cameraZ = path.z;
  const plates: WorldPlateFrame[] = WORLD_PLATES.map((plate) => {
    const reveal = rm ? (p >= plate.revealFrom ? 1 : 0) : within(p, plate.revealFrom, plate.revealTo);
    // Signed distance in front of the camera. Positive means still ahead; negative means the camera has passed it.
    const ahead = cameraZ - plate.z;
    const passed = rm ? 1 : clamp01((ahead + WORLD_PASS_FADE) / WORLD_PASS_FADE);
    const fog = clamp01(Math.max(0, ahead) / WORLD_FOG_DISTANCE);
    return {
      id: plate.id,
      asset: plate.asset,
      x: plate.x,
      y: plate.y,
      z: plate.z,
      height: plate.height,
      crop: plate.crop,
      opacity: reveal * passed,
      fog,
    };
  });
  // Dust builds while the camera travels (the middle of the track), and settles at the ends.
  const dustOpacity = rm ? 0 : Math.min(1, within(p, 0.02, 0.2) + within(p, 0.26, 0.5)) * 0.6;
  return { cameraX: path.x, cameraY: path.y, cameraZ, plates, dustOpacity: Math.min(0.6, dustOpacity) };
}
