# Task 5: Redesign Gallery/Polaroid Strip with Overlap and Rotation

## Overview
Transform the gallery from a centered grid layout to an overlapping scattered layout on desktop (with varied z-depths) and a staggered vertical stack on mobile. Maintains Polaroid card rotation.

## Files to Modify
- `src/app/globals.css` (.gallery styles - complete rewrite)
- Verify: `src/components/PolaroidCard.tsx` (should already have rotation prop)

## Global Constraints (from plan)
- NO component interface changes
- Rotation prop already exists on PolaroidCard
- Desktop: absolute positioning with overlaps
- Mobile: staggered stack

## Interfaces

### Input
- PolaroidCard component accepts `rotation` prop (assumed to exist)
- Page imports and uses PolaroidCard with rotation values

### Output
- `.gallery` class renders overlapping layout on desktop
- `.gallery` class renders staggered stack on mobile
- Each gallery item uses `position: absolute` (desktop) or `position: relative` (mobile)

## Steps

### 5.1: Update gallery CSS in globals.css

Find and replace `.gallery` styles (around line 635):

Current:
```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 24px;
  margin: 0 auto;
}
```

Replace with:
```css
.gallery {
  position: relative;
  height: 500px;
  margin: 0 auto 80px;
  perspective: 1000px;
}

.gallery > * {
  position: absolute;
  width: 180px;
  height: 240px;
}

/* Desktop: scattered layout with overlap */
@media (min-width: 769px) {
  .gallery > :nth-child(1) {
    top: 20px;
    left: 5%;
    z-index: 3;
  }

  .gallery > :nth-child(2) {
    top: 60px;
    left: 25%;
    z-index: 2;
  }

  .gallery > :nth-child(3) {
    top: 40px;
    right: 20%;
    z-index: 4;
  }

  .gallery > :nth-child(4) {
    top: 180px;
    right: 5%;
    z-index: 1;
  }
}

/* Mobile: staggered vertical stack */
@media (max-width: 768px) {
  .gallery {
    height: auto;
  }

  .gallery > * {
    position: relative;
    width: 140px;
    height: 180px;
    margin-bottom: 60px;
  }

  .gallery > :nth-child(odd) {
    margin-left: 40px;
  }

  .gallery > :nth-child(even) {
    margin-left: 0;
  }
}
```

### 5.2: Verify PolaroidCard has rotation prop

Check `src/components/PolaroidCard.tsx` that it includes the transform with rotation:

```tsx
style={{
  transform: `rotate(${rotation}deg)`,
  // ... other styles
}}
```

If missing, add to the component style object.

### 5.3: Commit

```bash
cd /c/Users/yerie/m3-memory
git add src/app/globals.css
git commit -m "feat: redesign gallery with overlapping Polaroid layout

- Desktop: scattered absolute positioning with varied z-depths
- Mobile: staggered vertical stack with alternating margins
- Rotation prop preserved on PolaroidCard"
```

## Testing

1. `npm run typecheck` — should pass
2. `npm run lint` — should pass
3. Visual check:
   - Desktop (1440px): 4 cards scattered with overlaps, different z-depths visible
   - Mobile (390px): cards stack vertically with stagger effect
   - No horizontal scroll at any breakpoint

## Report

Write your implementation report to: `.superpowers/sdd/m3-memory-ui-redesign/task-5-report.md`

Include:
- Exact CSS changes made with line numbers
- Verification of PolaroidCard rotation prop (what you found)
- Test commands and output
- Self-review notes
- Commit SHA(s)
