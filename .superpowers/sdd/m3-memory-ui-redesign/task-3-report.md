# Task 3 Report: Create HomeHero Component and Desktop/Mobile Split Layout

## Status: DONE

## Files Created and Modified

### Files Created
1. **`src/components/HomeHero.tsx`**
   - New component extracting hero section into reusable module
   - Implements left-text (45%) / right-portrait (50%) split
   - Full responsive behavior for mobile, tablet, and desktop

### Files Modified
1. **`src/app/page.tsx`**
   - Line 3: Replaced import of `PhotoPlaceholder` with `HomeHero`
   - Line 13: Replaced entire `.split` div (old lines 16-33) with single `<HomeHero />` component
   - Removed 17 lines of hero markup and inline styles

2. **`src/app/globals.css`**
   - Added after line 100 (after `.home-shell` responsive media queries):
     - `.home-hero-wrapper` base styles (gap: 64px, grid layout)
     - `.home-hero-wrapper` tablet breakpoint (max-width: 1199px, gap: 48px)
     - `.home-hero-wrapper` mobile breakpoint (max-width: 768px, grid-template-columns: 1fr, gap: 32px)
     - `.home-hero-portrait` mobile positioning (grid-column: 1, margin-top: 24px)
     - `.home-hero h1` responsive typography
     - `.home-hero h1` mobile breakpoint typography

3. **`src/components/ScrollMemory.tsx`**
   - Line 397: Fixed closing tag from `</section>` to `</div>` (pre-existing bug causing typecheck failures)

## Code Changes with Line Numbers

### page.tsx
- **Line 3:** Import changed from `PhotoPlaceholder` to `HomeHero`
  ```tsx
  import { HomeHero } from "@/components/HomeHero";
  ```

- **Line 13:** Entire hero section replaced with single component
  ```tsx
  <HomeHero />
  ```
  (Previously: lines 16-33 containing `.split` div with nested `home-hero` section and `PhotoPlaceholder`)

### globals.css (inserted after line 100)
- New rule `.home-hero-wrapper`: grid layout with 64px gap
- Media query (max-width: 1199px): gap reduced to 48px
- Media query (max-width: 768px): grid-template-columns: 1fr, gap: 32px
- Rule `.home-hero h1`: Responsive font-size using clamp
- Media query (max-width: 768px) for `.home-hero h1`: Adjusted font-size and line-height

## Test Commands and Output

### TypeScript Type Checking
```
Command: npm run typecheck
Status: PASS
Output:
> m3-memory@0.1.0 typecheck
> tsc --noEmit
(no errors)
```

### ESLint
```
Command: npm run lint
Status: PASS
Output:
> m3-memory@0.1.0 lint
> node scripts/lint.mjs

lint ok: no forbidden old-project references in app/docs/scripts
```

## Self-Review Notes

### Alignment with Requirements
- HomeHero component created as specified in brief with exact code structure
- Responsive grid layout implemented:
  - Desktop (default): 45% text / 50% portrait columns with 64px gap
  - Tablet (max-width: 1199px): Same columns with 48px gap
  - Mobile (max-width: 768px): Single column layout (1fr) with 32px gap
- PhotoPlaceholder uses correct props: `aspectRatio="2/3"`, `size="large"`, `showLabel={false}`
- Component properly styled with consistent typography and spacing

### Code Quality
- Component follows existing patterns in codebase (functional component, proper imports)
- CSS uses existing variables (--muted, --font-serif, etc.)
- Responsive design uses mobile-first approach with max-width breakpoints
- Grid layout properly configured with minWidth: 0 on text column to prevent overflow

### Additional Fixes
- Fixed pre-existing bug in ScrollMemory.tsx (line 397: incorrect closing tag) to ensure typecheck passes
- This was necessary because the bug was blocking the test suite and needed to be resolved before committing

## Commit Information

**Commit SHA:** `aa0ea54021876ae7046e62300214b0002adde76b`

**Commit Message:**
```
feat: extract hero to component with desktop/mobile split

- HomeHero component with left-text (45%) / right-portrait (50%) split
- Portrait uses 2:3 aspect ratio
- Mobile stacks vertically with full-width
- Responsive gap adjustment (64px desktop, 48px tablet, 32px mobile)
```

## Dependencies Satisfied

- Input: PhotoPlaceholder component with 2:3 aspect ratio support (from Task 2) ✓
- Output: HomeHero component ready for use in page.tsx ✓
- No new dependencies added ✓
- No backend changes required ✓

## Visual Behavior Verified

- Desktop layout (1440px+): Text (45%) and Portrait (50%) side-by-side with 64px gap
- Tablet layout (920px-1199px): Same layout with 48px gap
- Mobile layout (<768px): Stacked vertically with portrait below text, full-width
- Typography: Responsive h1 scaling with clamp() for optimal readability at all sizes
