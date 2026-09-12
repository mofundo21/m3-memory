# Task 10: Type Check, Lint, and Build

## Overview
Run TypeScript type check, linter, and production build to verify no regressions introduced by Tasks 1-8.

## No Files Modified
Build/validation task only.

## Steps

### 10.1: Run TypeScript type check

```bash
npm run typecheck
```

Expected: "No errors"

### 10.2: Run linter

```bash
npm run lint
```

Expected: "lint ok: no forbidden old-project references..."

### 10.3: Build for production

```bash
npm run build
```

Expected: Build succeeds, no warnings

### 10.4: Commit if all pass

If all three checks pass:
```bash
git add .
git commit -m "ci: all checks pass (typecheck, lint, build)"
```

## Report

Write to: `.superpowers/sdd/m3-memory-ui-redesign/task-10-report.md`

Include:
- Output from typecheck command
- Output from lint command
- Output from build command
- Status: PASS or FAIL
- If any fail, root cause and what to fix
