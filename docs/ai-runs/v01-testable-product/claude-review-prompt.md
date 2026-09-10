Role: claude-reviewer
Project: M3 Memory V0.1 at C:\Users\yerie\m3-memory

Review only the current uncommitted changes in this standalone repository. Do not inspect or use ecosystem-hub, M3-HUB-MVP1, m3-hub-mvp, old M3 Hub/world/game repos, or unrelated projects.

Focus on Tier 3 concerns introduced or affected in this pass:
- Supabase candidate schema in supabase/schema.sql
- RLS/default grants posture
- contributor original immutability
- public inability to list/read submissions
- admin review writes separate from source submissions
- repeatable smoke test coverage for those invariants

Do not review styling preference. Return actionable findings with severity, or say no blocking findings.
