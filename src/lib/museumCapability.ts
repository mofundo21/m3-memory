/**
 * Museum rendering tier. Decided once, on the client, after mount.
 *
 * - `cinematic`: the WebGL canvas renders Scenes 01 and 02. Text, controls and the
 *   accessibility layer are always the DOM.
 * - `dom`: the existing DOM/CSS sequence, with no canvas and no renderer code loaded.
 *
 * Reduced motion always resolves to `dom`. A lost WebGL context drops to `dom` and does
 * not retry automatically. This module is pure so the decision can be tested without a browser.
 */

export type MuseumTier = 'cinematic' | 'dom';

export interface MuseumCapabilityInput {
  /** The cinematic experiment is opt-in (`?cinematic=1`) until it passes its success criteria. */
  optedIn: boolean;
  reducedMotion: boolean;
  /** Whether a WebGL2 context can be created in this browser. */
  webgl2: boolean;
  /** Set once a context loss or creation failure has been observed. Sticky for the page visit. */
  contextFailed: boolean;
}

export function decideMuseumTier(input: MuseumCapabilityInput): MuseumTier {
  if (!input.optedIn) return 'dom';
  if (input.reducedMotion) return 'dom';
  if (!input.webgl2) return 'dom';
  if (input.contextFailed) return 'dom';
  return 'cinematic';
}

/**
 * Whether this browser can create a WebGL2 context. Browser-only; returns false on the
 * server and on any exception, so the caller falls back to the DOM tier.
 */
export function detectWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    // Release the probe context immediately; the renderer creates its own.
    const loseContext = gl.getExtension('WEBGL_lose_context');
    loseContext?.loseContext();
    return true;
  } catch {
    return false;
  }
}
