# Task 9: Screenshots and Visual Verification

## Overview
Verify visual changes from Tasks 1-8 by taking browser screenshots at desktop (1440px), tablet (1024px), and mobile (390px) breakpoints. Compare against plan specifications.

## No Files Modified
This is a verification task only.

## Steps

### 9.1: Start dev server

```bash
cd /c/Users/yerie/m3-memory
npm run dev
```

Expected: Server running on http://localhost:3000

### 9.2-9.4: Viewport screenshots

Take screenshots at three breakpoints:

**Desktop (1440×900):** http://localhost:3000
- ✓ Hero text on LEFT side (~45-50% width)
- ✓ Hero portrait on RIGHT side (~50-55% width)
- ✓ NO overlap between text and image
- ✓ Headline fits comfortably (no wrapping across to portrait)
- ✓ "M3 MEMORY" kicker visible above headline
- ✓ "Share a Memory" button visible and purple
- ✓ Gallery cards overlapping with varied z-depths below

**Tablet (1024×768):**
- ✓ Layout still side-by-side
- ✓ Gap reduced (48px)
- ✓ No horizontal scrolling

**Mobile (390×844):**
- ✓ Hero stacks vertically (text on top, portrait below)
- ✓ Portrait is full-width
- ✓ Gallery cards stack vertically with stagger
- ✓ Navigation is compact
- ✓ Touch target sizes > 44px

### 9.5-9.6: Save screenshots

Save as:
- `DESKTOP_HERO_1440.png`
- `MOBILE_HERO_390.png`

### 9.7: no-slop-ui visual inspection

Verify against no-slop rules:
- ✓ No floating glassmorphism
- ✓ No gradient backgrounds as decoration (only dark photo gradients)
- ✓ No oversized rounded corners
- ✓ No eyebrow labels (kicker is styled correctly)
- ✓ No dramatic box shadows (max 24px blur)
- ✓ Spacing on 4/8/12/16/24/32px scale
- ✓ Borders 1px solid, subtle
- ✓ Typography clear hierarchy

## Report

Write to: `.superpowers/sdd/m3-memory-ui-redesign/task-9-report.md`

Include:
- Screenshot file paths
- Verification checklist results (all items ✓ or notes on deviations)
- Any visual discrepancies found
- Ready for Task 10
