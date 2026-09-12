# Task 11: Deploy to Vercel Preview

## Overview
Deploy the updated code to Vercel preview environment to verify all visual changes work on live deployment.

## No Files Modified
Deployment task only.

## Steps

### 11.1: Deploy to Vercel preview

```bash
vercel --yes
```

Expected: Preview URL printed, e.g., `https://m3-memory-<hash>.vercel.app`

### 11.2: Verify preview on desktop

Open preview URL at 1440px width. Verify all visual changes from Tasks 1-9 match local testing:
- ✓ Container expanded to 1200px
- ✓ Hero split layout (left text, right portrait)
- ✓ Headline sizing correct
- ✓ Navigation minimal (no Admin link)
- ✓ Gallery overlapping cards
- ✓ Scroll section integrated
- ✓ Forms centered at 800px

### 11.3: Verify preview on mobile

Open preview URL at 390px width. Verify:
- ✓ Hero stacks vertically
- ✓ Portrait full-width
- ✓ Gallery staggered
- ✓ Navigation responsive
- ✓ Touch targets > 44px

### 11.4: Commit with preview URL

```bash
git add DESKTOP_HERO_1440.png MOBILE_HERO_390.png
git commit -m "docs: add visual verification screenshots

Preview: https://m3-memory-<hash>.vercel.app"
```

## Report

Write to: `.superpowers/sdd/m3-memory-ui-redesign/task-11-report.md`

Include:
- Vercel preview URL
- Verification results (desktop/mobile both ✓)
- Any issues found on preview
- Confirmation that production unchanged
