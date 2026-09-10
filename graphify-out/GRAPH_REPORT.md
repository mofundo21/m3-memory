# Graph Report - m3-memory  (2026-09-10)

## Corpus Check
- 24 files · ~14,020 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 62 nodes · 69 edges · 8 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 11|Community 11]]

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
- `AdminPage()` --calls--> `listSubmissions()`  [INFERRED]
  src\app\admin\page.tsx → src\lib\db.ts
- `loginAction()` --calls--> `login()`  [INFERRED]
  src\app\admin\login\page.tsx → src\lib\auth.ts
- `AdminSubmissionsPage()` --calls--> `isAdminAuthenticated()`  [INFERRED]
  src\app\admin\submissions\page.tsx → src\lib\auth.ts
- `AdminSubmissionsPage()` --calls--> `listSubmissions()`  [INFERRED]
  src\app\admin\submissions\page.tsx → src\lib\db.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.27
Nodes (8): AdminPage(), saveReview(), digest(), expectedPassword(), isAdminAuthenticated(), login(), requireAdmin(), secret()

### Community 1 - "Community 1"
Cohesion: 0.4
Nodes (10): createSubmission(), getDb(), getSubmission(), listSubmissions(), now(), optionalText(), rating(), requireStatus() (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.47
Nodes (4): actionFields(), decode(), form(), postForm()

### Community 3 - "Community 3"
Cohesion: 0.4
Nodes (3): logout(), AdminSubmissionsPage(), logoutAction()

### Community 4 - "Community 4"
Cohesion: 1.0
Nodes (2): ext(), walk()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (1): ThanksPage()

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (1): loginAction()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): submitMemory()

## Knowledge Gaps
- **Thin community `Community 4`** (3 nodes): `ext()`, `lint.mjs`, `walk()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (3 nodes): `page.tsx`, `page.tsx`, `ThanksPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (3 nodes): `loginAction()`, `LoginPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `submitMemory()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `listSubmissions()` connect `Community 1` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `isAdminAuthenticated()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `saveReview()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `isAdminAuthenticated()` (e.g. with `AdminSubmissionsPage()` and `AdminPage()`) actually correct?**
  _`isAdminAuthenticated()` has 2 INFERRED edges - model-reasoned connections that need verification._