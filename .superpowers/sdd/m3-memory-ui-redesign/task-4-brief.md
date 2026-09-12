# Task 4: Fix Public Navigation (Remove/Hide Admin Link)

## Overview
Remove the Admin link from the public header navigation. Admin should only be accessible via direct `/admin` route, not from the public homepage nav.

## Files to Modify
- `src/app/page.tsx` (header nav, lines 8-14)
- `src/app/globals.css` (update .home-nav responsive styles, lines 91-114)

## Global Constraints (from plan)
- NO backend changes
- NO route changes (Admin route still exists)
- Keep navigation minimal

## Interfaces

### Input (from Task 3)
- Page.tsx updated to import HomeHero
- Navigation still uses .home-nav class

### Output
- Public header shows: Logo | About link only
- Admin link removed from public visibility
- Responsive nav spacing preserved

## Steps

### 4.1: Update home-nav in page.tsx

Current (lines 8-14):
```tsx
<header className="home-nav">
  <Link className="wordmark" href="/">M3 Memory</Link>
  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
    <a href="#about" className="quiet-link">About</a>
    <Link className="quiet-link" href="/admin">Admin</Link>
  </div>
</header>
```

Replace with:
```tsx
<header className="home-nav">
  <Link className="wordmark" href="/">M3 Memory</Link>
  <a href="#about" className="quiet-link">About</a>
</header>
```

### 4.2: Update globals.css .home-nav

Modify lines 91-114 in `src/app/globals.css`:

Replace:
```css
.home-nav,
.memory-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 48px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}
```

With:
```css
.home-nav,
.memory-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 48px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .home-nav {
    flex-direction: column;
    justify-content: flex-start;
    gap: 12px;
    margin-bottom: 32px;
  }

  .wordmark {
    align-self: flex-start;
  }
}
```

### 4.3: Commit

```bash
cd /c/Users/yerie/m3-memory
git add src/app/page.tsx src/app/globals.css
git commit -m "fix: remove Admin link from public header

- Public header shows Logo | About only
- Admin accessible only via direct /admin route
- Responsive nav spacing preserved"
```

## Testing

1. `npm run typecheck` — should pass
2. `npm run lint` — should pass
3. Visual check:
   - Homepage header: Logo on left, "About" on right, no Admin link
   - Mobile (390px): Logo and About stack vertically
   - Direct `/admin` route still works

## Report

Write your implementation report to: `.superpowers/sdd/m3-memory-ui-redesign/task-4-report.md`

Include:
- Exact changes made with line numbers
- Test commands and output
- Self-review notes
- Commit SHA(s)
