/**
 * Museum asset manifest (Phase 3).
 *
 * Single source of truth for museum media. Only placeholders exist today.
 * Real files replace an entry by changing `src` and `status` after Yeriel's approval.
 * See docs/MOFUNDO_MUSEUM_DESIGN_BIBLE.md §19.
 */

export type MuseumAssetStatus = 'placeholder' | 'pending-approval' | 'approved';

export interface MuseumAsset {
  id: string;
  category: 'portrait' | 'photography' | 'artifacts' | 'audio' | 'archiveMedia';
  scene: '01' | '02' | '03' | '04';
  status: MuseumAssetStatus;
  src: string;
  alt: string;
  /** Recommended format and size for the real asset (not used while placeholder). */
  recommended: string;
}

export const museumAssets: MuseumAsset[] = [
  {
    id: 'portrait',
    category: 'portrait',
    scene: '01',
    status: 'placeholder',
    src: '/media/museum/placeholders/portrait-placeholder.svg',
    alt: 'Placeholder portrait plate. Replace with an approved photograph.',
    recommended: '2400×3000 AVIF/WebP, ≤ 220 KB; optional alpha cutout ≤ 260 KB',
  },
  ...[1, 2, 3, 4, 5, 6].map((n): MuseumAsset => ({
    id: `photo-${String(n).padStart(2, '0')}`,
    category: 'photography',
    scene: n <= 3 ? '02' : '03',
    status: 'placeholder',
    src: `/media/museum/placeholders/photo-placeholder-${String(n).padStart(2, '0')}.svg`,
    alt: `Placeholder photograph ${n}. Date and place to confirm.`,
    recommended: '1600 px long edge, AVIF/WebP, ≤ 160 KB',
  })),
  // Real portraits supplied for the cinematic prototype (Oct 2026). Not yet approved for public release.
  ...[1, 2, 3, 4].map((n): MuseumAsset => ({
    id: `portrait-${String(n).padStart(2, '0')}`,
    category: 'portrait',
    scene: '01',
    status: 'pending-approval',
    src: `/media/museum/portraits/portrait-${String(n).padStart(2, '0')}.jpg`,
    alt: `Portrait ${n}. Approval for public release pending.`,
    recommended: '768×1024 JPEG, source as supplied',
  })),
];

export function getMuseumAsset(id: string): MuseumAsset {
  const asset = museumAssets.find((a) => a.id === id);
  if (!asset) throw new Error(`Unknown museum asset: ${id}`);
  return asset;
}
