# Task 8: Create Desktop-Specific Admin Sidebar Layout

## Overview
Add responsive admin layout to support three-column design at desktop (sidebar | content | optional panel) while collapsing to single column on mobile.

## Files to Modify
- `src/app/globals.css` (.admin-layout responsive rules)

## Global Constraints
- NO admin functionality changes
- Sidebar remains 240px wide at desktop
- Mobile: full-width single column

## Steps

### 8.1: Update .admin-layout in globals.css

Find existing `.admin-layout` (around line 644):

Current:
```css
.admin-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}
```

Add after:
```css
@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

### 8.2: Commit

```bash
git add src/app/globals.css
git commit -m "feat: responsive admin layout

- Desktop: 240px sidebar + content
- Mobile: single column"
```

## Report

Write to: `.superpowers/sdd/m3-memory-ui-redesign/task-8-report.md`
