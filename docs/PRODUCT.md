# M3 Memory Product Definition

Owner: YERIEL, AKA MOFUNDO.

M3 Memory is a mobile-first website where people who have encountered Yeriel / MOFUNDO can submit memories for later review, preservation, and possible storytelling use.

V0.1 starts production empty. Do not import ChatGPT memories, previous personal databases, existing book chapters, old M3 lore, previous timelines, or prior stories.

## Public V0.1

- `/`: landing page.
- `/remember`: memory submission doorway.
- `/thanks`: submission confirmation.

Public visitors do not need accounts.

Potential submission fields:

- name
- optional social/contact
- approximate date
- event
- location
- how they met Yeriel/MOFUNDO
- memory
- before/after
- repeat encounters
- other people
- clothing
- conversation
- things exchanged
- artifacts
- photo/video/audio
- additional comments

Special questions:

- What do you think I don't remember about this day?
- If this moment were a page in a book, what would you want the page to say?

## Private V0.1

- `/admin`
- `/admin/submissions`
- `/admin/submissions/[id]`

Submission statuses:

- `UNREVIEWED`
- `IN_REVIEW`
- `REVIEWED`
- `APPROVED_FOR_STORY`
- `REJECTED`
- `ARCHIVED`

Yeriel can add separate review information without modifying the original submission.

