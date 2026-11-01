VERDICT: PASS WITH REQUIRED CHANGES

| # | Status | Evidence |
|---|---|---|
| 1 | PARTIAL | Design specifies 32 random bytes, 256-bit entropy, base64url, and exactly 43 characters, but does not name the required CSPRNG API ([design:52-54](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52)). |
| 2 | CLOSED | Only SHA-256 hex is stored; raw token is confined to the issuance cookie and explicitly excluded from storage, URLs, logs, and errors ([design:40-42](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:40), [design:58-59](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:58)). A 256-bit uniformly random token does not need a salt against guessing. |
| 3 | CLOSED | Expiry is inside the consuming DELETE predicate, independently of cookie `maxAge` ([design:67-69](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:67)). |
| 4 | CLOSED | Parsed cookie SID must equal the argument, and only parsed SID may reach either database predicate ([design:63-72](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:63)). A capability for A cannot consume or update B. |
| 5 | CLOSED | Save body is exactly `attribution_preference`, `preferred_attribution`, `book_note`, and `final_notes`; all source, review, verification, publication, reviewer, archive, and status fields are excluded ([design:21-30](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:21), [design:93-95](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:93)). |
| 6 | CLOSED | Consume-first `DELETE … RETURNING` gives the row to at most one request; replay and concurrent duplicate attempts get zero rows ([design:67-72](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:67)). |
| 7 | OPEN | Table RLS/revokes/no-policy design is sound, but the service-role helper boundary is incomplete and the claim that the key is used only by two helpers is false against existing code ([design:87-97](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:87), [supabase.ts:165-180](C:/Users/yerie/m3-memory/src/lib/supabase.ts:165), [supabase.ts:300-309](C:/Users/yerie/m3-memory/src/lib/supabase.ts:300)). |
| 8 | CLOSED | Design explicitly forbids changes to `submissions` grants or policies ([design:9](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:9)); current default-deny remains at [schema.sql:132-186](C:/Users/yerie/m3-memory/supabase/schema.sql:132). |
| 9 | CLOSED | Consumption revokes immediately; expiry makes consumption impossible; review status prevents saving but does not delete an unused capability ([design:68-72](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:68), [design:124-128](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:124)). The residual inert row is acceptable until expiry. |
| 10 | CLOSED | All listed failures use one fixed public message, with only categorized sanitized server logging ([design:75-77](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:75)); this explicitly replaces the current leak at [actions.ts:93-95](C:/Users/yerie/m3-memory/src/app/remember/actions.ts:93). |
| 11 | PARTIAL | `httpOnly` prevents client JavaScript from testing cookie existence, and public text is uniform, but missing/invalid, consumed/expired, and reviewed cases execute different numbers of database calls and may be timing-distinguishable ([design:63-77](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:63)). |
| 12 | CLOSED | Only the four preference columns appear in the update; `original_json`, `memory_preview`, and original memory fields cannot change ([design:70-72](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:70)). This preserves the historical-source boundary. |
| 13 | PARTIAL | Cookie is issued only after submission persistence, with compensating deletion and mandatory cleanup described, but the cleanup mechanism and verification are not concretely specified ([design:52-58](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52), [design:118](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:118)). Current Supabase creation can orphan a person between its two requests ([supabase.ts:165-199](C:/Users/yerie/m3-memory/src/lib/supabase.ts:165)). |

## Findings

1. **High — Capability issuance and compensation lack a defined service-role helper boundary.**  
   [design:52-57](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52), [design:87-97](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:87)

   The design requires inserting and compensatingly deleting capability rows, but names only `consumeContributorCapability` and `saveContributorPreferences`. Neither performs issuance or creation-failure cleanup. Moreover, “service-role key used in two narrow functions” cannot be literally true because existing submission creation and media upload already use it at [supabase.ts:165-180](C:/Users/yerie/m3-memory/src/lib/supabase.ts:165) and [supabase.ts:300-309](C:/Users/yerie/m3-memory/src/lib/supabase.ts:300).

   **Exact change required:** define narrow server-only issuance and compensation functions, their parameters, row-count checks, and permitted tables. Replace the global “only two functions” claim with the accurate invariant: capability consumption and preference saving occur only through the two named write helpers, while issuance/cleanup use separately named narrow helpers and existing unrelated service-role uses remain unchanged. Require `import "server-only"` in the module containing these helpers.

2. **Medium — Cryptographic randomness source is underspecified.**  
   [design:52-54](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:52)

   “32-byte random token” establishes size but not the randomness source.

   **Exact change required:** specify `randomBytes(32)` from `node:crypto`, or an equivalent operating-system-backed CSPRNG, followed by unpadded base64url encoding. Explicitly prohibit `Math.random`, UUID concatenation, timestamps, or application PRNGs.

3. **Medium — Required orphan cleanup is not implementation-ready.**  
   [design:57](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:57), [design:118](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:118)

   The design mandates periodic cleanup before launch but does not define its execution boundary, schedule, retention condition, row-count observability, or tests. Expiry prevents use but does not delete rows. Orphan `persons` contain contributor PII.

   **Exact change required:** identify the concrete scheduled server job/migration mechanism; define exact guarded DELETE statements for expired capabilities and persons with no submission; specify cadence, sanitized result logging, failure alerting, and tests proving that referenced persons and unexpired capabilities are preserved.

4. **Low — Uniform messages do not eliminate timing/status oracles.**  
   [design:63-77](C:/Users/yerie/m3-memory/docs/MUSEUM_CONTRIBUTOR_CAPABILITY_DESIGN.md:63)

   Missing/malformed cookies fail without database access; expired or consumed capabilities perform one request; a valid capability for a reviewed submission performs DELETE plus PATCH. Timing can therefore reveal coarse state to someone already possessing or controlling a capability. The probe consumes any valid capability, limiting practical exploitation.

   **Exact change required:** document this as an accepted, bounded side channel. Do not claim indistinguishable failure behavior beyond identical public content. Constant-time padding is not required unless a stronger non-enumeration guarantee is intended.

## Verified correct

- All required changes from `codex-review-v3.md` are now present in the design text.
- The separate table closes wildcard-query exposure; `submissions?select=*` cannot include another table.
- RLS enabled, no policies, and revoked grants deny `anon` and `authenticated`.
- SID binding, atomic consumption, expiry enforcement, and concurrent replay prevention are sound.
- Review status blocks saving even though it does not proactively delete the capability.
- The four-column allowlist cannot modify submitted-memory or administrative state.
- Generic public errors replace the current internal-message interpolation.
- Cookie issuance occurs only after successful submission persistence and before media processing.
- Unsalted SHA-256 is appropriate because the input is a uniformly random 256-bit bearer token.