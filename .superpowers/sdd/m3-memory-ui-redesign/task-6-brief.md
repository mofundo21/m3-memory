# Task 6: Integrate Scroll Experience with Design Tokens

## Overview
Update ScrollMemory.tsx to use CSS variables instead of Tailwind classes, and create separate desktop/mobile compositions (alternating left-right on desktop, single column on mobile).

## Files to Modify
- `src/components/ScrollMemory.tsx` (swap Tailwind to CSS variables)
- `src/app/globals.css` (add scroll-memory-section styles)

## Global Constraints
- NO component interface changes
- Use existing CSS variables (--muted, --surface-2, --text, etc.)
- Desktop: alternating left-right text-image composition
- Mobile: single column

## Steps

### 6.1: Update ScrollMemory.tsx wrapper

Wrap content with:
```tsx
<section 
  className="scroll-memory-section"
  style={{
    marginBottom: '80px'
  }}
>
  {/* Desktop: alternating left-right layout */}
  <div className="scroll-memory-desktop">
    {/* Content here */}
  </div>

  {/* Mobile: single column */}
  <div className="scroll-memory-mobile">
    {/* Content here */}
  </div>
</section>
```

### 6.2: Replace Tailwind classes with CSS variables

Find all Tailwind color classes and replace:
- `text-gray-300` → `color: var(--muted)`
- `bg-purple-900` → `background: var(--surface-2)`
- `text-white` → `color: var(--text)`
- etc.

### 6.3: Add styles to globals.css

```css
.scroll-memory-section {
  margin-bottom: 80px;
}

.scroll-memory-desktop {
  display: grid;
  gap: 48px;
}

.scroll-memory-mobile {
  display: none;
}

@media (max-width: 768px) {
  .scroll-memory-desktop {
    display: none;
  }

  .scroll-memory-mobile {
    display: grid;
    gap: 32px;
  }
}
```

### 6.4: Commit

```bash
git add src/components/ScrollMemory.tsx src/app/globals.css
git commit -m "feat: integrate scroll experience with design tokens

- Swap Tailwind classes to CSS variables
- Desktop alternating left-right text-image
- Mobile single column layout"
```

## Testing

1. `npm run typecheck` — pass
2. `npm run lint` — pass
3. Visual: Scroll section uses design palette, responsive layouts work

## Report

Write to: `.superpowers/sdd/m3-memory-ui-redesign/task-6-report.md`
