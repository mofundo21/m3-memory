# M3 Memory — Visual Correction Audit

**Date:** 2026-09-11  
**Status:** CURRENT STATE ANALYSIS  
**Target:** Match approved M3 Memory mockup with intentional desktop/mobile compositions

---

## CURRENT VS. TARGET ANALYSIS

### CRITICAL ISSUES

#### 1. **DESKTOP SHELL WIDTH IS TOO CONSTRAINED**
- **Current:** `.home-shell` max-width = `760px` (globals.css:80)
- **Problem:** Even at 1440px desktop, content is constrained to 760px. This wastes ~680px of horizontal space
- **Target:** Desktop should expand to use widescreen (at least 1200–1280px at desktop breakpoints)
- **Impact:** Cannot achieve left-right composition for hero; portrait integration is impossible

#### 2. **HERO PORTRAIT IS A BLAND PLACEHOLDER**
- **Current:** PhotoPlaceholder component (PhotoPlaceholder.tsx)
  - Renders a gradient box: `linear-gradient(135deg, rgba(184, 155, 255, 0.1) 0%, rgba(159, 124, 255, 0.05) 100%)`
  - Label text only: "Hero Portrait"
  - minHeight: 360px
- **Problem:** Looks like a wireframe placeholder, not a real photograph
- **Target:** 
  - Styled to resemble an actual dark photograph
  - Photographic aspect ratio (portrait: ~3:4 or 2:3)
  - Subtle grain, vignette, fade
  - Dark image treatment (not gradient)
  - No label visible in final design
- **Impact:** Hero lacks visual weight and editorial feeling

#### 3. **NO DESKTOP-SPECIFIC COMPOSITION**
- **Current:** `.split` layout (grid-template-columns: 1fr 0.8fr) applies at all widths
  - At mobile (760px and below), this stacks via CSS
  - At desktop (1440px), it renders as intended but within 760px shell
- **Problem:** Desktop doesn't take advantage of widescreen space
- **Target:**
  - Desktop: LEFT 45–50% text / RIGHT 45–50% portrait, integrated
  - Mobile: Stacked vertically, optimized for one-handed scroll
  - Hero headline should NOT overlap portrait at either breakpoint
  - Support layered Polaroid strip composition (overlapping photos)

#### 4. **HEADLINE SIZING IS INCONSISTENT**
- **Current:** `.home-hero h1` = `clamp(44px, 8vw, 72px)` (globals.css:146)
  - At 1440px: 8vw = ~115px (exceeds clamp ceiling, locks to 72px)
  - At 390px: 8vw = ~31px (uses floor, clamps to 44px)
- **Problem:** 
  - 72px is extremely large; at desktop, headline likely wraps awkwardly and overlaps portrait
  - Doesn't match editorial control described in target ("entire headline should comfortably occupy its column")
- **Target:**
  - Desktop headline: controlled size that fits left column (~45–50% of viewport)
  - Mobile headline: smaller, readable at narrow width
  - Suggested: `clamp(40px, 4vw, 64px)` for better editorial control

#### 5. **NO RESPONSIVE NAVIGATION**
- **Current:** `.home-nav` (globals.css:91)
  - Flex layout, no mobile-specific adjustments
  - Admin link is primary navigation item (problematic per brief)
- **Target:**
  - Public header should show: Logo | Home | About | Share a Memory
  - Admin link should be hidden or moved to footer/direct route
  - Navigation should feel brand-appropriate, not minimal

#### 6. **GALLERY/POLAROID STRIP IS CENTERED GRID**
- **Current:** `.gallery` (globals.css:635)
  - `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`
  - Centered, orderly card grid
- **Problem:** Doesn't match "layered Polaroid/photo collage" aesthetic
- **Target:**
  - Desktop: overlapping photos, varied rotations, different aspect ratios
  - Mobile: reduced simultaneous photos (2-column staggered or swipeable row)
  - "Placed across a memory desk" feeling, not corporate grid

#### 7. **SCROLL EXPERIENCE (ACT I) IS DISCONNECTED**
- **Current:** ScrollMemory.tsx uses Tailwind classes
  - Separate visual system from globals.css (uses different colors, spacing)
  - Placeholder images are only 30% opacity at desktop, 50% at mobile
  - Centered text with background images
- **Problem:** Not integrated into the M3 Memory design language
- **Target:**
  - Should use globals.css tokens (colors, fonts, spacing)
  - Desktop should use alternating left/right text-image compositions
  - Mobile should use single-column with reduced visual density
  - Photos should be visible, not background accents

#### 8. **ACT II & ACT III FORMS DON'T USE DESKTOP SPACE**
- **Current:** Forms are centered in .memory-shell (max-width: 760px)
- **Problem:** Form fields stretch full width even at 1440px (within 760px container)
- **Target:**
  - Desktop: centered content column (700–800px) with optional LEFT sidebar showing context
  - Mobile: single column, optimized for thumb navigation
  - No 1400px-wide form fields

#### 9. **ADMIN INTERFACE IS SINGLE-COLUMN AT DESKTOP**
- **Current:** `.admin-layout` uses `grid-template-columns: 240px 1fr` (globals.css:644)
  - This should provide a sidebar, but within 1120px shell (admin-shell)
  - Submission detail likely doesn't use three-column layout at desktop
- **Problem:** Cannot show three-column "contributor original | review | story" layout
- **Target:**
  - Desktop at 1440px: three-column concept should work
  - Sidebar: 220–260px
  - Content: remaining viewport
  - Media should not be constrained

#### 10. **NO PHOTO PLACEHOLDER SYSTEM**
- **Current:** Hardcoded PhotoPlaceholder components with static labels
- **Problem:** Cannot swap real photos without rewriting components
- **Target:**
  - Create `src/data/memoryPhotos.ts` with photo configuration
  - Each photo should have: id, src, alt, category, era, caption, desktopPosition, mobilePosition, rotation
  - Enable seamless asset replacement

#### 11. **MISSING ARCHIVAL ATMOSPHERE**
- **Current:** Clean, minimal design
- **Problem:** No film grain, handwritten annotations, date marks, contact-sheet numbering, Polaroid captions
- **Target:**
  - Subtle film grain (already in body background, but should be stronger in hero)
  - Handwritten annotations near portrait ("People", "Places", "Moments", etc.)
  - Thin cream rules, subtle archival marks
  - Polaroid captions that support storytelling

#### 12. **MOBILE POLAROID STRIP IS TOO DENSE**
- **Current:** Gallery grid forces multiple columns even at 390px
- **Problem:** On mobile, 6 photos overlapping is chaos and inaccessible
- **Target:**
  - Mobile: swipeable horizontal row or 2-column staggered
  - Reduced simultaneous photos
  - No horizontal overflow
  - Proper spacing

---

## FILE-BY-FILE IMPACT

### Globals.css (src/app/globals.css)

| Issue | Line | Current | Target |
|-------|------|---------|--------|
| Shell width constrained | 80 | `width: min(760px, 100%)` | `width: min(1200px, 100%)` or responsive breakpoints |
| Home/memory shell | 80-81 | Both use 760px | Should differ: home wider for Act I, memory medium |
| Hero h1 sizing | 146 | `clamp(44px, 8vw, 72px)` | `clamp(40px, 4vw, 64px)` or similar |
| Split layout | 491-496 | Always 2-column | Should respond to desktop width (e.g., 45% / 45%) |
| Gallery | 635-640 | `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))` | Desktop: custom overlapping layout; Mobile: 1-2 column |
| Responsive breakpoint | 709 | `max-width: 760px` | Should add tablet (768px) and larger breakpoints |
| Admin layout | 644-648 | `grid-template-columns: 240px 1fr` | Desktop: `240px 1fr 1fr` for three-column content |

### Page.tsx (src/app/page.tsx)

| Issue | Line | Current | Target |
|-------|------|---------|--------|
| Header nav | 8-14 | Simple flex with About/Admin | Should be: Logo | Home | About | Share Memory |
| Admin link visibility | 12 | Primary nav item | Hide or move to footer |
| Hero structure | 16-33 | `<section>` with split layout | Should integrate portrait into layout |
| Photo placeholder | 32 | Raw component | Should be styled to look like real photo |
| "About" section | 35-43 | Centered h2, standard text | Desktop: could be moved or repositioned |
| Polaroid strip | 45-53 | Centered gallery with 4 cards | Desktop: overlapping; Mobile: reduced count |

### PhotoPlaceholder.tsx (src/components/PhotoPlaceholder.tsx)

| Issue | Line | Current | Target |
|-------|------|---------|--------|
| Visual treatment | 8-24 | Gradient box with text | Should mimic dark photograph with grain/vignette |
| Aspect ratio | 17 | Flexible, 360px height | Should be photographic (3:4 or 2:3 portrait) |
| Label display | 22 | Visible text label | Should be hidden or integrated as annotation |

### PolaroidCard.tsx (src/components/PolaroidCard.tsx)

| Issue | Line | Current | Target |
|-------|------|---------|--------|
| Image treatment | 9 | Gradient background | Should have more realistic photo-like treatment |
| Caption | 12 | Hardcoded "M3" | Should use data from memoryPhotos config |
| Positioning | — | Grid layout | Desktop: should support absolute/relative positioning for overlap |

### ScrollMemory.tsx (src/components/ScrollMemory.tsx)

| Issue | Range | Current | Target |
|-------|-------|---------|--------|
| Design system | 103 | Uses Tailwind | Should use globals.css colors and tokens |
| Photo visibility | 134 | Opacity 30–50% | Should be visible (80%+ opacity) |
| Layout | 127-130 | Centered flex | Desktop: alternating left/right; Mobile: centered |
| Colors | — | Tailwind palette (slate) | Should use M3 palette (--bg, --surface, --purple, etc.) |

### Layout.tsx (src/app/layout.tsx)

| Issue | Line | Current | Target |
|-------|------|---------|--------|
| Metadata | 6 | Standard desc | Should support OG/social cards with visual preview |

---

## RESPONSIVE BREAKPOINT GAPS

**Current:** Single breakpoint at 760px  
**Target:** Multi-point strategy:

```
Mobile:       320–480px   (320–430px actual testing range)
Tablet:       768–1024px  (currently falls through to desktop logic)
Desktop:      1200px+     (1280, 1440, 1920 testing)
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Foundational (Required for all other work)
1. Expand shell widths and add responsive breakpoints
2. Create photo configuration system (memoryPhotos.ts)
3. Rebuild PhotoPlaceholder with realistic treatment
4. Fix headline sizing

### Phase 2: Hero Recomposition
5. Redesign home hero to use left/right split at desktop
6. Integrate portrait into layout
7. Add handwritten annotations
8. Fix header navigation

### Phase 3: Scroll Experience & Galleries
9. Rewrite Polaroid strip for desktop overlay / mobile efficient layout
10. Integrate ScrollMemory into design system
11. Implement alternating desktop composition for Act I

### Phase 4: Forms & Admin
12. Adjust Act II/III form max-widths and layouts
13. Implement three-column admin detail view

### Phase 5: Polish
14. Add archival atmosphere (grain, marks, captions)
15. Responsive testing across all viewports
16. Screenshots and final audit

---

## SUCCESS CRITERIA

- [ ] Desktop at 1440px: hero is full-width composition (left text, right portrait), NOT centered 760px layout
- [ ] Mobile at 390px: stacked vertically, no horizontal overflow, legible
- [ ] Hero portrait: looks like a photograph, not a gradient box
- [ ] Header: Logo | Home | About | Share Memory (Admin hidden)
- [ ] Polaroid strip: overlapping & varied at desktop, efficient at mobile
- [ ] Scroll experience: integrated design language, alternating compositions
- [ ] Forms: reasonable max-width (700–800px), not stretched to 1400px
- [ ] Admin: three-column layout at desktop where space permits
- [ ] All tests pass, no regressions

---

## NEXT STEPS

1. **User confirms scope:** Is this audit accurate? Any adjustments?
2. **Begin Phase 1:** Expand shells, create photo config, rebuild hero
3. **Frequent viewport testing:** After each major section, check 1440px and 390px
4. **Screenshot verification:** Before marking complete

