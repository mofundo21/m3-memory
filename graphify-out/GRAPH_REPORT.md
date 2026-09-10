# Graph Report - m3-memory  (2026-09-10)

## Corpus Check
- 20 files · ~10,456 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 49 nodes · 55 edges · 7 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `upsertReview()` - 7 edges
2. `createSubmission()` - 6 edges
3. `isAdminAuthenticated()` - 5 edges
4. `getDb()` - 5 edges
5. `digest()` - 4 edges
6. `login()` - 4 edges
7. `optionalText()` - 4 edges
8. `listSubmissions()` - 4 edges
9. `AdminPage()` - 3 edges
10. `AdminSubmissionsPage()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `submitMemory()` --calls--> `createSubmission()`  [INFERRED]
  src\app\remember\page.tsx → src\lib\db.ts
- `AdminPage()` --calls--> `isAdminAuthenticated()`  [INFERRED]
  src\app\admin\page.tsx → src\lib\auth.ts
- `loginAction()` --calls--> `login()`  [INFERRED]
  src\app\admin\login\page.tsx → src\lib\auth.ts
- `AdminSubmissionsPage()` --calls--> `isAdminAuthenticated()`  [INFERRED]
  src\app\admin\submissions\page.tsx → src\lib\auth.ts
- `saveReview()` --calls--> `requireAdmin()`  [INFERRED]
  src\app\admin\submissions\[id]\page.tsx → src\lib\auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.44
Nodes (9): createSubmission(), getDb(), getSubmission(), now(), optionalText(), rating(), requireStatus(), text() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.43
Nodes (6): digest(), expectedPassword(), isAdminAuthenticated(), login(), requireAdmin(), secret()

### Community 2 - "Community 2"
Cohesion: 0.4
Nodes (3): AdminPage(), listSubmissions(), AdminSubmissionsPage()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (1): loginAction()

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (1): ThanksPage()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (1): saveReview()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (1): submitMemory()

## Knowledge Gaps
- **Thin community `Community 3`** (3 nodes): `loginAction()`, `LoginPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (3 nodes): `page.tsx`, `page.tsx`, `ThanksPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `saveReview()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `submitMemory()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isAdminAuthenticated()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `listSubmissions()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `saveReview()` connect `Community 8` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `isAdminAuthenticated()` (e.g. with `AdminSubmissionsPage()` and `AdminPage()`) actually correct?**
  _`isAdminAuthenticated()` has 2 INFERRED edges - model-reasoned connections that need verification._