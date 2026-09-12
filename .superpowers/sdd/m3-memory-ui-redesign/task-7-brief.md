# Task 7: Optimize Form Layouts for Desktop

## Overview
Update .memory-shell form container to expand to 800px at desktop while staying constrained. Add optional sidebar layout class for future context display.

## Files to Modify
- `src/app/globals.css` (.memory-shell responsive rules)

## Global Constraints
- Forms max 800px at desktop (centered)
- Full-width on mobile
- NO form field changes

## Steps

### 7.1: Add responsive .memory-shell rules to globals.css

After current .memory-shell definition, add:

```css
@media (min-width: 769px) {
  .memory-shell {
    width: min(800px, 100%);
  }
}

@media (max-width: 768px) {
  .memory-shell {
    width: 100%;
    padding: 16px 12px 40px;
  }
}
```

### 7.2: Add optional sidebar layout class

Add new class (for future use, not required by any form yet):

```css
.memory-form-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 1200px) {
  .memory-form-layout {
    grid-template-columns: 260px 1fr;
  }

  .memory-form-sidebar {
    position: sticky;
    top: 24px;
    font-size: 13px;
    color: var(--muted);
  }
}
```

### 7.3: Commit

```bash
git add src/app/globals.css
git commit -m "feat: optimize form layouts for desktop

- Forms max 800px centered at desktop
- Optional sidebar layout for context (not used yet)
- Full-width mobile forms"
```

## Report

Write to: `.superpowers/sdd/m3-memory-ui-redesign/task-7-report.md`
