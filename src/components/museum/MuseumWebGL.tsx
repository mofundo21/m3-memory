'use client';

/**
 * Cinematic layer for the museum: YERIEL → MOFUNDO, one continuous spatial world.
 *
 * Every value comes from the shared MuseumFrame (src/lib/museumTimeline.ts, `world`). This file derives no timing.
 * The canvas is decorative: it is aria-hidden, holds no controls, and carries no information the DOM text does not.
 *
 * The camera travels along −Z through photographic planes placed at real depths. Plates fade in as they are
 * revealed, and fade out as the camera passes them. Distant plates are fogged toward the background colour, so the
 * space reads as one volume rather than a stack of cards. There is no shader transition; the change is spatial.
 *
 * Rendering is on demand. Context loss, a texture failure, or a thrown error calls onFail and the page drops to the
 * DOM tier.
 */

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { getMuseumAsset } from '@/lib/museumAssets';
import type { MuseumFrame, WorldPlateFrame } from '@/lib/museumTimeline';

const FOV_LANDSCAPE = 35;
const FOV_PORTRAIT = 50;
/** Portrait photographs are 3:4 (width:height). */
const PLATE_ASPECT = 0.75;
/** Upright texture size. The source JPEGs are 768×1024; this keeps them at native resolution. */
const TEX_W = 768;
const TEX_H = 1024;

/** Dust budget. Desktop ≤ 300 (design); phone uses fewer. */
export const DUST_DESKTOP = 300;
export const DUST_MOBILE = 120;

/** Background colour the fog fades toward. Matches the page background. */
const FOG_COLOUR = new THREE.Color('#0b1012');

type PortraitId = 'portrait-01' | 'portrait-02' | 'portrait-03' | 'portrait-04';
const PORTRAIT_IDS: PortraitId[] = ['portrait-01', 'portrait-02', 'portrait-03', 'portrait-04'];

/** Draw an image into a fixed-size canvas and wrap it as a texture. Used because images without intrinsic
 *  size upload to WebGL as empty textures when passed straight to TextureLoader. */
async function loadPlateTexture(src: string): Promise<THREE.Texture> {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  const srcW = img.naturalWidth || TEX_W;
  const srcH = img.naturalHeight || TEX_H;
  const scale = Math.max(TEX_W / srcW, TEX_H / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  ctx.drawImage(img, (TEX_W - dw) / 2, (TEX_H - dh) / 2, dw, dh);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

type Textures = Record<PortraitId, THREE.Texture>;

/** Load the four portraits once. Disposed on unmount. A failed load reports through onFail. */
function useTextures(onFail: () => void): Textures | null {
  const [textures, setTextures] = useState<Textures | null>(null);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    let live = true;
    Promise.allSettled(PORTRAIT_IDS.map((id) => loadPlateTexture(getMuseumAsset(id).src))).then((results) => {
      const loaded = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
      if (!live || loaded.length !== PORTRAIT_IDS.length) {
        loaded.forEach((t) => t.dispose());
        if (live) onFailRef.current();
        return;
      }
      const byId = {} as Textures;
      PORTRAIT_IDS.forEach((id, i) => {
        byId[id] = loaded[i];
      });
      setTextures(byId);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (!textures) return;
      Object.values(textures).forEach((t) => t.dispose());
    };
  }, [textures]);

  return textures;
}

/** Crop clones of a base texture. A clone shares the image, so cropping costs no extra upload. */
function useCropTexture(base: THREE.Texture | undefined, crop: [number, number, number, number]) {
  const tex = useMemo(() => {
    if (!base) return null;
    const t = base.clone();
    t.offset.set(crop[0], crop[1]);
    t.repeat.set(crop[2], crop[3]);
    t.needsUpdate = true;
    return t;
  }, [base, crop[0], crop[1], crop[2], crop[3]]);

  useEffect(() => {
    return () => {
      // Only the clones are disposed here; the base texture is owned by useTextures.
      if (tex && tex !== base) tex.dispose();
    };
  }, [tex, base]);

  return tex;
}

function CameraRig({ frame }: { frame: MuseumFrame }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));

  useEffect(() => {
    const { cameraX: x, cameraY: y, cameraZ: z } = frame.world;
    camera.position.set(x, y, z);
    // Look straight ahead along the path. The camera dollies; it does not rotate toward targets.
    camera.lookAt(x, y, z - 10);
    const fov = aspect < 0.8 ? FOV_PORTRAIT : FOV_LANDSCAPE;
    if (camera.fov !== fov) camera.fov = fov;
    camera.updateProjectionMatrix();
    invalidate();
  }, [frame.world.cameraX, frame.world.cameraY, frame.world.cameraZ, aspect, camera, invalidate]);

  return null;
}

/** Portrait screens compress the layout sideways and shrink the planes, so the same path keeps its composition. */
interface Layout {
  narrow: boolean;
}
const NARROW_X = 0.5;
const NARROW_HEIGHT = 0.8;

function Plate({ pl, texture, layout }: { pl: WorldPlateFrame; texture: THREE.Texture; layout: Layout }) {
  const h = pl.height * (layout.narrow ? NARROW_HEIGHT : 1);
  const w = h * PLATE_ASPECT;
  const x = pl.x * (layout.narrow ? NARROW_X : 1);
  // Fog: the further away, the closer to the background colour.
  const tint = useMemo(() => new THREE.Color(1, 1, 1).lerp(FOG_COLOUR, pl.fog * 0.85), [pl.fog]);
  if (pl.opacity <= 0.001) return null;
  return (
    // Transparent planes must draw far to near, so the render order rises with z (the far plates have the lowest z).
    <mesh position={[x, pl.y, pl.z]} renderOrder={Math.round(pl.z * 10)}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} color={tint} transparent opacity={pl.opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Dust({ count, opacity, depthSpan }: { count: number; opacity: number; depthSpan: [number, number] }) {
  // Dust fills the depth range that the planes occupy, so parallax is visible against it.
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    // Deterministic scatter: the same frame every time, so screenshots and tests are reproducible.
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (rand() * 2 - 1) * 7;
      positions[i * 3 + 1] = (rand() * 2 - 1) * 4.5;
      positions[i * 3 + 2] = depthSpan[0] + rand() * (depthSpan[1] - depthSpan[0]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, depthSpan[0], depthSpan[1]]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry} renderOrder={100}>
      {/* Fixed pixel size. With attenuation, dust that drifts near the camera becomes large squares. */}
      <pointsMaterial color="#e9dcc4" size={2} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} />
    </points>
  );
}

/** One plate, with its crop texture derived from the base portrait. */
function PlateWithCrop({ pl, textures, layout }: { pl: WorldPlateFrame; textures: Textures; layout: Layout }) {
  const base = textures[pl.asset as PortraitId];
  const crop = useCropTexture(base, pl.crop);
  if (!crop) return null;
  return <Plate pl={pl} texture={crop} layout={layout} />;
}

function Scene({ frame, textures, dustCount, layout }: { frame: MuseumFrame; textures: Textures; dustCount: number; layout: Layout }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [frame, invalidate]);

  return (
    <group>
      {frame.world.plates.map((pl) => (
        <PlateWithCrop key={pl.id} pl={pl} textures={textures} layout={layout} />
      ))}
      <Dust count={dustCount} opacity={frame.world.dustOpacity} depthSpan={[-26, 8]} />
    </group>
  );
}

interface MuseumWebGLProps {
  frame: MuseumFrame;
  onFail: () => void;
}

/** Catches a renderer that throws during creation, so the page can drop to the DOM tier. */
class RendererBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function MuseumWebGLInner({ frame, onFail }: { frame: MuseumFrame; onFail: () => void }) {
  const textures = useTextures(onFail);
  const narrow = useThree((s) => s.size.width < 600);
  if (!textures) return null;
  return (
    <>
      <CameraRig frame={frame} />
      <Scene frame={frame} textures={textures} dustCount={narrow ? DUST_MOBILE : DUST_DESKTOP} layout={{ narrow }} />
    </>
  );
}

export default function MuseumWebGL({ frame, onFail }: MuseumWebGLProps) {
  return (
    <div className="museum-webgl" aria-hidden="true">
      <RendererBoundary onFail={onFail}>
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
          camera={{ fov: FOV_LANDSCAPE, near: 0.1, far: 60, position: [0, 0, 9] }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              'webglcontextlost',
              (event) => {
                event.preventDefault();
                onFail();
              },
              { once: true }
            );
          }}
        >
          <MuseumWebGLInner frame={frame} onFail={onFail} />
        </Canvas>
      </RendererBoundary>
    </div>
  );
}
