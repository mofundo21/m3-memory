# Task 1: Expand Container Widths and Create Desktop Breakpoints

## Overview
Expand the M3 Memory homepage from a constrained 760px max-width to a full widescreen composition. Fix headline sizing for better editorial control on desktop.

## Files to Modify
- `src/app/globals.css` (lines 68-81, 91-114)

## Global Constraints (from plan)
- NO backend changes — Supabase, RLS, auth, database schema, media storage unchanged
- NO new dependencies
- Breakpoints: Desktop (1200px+), tablet (768-1199px), mobile (< 768px)
- Use existing CSS variables from globals.css (--bg, --text, --purple, etc.)

## Steps

### 1.1: Read current globals.css container rules

Current (lines 68-81):
```css
.home-shell,
.memory-shell {
  width: min(760px, 100%);
}
```

### 1.2: Update `.home-shell` to expand to 1200px at desktop

Replace lines 78-81 with:
```css
.home-shell {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.memory-shell {
  width: min(760px, 100%);
}

/* Responsive adjustments */
@media (max-width: 1199px) {
  .home-shell {
    width: min(920px, 100%);
  }
}

@media (max-width: 768px) {
  .home-shell {
    width: min(100%, 100%);
    padding: 16px 12px 40px;
  }
}
```

### 1.3: Update `.home-nav` for responsive spacing

Add after line 100:
```css
@media (max-width: 768px) {
  .home-nav {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }

  .wordmark {
    text-align: left;
  }
}
```

### 1.4: Fix headline sizing for editorial control

Current (line 146):
```css
font-size: clamp(44px, 8vw, 72px);
```

Replace with:
```css
font-size: clamp(40px, 4.5vw, 68px);
```

### 1.5: Commit

```bash
cd /c/Users/yerie/m3-memory
git add src/app/globals.css
git commit -m "feat: expand desktop container to 1200px and fix headline sizing

- home-shell max-width 1200px at desktop, 920px tablet, mobile full-width
- headline clamp(40px, 4.5vw, 68px) for editorial control
- responsive nav spacing for mobile"
```

## Testing

After committing, verify:
1. `npm run typecheck` passes with no errors
2. `npm run lint` passes
3. Visual check at browser: 1440px width shows wider layout, 768px shows mobile stacked
4. No horizontal scroll at any breakpoint

## Report

Write your implementation report to: `.superpowers/sdd/m3-memory-ui-redesign/task-1-report.md`

Include:
- Exact changes made (with line numbers)
- Any deviations from the brief with justification
- Test commands run and output
- Self-review notes
- Commit SHA(s)
