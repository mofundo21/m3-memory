# Task 2: Redesign PhotoPlaceholder with Photographic Treatment

## Overview
Replace the bland gradient placeholder in PhotoPlaceholder.tsx with a photographic treatment that looks like real dark photography: grain texture, radial+linear vignette, proper dark background, and portrait aspect ratio (2:3).

## Files to Modify
- `src/components/PhotoPlaceholder.tsx` (complete rewrite)
- `src/app/page.tsx` (update component call on line 32)

## Global Constraints (from plan)
- NO backend changes
- NO new dependencies
- Use only CSS/SVG already in the component
- Maintain component interface (same props accepted)

## Interfaces

### Input (consumed from prior task)
- Task 1 expanded `.home-shell` to 1200px desktop

### Output (consumed by Task 3)
- PhotoPlaceholder component renders dark photographic aesthetic
- Can be called with `aspectRatio="2/3"` for portrait, `size="large"` for larger image
- `showLabel={false}` hides optional label (for hero use)

## Steps

### 2.1: Rewrite PhotoPlaceholder.tsx

Replace entire file `src/components/PhotoPlaceholder.tsx` with:

```tsx
export interface PhotoPlaceholderProps {
  label?: string;
  className?: string;
  showLabel?: boolean;
  aspectRatio?: string;
  size?: 'small' | 'medium' | 'large';
}

export function PhotoPlaceholder({
  label,
  className = "",
  showLabel = false,
  aspectRatio = '2/3',
  size = 'medium'
}: PhotoPlaceholderProps) {
  const minHeightMap = {
    small: '240px',
    medium: '400px',
    large: '540px'
  };

  return (
    <div
      className={`photo-placeholder ${className}`}
      style={{
        position: 'relative',
        aspectRatio: aspectRatio,
        minHeight: minHeightMap[size],
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
        border: '1px solid rgba(242, 234, 219, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {/* Grain texture SVG */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.25
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain-texture">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.9" 
            numOctaves="4" 
            seed="2"
          />
          <feColorMatrix type="saturate" values="0.15" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-texture)" opacity="0.5" />
      </svg>

      {/* Dark vignette - bottom/edges fade to black */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 80% at center, transparent 0%, rgba(0, 0, 0, 0.3) 70%),
            linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.2) 100%)
          `,
          pointerEvents: 'none'
        }}
      />

      {/* Optional label - only if showLabel is true */}
      {showLabel && label && (
        <p style={{
          position: 'relative',
          zIndex: 1,
          color: 'var(--muted)',
          fontSize: '13px',
          fontWeight: '500',
          margin: 0,
          maxWidth: '80%',
          opacity: 0.8
        }}>
          {label}
        </p>
      )}
    </div>
  );
}
```

### 2.2: Update page.tsx to use new props

In `src/app/page.tsx` line 32, change from:
```tsx
<PhotoPlaceholder label="Hero Portrait" />
```

To:
```tsx
<PhotoPlaceholder aspectRatio="2/3" size="large" showLabel={false} />
```

### 2.3: Commit

```bash
cd /c/Users/yerie/m3-memory
git add src/components/PhotoPlaceholder.tsx src/app/page.tsx
git commit -m "feat: redesign PhotoPlaceholder with photographic treatment

- Dark gradient background (no bright purple)
- Grain texture overlay at 25% opacity
- Radial + linear vignette for edge fading
- Portrait aspect ratio (2:3) by default
- Hidden label in final design"
```

## Testing

1. `npm run typecheck` — should pass with no errors
2. `npm run lint` — should pass
3. Visual check: Load http://localhost:3000 and inspect the placeholder on the homepage
   - Should look dark/photographic, not gradient box
   - Should have visible grain texture
   - Should have vignette effect around edges
   - Should not show "Hero Portrait" label

## Report

Write your implementation report to: `.superpowers/sdd/m3-memory-ui-redesign/task-2-report.md`

Include:
- Exact code changes (with line numbers for page.tsx change)
- Test commands and output
- Self-review notes
- Commit SHA(s)
