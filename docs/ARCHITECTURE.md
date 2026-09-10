# Architecture

M3 Memory is currently a mobile-first web application scaffolded as a Next.js, React, and TypeScript project.

The early implementation may use local development storage. Production architecture must be selected deliberately before launch, with Supabase, PostgreSQL, Supabase Auth, and Supabase Storage as likely candidates to evaluate.

## Core Domains

- Public memory submission
- Immutable source submissions
- Media upload intake
- Private admin review
- Separate review records
- Evidence checking
- Story draft generation from reviewed material

## Security Requirements

Anonymous users can submit.

Anonymous users cannot:

- enumerate submissions
- retrieve other submissions
- retrieve media belonging to other submissions unless explicitly public
- see admin metadata
- see Yeriel review data
- modify source submissions

Admin access must be protected. Production storage should use database-level authorization where supported. Never expose service-role credentials in browser code.

Validate uploads, request sizes, file types, and all trust-boundary inputs.

## Application Code

Application code currently lives under `src/`.

Project AI infrastructure lives under:

- `docs/`
- `skills/`
- `scripts/`
- `config/`
- `.agents/`
- `.claude/`

