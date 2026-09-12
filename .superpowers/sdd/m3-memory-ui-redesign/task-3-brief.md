# Task 3: Create Separate Hero Component and Desktop Layout

## Overview
Extract the hero section into a reusable `HomeHero` component with proper left-text (45%) / right-portrait (50%) desktop split layout. Mobile stacks vertically. Add responsive styles to globals.css.

## Files to Create/Modify
- Create: `src/components/HomeHero.tsx`
- Modify: `src/app/page.tsx` (import and use HomeHero component, remove old `.split` section)
- Modify: `src/app/globals.css` (add `.home-hero-wrapper` and responsive styles)

## Global Constraints (from plan)
- NO backend changes
- NO new dependencies
- Use existing CSS variables and classes
- Component must accept props (can be expanded later)

## Interfaces

### Input (from Task 2)
- PhotoPlaceholder component exists with `size="large"`, `showLabel={false}` support

### Output (consumed by page.tsx and final render)
- `HomeHero` component renders:
  - LEFT column: kicker, h1, body text, CTA button, micro note
  - RIGHT column: PhotoPlaceholder portrait
  - Desktop: side-by-side grid with 45%/50% split, 64px gap
  - Tablet: 48px gap
  - Mobile: stacked vertically with 32px gap

## Steps

### 3.1: Create HomeHero.tsx

Create new file `src/components/HomeHero.tsx`:

```tsx
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";

export function HomeHero() {
  return (
    <div 
      className="home-hero-wrapper"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '64px',
        alignItems: 'start',
        marginBottom: '80px',
      }}
    >
      {/* LEFT: Text content */}
      <div 
        className="home-hero-text"
        style={{
          minWidth: 0,
          flex: '0 1 45%',
        }}
      >
        <p className="kicker">Personal Archive × Creative Studio × Memory Box</p>
        <h1 style={{ margin: '16px 0 24px' }}>
          An autobiography<br />written by everyone<br />who was there.
        </h1>
        <p style={{ 
          color: 'var(--muted)',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Festivals. Friends. Late nights. Conversations. Chaos. Connection. I don't remember everything, but maybe you do.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              color: 'var(--muted)', 
              fontWeight: '500' 
            }}>
              Real memories. A bigger picture.
            </p>
          </div>
          <Link className="primary-action" href="/remember">
            Share a Memory
          </Link>
        </div>

        <p className="micro-note">
          No account needed. Your original words stay private and preserved.
        </p>
      </div>

      {/* RIGHT: Portrait image */}
      <div 
        className="home-hero-portrait"
        style={{
          flex: '0 1 50%',
          minWidth: 0,
        }}
      >
        <PhotoPlaceholder 
          aspectRatio="2/3" 
          size="large" 
          showLabel={false}
        />
      </div>
    </div>
  );
}
```

### 3.2: Add responsive styles to globals.css

Add these styles to `src/app/globals.css` after the container media queries (around line 100):

```css
/* Home Hero Split Layout */
.home-hero-wrapper {
  display: grid !important;
  gap: 64px;
  align-items: start;
  margin-bottom: 80px;
}

@media (max-width: 1199px) {
  .home-hero-wrapper {
    gap: 48px;
  }
}

@media (max-width: 768px) {
  .home-hero-wrapper {
    display: grid !important;
    grid-template-columns: 1fr;
    gap: 32px;
    margin-bottom: 60px;
  }

  .home-hero-portrait {
    grid-column: 1;
    margin-top: 24px;
  }
}

.home-hero h1 {
  font-size: clamp(40px, 4.5vw, 68px);
  line-height: 1.2;
  margin: 16px 0 24px;
}

@media (max-width: 768px) {
  .home-hero h1 {
    font-size: clamp(32px, 6vw, 48px);
    line-height: 1.1;
  }
}
```

### 3.3: Update page.tsx to use HomeHero component

At the top of `src/app/page.tsx`, add import:
```tsx
import { HomeHero } from "@/components/HomeHero";
```

Replace the entire `.split` div and hero section (lines 16-33 in original) with:
```tsx
<HomeHero />
```

The section should be removed:
```tsx
{/* REMOVE THIS: */}
<div className="split" style={{ alignItems: 'start', marginBottom: '64px' }}>
  <section className="home-hero" style={{ padding: '0' }}>
    {/* ... all the old hero content ... */}
  </section>
  <PhotoPlaceholder label="Hero Portrait" />
</div>
```

Replace with:
```tsx
{/* ADD THIS: */}
<HomeHero />
```

### 3.4: Commit

```bash
cd /c/Users/yerie/m3-memory
git add src/components/HomeHero.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: extract hero to component with desktop/mobile split

- HomeHero component with left-text (45%) / right-portrait (50%) split
- Portrait uses 2:3 aspect ratio
- Mobile stacks vertically with full-width
- Responsive gap adjustment (64px desktop, 48px tablet, 32px mobile)"
```

## Testing

1. `npm run typecheck` — should pass
2. `npm run lint` — should pass
3. Visual check:
   - Desktop (1440px): text on LEFT, portrait on RIGHT, side-by-side
   - Tablet (920px): tighter gap (48px)
   - Mobile (390px): stacked vertically, portrait below text, full-width

## Report

Write your implementation report to: `.superpowers/sdd/m3-memory-ui-redesign/task-3-report.md`

Include:
- Exact code added/modified (file paths and line numbers)
- Test commands and output
- Self-review notes
- Commit SHA(s)
