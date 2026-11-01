import { CAMERA_KEYFRAMES, MUSEUM_SCENES, SCENE_FADE, type MuseumSceneId } from '@/lib/museumConfig';

export interface CameraState {
  zoom: number;
  x: number;
}

/** Clamp a value to [0, 1]. */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Progress of `p` through the window [from, to], clamped to 0..1.
 * Used for per-element reveals inside a scene.
 */
export function within(p: number, from: number, to: number): number {
  if (to <= from) return p >= to ? 1 : 0;
  return clamp01((p - from) / (to - from));
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Camera state at scroll progress `p`. Piecewise linear between keyframes, eased per segment. */
export function cameraAt(p: number): CameraState {
  const keys = CAMERA_KEYFRAMES;
  if (p <= keys[0].at) return { zoom: keys[0].zoom, x: keys[0].x };
  for (let i = 1; i < keys.length; i += 1) {
    const a = keys[i - 1];
    const b = keys[i];
    if (p <= b.at) {
      const t = smoothstep(within(p, a.at, b.at));
      return { zoom: a.zoom + (b.zoom - a.zoom) * t, x: a.x + (b.x - a.x) * t };
    }
  }
  const last = keys[keys.length - 1];
  return { zoom: last.zoom, x: last.x };
}

/**
 * Opacity of a scene at progress `p`. Each scene fades in over SCENE_FADE
 * centered on its start and fades out centered on its end, so neighbors overlap.
 */
export function sceneOpacity(sceneId: MuseumSceneId, p: number): number {
  const scene = MUSEUM_SCENES.find((s) => s.id === sceneId);
  if (!scene) return 0;
  const fadeIn = within(p, scene.start - SCENE_FADE, scene.start + SCENE_FADE);
  // The last scene holds to the end of the track; it never fades out.
  const fadeOut = scene.end >= 1 ? 1 : 1 - within(p, scene.end - SCENE_FADE, scene.end + SCENE_FADE);
  return Math.min(fadeIn, fadeOut);
}

/**
 * Reduced-motion variant: a scene is either fully shown or hidden, no overlap.
 * The last scene includes its end point, so the final frame (progress 1) still shows it.
 */
export function sceneActive(sceneId: MuseumSceneId, p: number): number {
  const scene = MUSEUM_SCENES.find((s) => s.id === sceneId);
  if (!scene) return 0;
  const inside = p >= scene.start && (scene.end >= 1 ? p <= 1 : p < scene.end);
  return inside ? 1 : 0;
}

/**
 * True when a scene is current or adjacent, so its assets may be mounted.
 * Keeps the first paint light and loads photographs only as the visitor approaches them.
 */
export function sceneNear(sceneId: MuseumSceneId, p: number, margin = 0.12): boolean {
  const scene = MUSEUM_SCENES.find((s) => s.id === sceneId);
  if (!scene) return false;
  return p >= scene.start - margin && p <= scene.end + margin;
}
