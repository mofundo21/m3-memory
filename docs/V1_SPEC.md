# M3 Memory Archive — V1 Product Specification

## Purpose

V1 must make one complete path trustworthy and usable:

> A person opens a QR link, tells how they met MOFUNDO, uploads supporting material, grants explicit permissions, submits the memory, and MOFUNDO privately reviews it.

## Public submission flow

### 1. Welcome

- Explain what the archive is and why the memory matters.
- State clearly that submissions remain private until reviewed.
- Allow the contributor to begin without creating an account.

### 2. About the contributor

| Field | Required | Notes |
| --- | --- | --- |
| Display name | Yes | May be a real name, nickname, or chosen archive name. |
| Legal/full name | No | Private; used only for verification and follow-up. |
| Email | Yes | Private; used for receipt and follow-up. |
| Phone | No | Private. |
| Instagram | No | Username or URL. |
| Other social profile | No | Label and URL. |
| Preferred contact method | No | Email, phone, Instagram, or other. |

### 3. The first encounter

| Field | Required | Notes |
| --- | --- | --- |
| Date certainty | Yes | Exact, approximate, or unknown. |
| Encounter date | Conditional | Required only when certainty is exact. |
| Approximate date text | Conditional | Season, month/year, age, or contextual phrase. |
| Event or festival | No | Free text in V1; normalized during review. |
| Venue | No | Free text. |
| City | No | Free text. |
| Region/state | No | Free text. |
| Country | No | Defaults to United States in the UI, editable. |
| How we met | Yes | Primary narrative. |
| What we talked about | No | Narrative. |
| What MOFUNDO was wearing | No | Narrative. |
| What the contributor was wearing | No | Narrative. |
| First impression | No | Narrative. |
| Funny or meaningful details | No | Narrative. |
| Things exchanged | No | Gifts, art, objects, contact details, or promises. |
| What do you think I don't remember? | No | High-value memory-recovery prompt. |
| If this were a page in a book... | No | Desired meaning or wording for the page. |

### 4. Later encounters

- The contributor can add zero or more later encounters.
- Each later encounter supports date certainty, location/event context, and a narrative.
- V1 submits later encounters together with the first-meeting memory.

### 5. Evidence

- Supported categories: image, video, audio, and document.
- Each file can have a caption, approximate date, and names of people shown or heard.
- Initial policy: maximum 10 files per submission and 100 MB per file.
- Files are stored privately and accessed with short-lived signed URLs.

### 6. Permissions and consent

The contributor must make separate choices for:

- Archive storage: required to submit.
- Public website use: optional.
- Book/editorial consideration: optional.
- Displaying their chosen public name: optional.
- Displaying their social profile: optional.
- Follow-up contact: optional.

The contributor must confirm that:

- the account and contact details are theirs;
- the story is truthful to the best of their memory;
- they own the uploaded material or have permission to share it;
- other people may appear in the material and publication may require additional review;
- permission can be withdrawn by contacting the archive, subject to material already lawfully published.

Consent wording and policy version are stored with the submission. Publication consent never causes automatic publication.

### 7. Review and confirmation

- Show all entered information before final submission.
- Require explicit consent checkboxes.
- On success, display an opaque reference code.
- Do not expose sequential database IDs.
- V1 can show the reference code immediately; email receipts are a post-launch enhancement.

## Private Control Room

### Inbox

- Filter by status, date received, contributor, event, location, and flags.
- Default statuses: pending, in review, needs follow-up, approved, archived, rejected.
- No public access and no contributor access.

### Review screen

- View the contributor, encounters, narratives, permissions, and private media.
- Add private notes and tags.
- Mark book potential, sensitivity, verification needs, and follow-up needs.
- Link the submission to an existing person or keep the newly created person.
- Normalize event and location records without destroying the original submitted text.
- Preserve the original submission as an immutable snapshot; editorial changes live separately.

### Approval

Approval means the material can enter the curated archive. It does not mean public publication. Publishing is deliberately outside V1.

## Privacy and security requirements

- Anonymous visitors may create a draft submission only through controlled server endpoints.
- Browsers never receive the Supabase service-role key.
- Public clients cannot list or read people, submissions, encounters, notes, or files.
- Upload paths use unguessable submission and file IDs.
- Admin access requires Supabase Auth plus an explicit `admin_users` record.
- Row-level security is enabled on every exposed table.
- Storage is private and governed by equivalent ownership/admin policies.
- Contact information and internal notes never become public fields.
- Rate limiting, bot protection, malware scanning, and retention operations are required before a broad public campaign.

## Explicitly outside V1

- Public memory profiles or browsing
- Interactive map
- Full community CRM
- Relationship-duration pages
- AI transcription, tagging, or summarization
- Book-layout generation
- Contributor accounts and draft recovery across devices
- Automated publishing

These remain compatible with the schema but are not launch blockers.

## V1 acceptance criteria

1. A mobile visitor can complete and submit a memory without an account.
2. Exact, approximate, and unknown dates are stored without inventing precision.
3. Evidence uploads remain private.
4. Consent choices and wording version are auditable.
5. A non-admin cannot read submitted material.
6. An admin can review, annotate, change workflow status, and approve/archive a submission.
7. The original submitted narrative remains recoverable after editorial work.
8. No submission becomes public automatically.

