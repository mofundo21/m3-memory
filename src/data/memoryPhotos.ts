export type MemoryPhotoCategory = 'childhood' | 'DR' | 'Bronx' | 'Orlando' | 'Greenville' | 'family' | 'friends' | 'work' | 'festival' | 'DJ' | 'chess' | 'travel' | 'nightlife' | 'portrait' | 'M3';

export interface MemoryPhoto {
  id: string;
  src: string;
  alt: string;
  era: string;
  event?: string;
  category: MemoryPhotoCategory;
  caption: string;
  desktopPlacement?: {
    position: 'left' | 'right' | 'center' | 'full';
    size?: 'small' | 'medium' | 'large';
    columns?: number;
  };
  mobilePlacement?: {
    position: 'full' | 'center';
    size?: 'small' | 'medium';
  };
  rotation: number;
  priority: number;
}

export const memoryPhotos: MemoryPhoto[] = [
  {
    id: 'placeholder-1',
    src: 'placeholder',
    alt: 'Photo memory from personal archive',
    era: '2010s',
    category: 'friends',
    caption: 'A moment shared',
    rotation: -2,
    priority: 1,
  },
  {
    id: 'placeholder-2',
    src: 'placeholder',
    alt: 'Memory detail from personal collection',
    era: '2010s',
    category: 'family',
    caption: 'Family memory',
    rotation: 3,
    priority: 2,
  },
  {
    id: 'placeholder-3',
    src: 'placeholder',
    alt: 'Captured moment from personal archive',
    era: '2010s',
    category: 'festival',
    caption: 'Festival moment',
    rotation: -1,
    priority: 3,
  },
  {
    id: 'placeholder-4',
    src: 'placeholder',
    alt: 'Personal memory photograph',
    era: '2010s',
    category: 'portrait',
    caption: 'A portrait',
    rotation: 2,
    priority: 4,
  },
  {
    id: 'placeholder-5',
    src: 'placeholder',
    alt: 'Travel memory from personal collection',
    era: '2010s',
    category: 'travel',
    caption: 'Travel memory',
    rotation: -3,
    priority: 5,
  },
];

export function getPhotosForCategory(category: MemoryPhotoCategory): MemoryPhoto[] {
  return memoryPhotos.filter(photo => photo.category === category).sort((a, b) => a.priority - b.priority);
}

export function getRandomPhotos(count: number = 3): MemoryPhoto[] {
  const shuffled = [...memoryPhotos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
