# Graph Report - m3-memory  (2026-09-10)

## Corpus Check
- 26 files · ~19,813 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 91 nodes · 153 edges · 8 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `getAdminAuthMode()` - 9 edges
2. `request()` - 9 edges
3. `login()` - 8 edges
4. `getSupabaseConfig()` - 8 edges
5. `headers()` - 8 edges
6. `isAdminAuthenticated()` - 7 edges
7. `createSubmission()` - 7 edges
8. `listSubmissions()` - 7 edges
9. `upsertReview()` - 7 edges
10. `requireAdmin()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `isAdminAuthenticated()`  [INFERRED]
  src\app\admin\page.tsx → src\lib\auth.ts
- `AdminPage()` --calls--> `listSubmissions()`  [INFERRED]
  src\app\admin\page.tsx → src\lib\db.ts
- `AdminSubmissionsPage()` --calls--> `listSubmissions()`  [INFERRED]
  src\app\admin\submissions\page.tsx → src\lib\db.ts
- `saveReview()` --calls--> `upsertReview()`  [INFERRED]
  src\app\admin\submissions\[id]\page.tsx → src\lib\db.ts
- `submitMemory()` --calls--> `createSubmission()`  [INFERRED]
  src\app\remember\page.tsx → src\lib\db.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.23
Nodes (16): createSubmission(), getDb(), getSubmission(), listSubmissions(), mapSupabaseDetail(), normalizeReview(), normalizeSubmission(), now() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (15): saveReview(), digest(), expectedPassword(), getAdminToken(), isAdminAuthenticated(), isLocalAdminCookie(), login(), requireAdmin() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.46
Nodes (12): createSupabaseSubmission(), getSupabaseConfig(), getSupabaseSubmission(), getSupabaseUser(), headers(), isSupabaseAdmin(), listSupabaseSubmissions(), readJson() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.47
Nodes (4): actionFields(), decode(), form(), postForm()

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (2): logout(), logoutAction()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (2): ext(), walk()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (1): ThanksPage()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): AdminPage()

## Knowledge Gaps
- **Thin community `Community 5`** (4 nodes): `logout()`, `page.tsx`, `logoutAction()`, `place()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (3 nodes): `ext()`, `lint.mjs`, `walk()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (3 nodes): `page.tsx`, `page.tsx`, `ThanksPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `AdminPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `listSubmissions()` connect `Community 0` to `Community 1`, `Community 2`, `Community 11`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `getAdminAuthMode()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `AdminSubmissionsPage()` connect `Community 1` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `getAdminAuthMode()` (e.g. with `loginAction()` and `LoginPage()`) actually correct?**
  _`getAdminAuthMode()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `login()` (e.g. with `loginAction()` and `getAdminAuthMode()`) actually correct?**
  _`login()` has 5 INFERRED edges - model-reasoned connections that need verification._