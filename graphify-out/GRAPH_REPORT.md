# Graph Report - C:\Users\yerie\m3-memory  (2026-09-10)

## Corpus Check
- Corpus is ~4,974 words - fits in a single context window. You may not need a graph.

## Summary
- 39 nodes · 37 edges · 6 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_digest(), isAdminAuthenticated(), login()|digest(), isAdminAuthenticated(), login()]]
- [[_COMMUNITY_createSubmission(), getDb(), getSubmission()|createSubmission(), getDb(), getSubmission()]]
- [[_COMMUNITY_loginAction(), LoginPage(), page.tsx|loginAction(), LoginPage(), page.tsx]]
- [[_COMMUNITY_AdminPage(), page.tsx|AdminPage(), page.tsx]]
- [[_COMMUNITY_saveReview(), page.tsx|saveReview(), page.tsx]]
- [[_COMMUNITY_page.tsx, submitMemory()|page.tsx, submitMemory()]]

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 5 edges
2. `digest()` - 4 edges
3. `isAdminAuthenticated()` - 4 edges
4. `createSubmission()` - 4 edges
5. `upsertReview()` - 4 edges
6. `AdminPage()` - 3 edges
7. `login()` - 3 edges
8. `now()` - 3 edges
9. `listSubmissions()` - 3 edges
10. `loginAction()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `isAdminAuthenticated()`  [INFERRED]
  src\app\admin\page.tsx → src\lib\auth.ts
- `AdminPage()` --calls--> `listSubmissions()`  [INFERRED]
  src\app\admin\page.tsx → src\lib\db.ts
- `loginAction()` --calls--> `login()`  [INFERRED]
  src\app\admin\login\page.tsx → src\lib\auth.ts
- `saveReview()` --calls--> `upsertReview()`  [INFERRED]
  src\app\admin\submissions\[id]\page.tsx → src\lib\db.ts
- `submitMemory()` --calls--> `createSubmission()`  [INFERRED]
  src\app\submit\page.tsx → src\lib\db.ts

## Communities

### Community 0 - "digest(), isAdminAuthenticated(), login()"
Cohesion: 0.48
Nodes (5): digest(), isAdminAuthenticated(), login(), requireAdmin(), secret()

### Community 1 - "createSubmission(), getDb(), getSubmission()"
Cohesion: 0.57
Nodes (6): createSubmission(), getDb(), getSubmission(), listSubmissions(), now(), upsertReview()

### Community 2 - "loginAction(), LoginPage(), page.tsx"
Cohesion: 0.67
Nodes (1): loginAction()

### Community 6 - "AdminPage(), page.tsx"
Cohesion: 1.0
Nodes (1): AdminPage()

### Community 7 - "saveReview(), page.tsx"
Cohesion: 1.0
Nodes (1): saveReview()

### Community 9 - "page.tsx, submitMemory()"
Cohesion: 1.0
Nodes (1): submitMemory()

## Knowledge Gaps
- **Thin community `loginAction(), LoginPage(), page.tsx`** (3 nodes): `loginAction()`, `LoginPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AdminPage(), page.tsx`** (2 nodes): `AdminPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `saveReview(), page.tsx`** (2 nodes): `saveReview()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx, submitMemory()`** (2 nodes): `page.tsx`, `submitMemory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminPage()` connect `AdminPage(), page.tsx` to `digest(), isAdminAuthenticated(), login()`, `createSubmission(), getDb(), getSubmission()`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Why does `listSubmissions()` connect `createSubmission(), getDb(), getSubmission()` to `AdminPage(), page.tsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `isAdminAuthenticated()` connect `digest(), isAdminAuthenticated(), login()` to `AdminPage(), page.tsx`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._