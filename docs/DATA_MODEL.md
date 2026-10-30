# V1 Data Model

## Relationship map

```text
Person 1---* Submission 1---* Encounter *---0..1 Event
   |              |             |
   |              |             *---0..1 Location
   |              |
   |              *---* MediaAsset
   |              *---* ConsentGrant
   |              *---* ReviewNote
   |              *---* SubmissionTag *---1 Tag
   |
   *---* EncounterParticipant *---1 Encounter
```

## Design decisions

- `people` represents a human once, while a person may contribute multiple submissions over time.
- `submissions` is the moderation envelope and preserves the received snapshot.
- `encounters` represents first and later meetings independently of the submission that introduced them.
- Date precision is explicit. Approximate memories are never coerced into false exact dates.
- Raw location/event text is retained on the encounter even after an administrator links normalized records.
- Consent is append-only and policy-versioned so permission history can be audited.
- Media metadata is stored in Postgres; bytes remain in a private storage bucket.
- Internal review notes are separate from contributor-authored text.
- Publication is modeled as a future concern; approval alone cannot publish content.

## Status lifecycle

```text
draft -> submitted -> in_review -> approved
                    |          -> needs_follow_up
                    |          -> archived
                    `----------> rejected
```

Only `draft` and `submitted` are set by the submission service. Administrative transitions require an authenticated administrator.

