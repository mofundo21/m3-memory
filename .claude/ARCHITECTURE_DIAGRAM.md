# M3 Memory V0.3 — Architecture Diagram

## User Journey & Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         M3 MEMORY FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: REMEMBER (PAGE 1)
════════════════════════════════════════════════════════════════════════
Route: /remember
Component: ScrollMemory (static, no client state)
Content: 8 scenes + final CTA
Render: Server-side static (no dynamic fetching)
Storage: None
Action: "LET'S REMEMBER →" → /remember/write
────────────────────────────────────────────────────────────────────────
┌─ NO DATA PERSISTED YET ─────────────────────────────────────────────┐


STEP 2: YOUR MEMORY (PAGE 2)
════════════════════════════════════════════════════════════════════════
Route: /remember/write
Component: WriteMemoryPage ('use client')
Wizard State: useMemoryWizard() hook
  ├─ memoryText (required)
  ├─ whereWe, aroundWhen, whoElse, whatMadeStick, dontRemember (optional)
  └─ sessionStorage mirror (survives refresh, lost on tab close)

Storage Mechanism:
  • React state (in-memory)
  • sessionStorage JSON (tab-local persistence)
  • No server writes

Validation: Memory text must be non-empty
Action: "KEEP GOING →" → /remember/details
────────────────────────────────────────────────────────────────────────
┌─ STILL NO DATA PERSISTED TO SERVER ─────────────────────────────────┐


STEP 3: ADD TO THE MEMORY (PAGE 3)
════════════════════════════════════════════════════════════════════════
Route: /remember/details
Component: AddToMemoryPage ('use client')
Wizard State: Read from useMemoryWizard + add:
  ├─ encounterDate, isApproximateDate (optional)
  ├─ locationName, eventName (optional)
  ├─ mediaFiles[] (client files, not persisted)
  ├─ mediaLink, mediaConsent (optional)
  └─ sessionStorage mirror (page 2 + page 3 fields combined)

Storage Mechanism:
  • React state (in-memory)
  • sessionStorage JSON
  • Media files in memory only (cleared on refresh)

Action: "ONE LAST THING →" → submitMemoryAction()
  ↓
  ATOMIC WRITE HAPPENS HERE:
  ├─ createSubmission() → writes original_json (all page 2+3 fields)
  ├─ validateMediaUpload()
  ├─ uploadSupabaseMedia() × N files
  ├─ insertMediaRows() → links files to submission
  └─ Returns submissionId
  ↓
  redirect("/remember/final?submissionId=<id>")
────────────────────────────────────────────────────────────────────────
┌─ DATA NOW PERSISTED IN SUPABASE ────────────────────────────────────┐
│ submissions row created with:                                        │
│  • original_json (immutable forever)                                 │
│  • preview, date, location columns (denormalized)                    │
│  • status = "UNREVIEWED"                                             │
│  • media[] rows linked to submissionId                               │
│  • attribution/book-note/final-notes columns = NULL                  │
└─────────────────────────────────────────────────────────────────────┘


STEP 4: LEAVE YOUR MARK (PAGE 4)
════════════════════════════════════════════════════════════════════════
Route: /remember/final?submissionId=<id>
Component: FinalMemoryContent ('use client')
Query Param: submissionId (required, comes from page 3 redirect)
Wizard State: Read from useMemoryWizard (for display only)
Form Fields:
  ├─ submitterName, contact (optional, defaults "Anonymous")
  ├─ bookNote (optional)
  ├─ attributionPreference (enum: anonymous/first/full/nickname/artist/initials/custom)
  ├─ preferredAttribution (if custom)
  └─ finalNotes (optional)

Summary Block (read-only):
  ├─ Memory written ✓
  ├─ Preferred name: <from form or Anonymous>
  └─ Photo count: <from wizard state>

Storage Mechanism:
  • Form state only (not saved to server until submit)
  • No sessionStorage for these fields (one-time final form)

Validation: None (all fields optional)
Action: "SEND MY MEMORY →" → updatePreferencesAction(submissionId, formData)
  ↓
  PATCH WRITE (IMMUTABILITY BOUNDARY):
  ├─ updateSubmissionPreferences() updates ONLY:
  │  ├─ attribution_preference
  │  ├─ preferred_attribution
  │  ├─ book_note
  │  └─ final_notes
  ├─ Does NOT touch original_json
  ├─ Does NOT touch media[]
  └─ Returns success/error
  ↓
  redirect("/thanks")
────────────────────────────────────────────────────────────────────────
┌─ PREFERENCES PERSISTED, SUBMISSION COMPLETE ────────────────────────┐
│ submissions row now has:                                             │
│  • attribution_preference = user choice                              │
│  • book_note / final_notes = user input                              │
│  • original_json unchanged (immutable)                               │
│  • media[] unchanged (immutable)                                     │
└─────────────────────────────────────────────────────────────────────┘


STEP 5: THANK YOU (PAGE 5)
════════════════════════════════════════════════════════════════════════
Route: /thanks
Component: ThanksPage (server component)
Query Params: None (no submissionId rendered)
Content: Thank you message, no contributor data displayed
Action: "Share Another →" → /remember (cycle restarts, wizard state cleared)
Action: "Home" → / (landing page)

Storage: Read-only view (no writes)
────────────────────────────────────────────────────────────────────────


════════════════════════════════════════════════════════════════════════
                          DATA LIFECYCLE
════════════════════════════════════════════════════════════════════════

BEFORE PAGE 3 SUBMIT:
  ┌─────────────────────────────────────┐
  │ Client-Side Wizard State            │
  ├─────────────────────────────────────┤
  │ React State (volatile)              │ ← Current editing
  │ + sessionStorage JSON (tab-local)   │ ← Survives refresh
  │ + Media files in memory             │ ← Clears on refresh
  │                                     │
  │ ✓ SAFE: No unfinished submissions   │
  │ ✓ SAFE: Immutability preserved      │
  │ ✗ RISK: Tab close = data loss       │ (accepted)
  └─────────────────────────────────────┘


AFTER PAGE 3 SUBMIT, BEFORE PAGE 4 SUBMIT:
  ┌─────────────────────────────────────┐
  │ Supabase: submissions row created   │
  ├─────────────────────────────────────┤
  │ original_json (IMMUTABLE)           │ ← Page 2+3 fields
  │ status: "UNREVIEWED"                │ ← Admin workflow
  │ media[] links (IMMUTABLE)           │ ← Uploaded files
  │                                     │
  │ + Temporary client state:           │
  │   - attributionPreference           │ ← Being edited
  │   - bookNote, finalNotes            │ ← Being edited
  │                                     │
  │ ✓ SAFE: Memory captured             │
  │ ✓ SAFE: Can abandon page 4 anytime  │ (submission stays)
  │ ✓ SAFE: Media immutable             │
  └─────────────────────────────────────┘


AFTER PAGE 4 SUBMIT:
  ┌─────────────────────────────────────┐
  │ Supabase: submissions row complete  │
  ├─────────────────────────────────────┤
  │ original_json (IMMUTABLE)           │ ← Contributor original
  │ status: "UNREVIEWED" → admin picks  │ ← Admin review
  │ media[] links (IMMUTABLE)           │ ← With consent flags
  │                                     │
  │ + Attribution data (mutable):       │
  │   - attribution_preference          │ ← How to credit
  │   - book_note                       │ ← Context for book
  │   - final_notes                     │ ← Extra thoughts
  │                                     │
  │ ✓ SAFE: Admin can review original   │
  │ ✓ SAFE: Can edit preferences later  │
  │ ✓ SAFE: Media never modified        │
  └─────────────────────────────────────┘
```

---

## Wizard State Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    USEITORYWIZARD HOOK                           │
└──────────────────────────────────────────────────────────────────┘

Lifecycle:
  Mount
    ↓ Check sessionStorage.m3_memory_wizard_draft
    ↓ Load persisted state if present (same tab, no expiry)
    ↓ Otherwise, use defaults
    ↓ setIsLoaded(true)

Every Change:
    ↓ updateField() or updateMultiple()
    ↓ setState() → React state update
    ↓ useEffect watches state changes
    ↓ Persist to sessionStorage (async safe)

State Shape:
{
  // Page 2
  memoryText: "",                    ← REQUIRED
  whereWe: "",                       ← optional prompt
  aroundWhen: "",                    ← optional prompt
  whoElse: "",                       ← optional prompt
  whatMadeStick: "",                 ← optional prompt
  dontRemember: "",                  ← optional prompt

  // Page 3
  encounterDate: "",                 ← optional
  isApproximateDate: false,          ← optional
  locationName: "",                  ← optional
  eventName: "",                     ← optional
  mediaLink: "",                     ← optional
  mediaConsent: false,               ← optional
  mediaFiles: File[],                ← in memory only (cleared on refresh)

  // Page 4 (displayed in form, not persisted in state)
  submitterName: "",                 ← optional
  contact: "",                       ← optional
  bookNote: "",                      ← optional
  attributionPreference: "anonymous",← defaults
  finalNotes: ""                     ← optional
}

Storage Destinations:
  • React state ────────────────► /remember/write (PAGE 2)
  • + Page 3 data ──────────────► /remember/details (PAGE 3)
  • Merge & submit ─────────────► FormData for submitMemoryAction
  • Submitter ID + redirect ────► /remember/final?submissionId=<id>

Cleanup:
  • Tab close → sessionStorage cleared
  • Redirect to /thanks → wizard cleared (no need for step 5)
  • "Share Another" from /thanks → new session, fresh wizard
```

---

## Component Tree

```
ROOT (app layout)
├── /
│   └── page.tsx (landing, static)
│
├── /remember (PAGE 1 - REMEMBER)
│   └── page.tsx
│       └── ScrollMemory
│           ├── 8 MemoryScene items
│           └── Final CTA
│
├── /remember/write (PAGE 2 - YOUR MEMORY)
│   └── page.tsx ('use client')
│       ├── useMemoryWizard() hook
│       ├── useState() for errors
│       └── Form
│           ├── textarea (memoryText, required)
│           ├── <details> (guided prompts, optional)
│           └── "KEEP GOING →" button
│
├── /remember/details (PAGE 3 - ADD TO THE MEMORY, NEW)
│   └── page.tsx ('use client')
│       ├── useMemoryWizard() hook
│       ├── useRef() for file input
│       ├── useState() for errors
│       └── Form
│           ├── input[date] (encounterDate)
│           ├── checkbox (isApproximateDate)
│           ├── input[text] (locationName, eventName)
│           ├── File picker (mediaFiles)
│           ├── input[url] (mediaLink)
│           ├── checkbox (mediaConsent)
│           └── "ONE LAST THING →" → submitMemoryAction()
│
├── /remember/final (PAGE 4 - LEAVE YOUR MARK)
│   └── page.tsx
│       └── FinalMemoryContent ('use client')
│           ├── useSearchParams() for submissionId
│           ├── useMemoryWizard() for display
│           ├── useState() for formData
│           └── Form
│               ├── input (submitterName, contact)
│               ├── textarea (bookNote)
│               ├── radio[] (attributionPreference)
│               ├── input (preferredAttribution, if custom)
│               ├── textarea (finalNotes)
│               ├── Panel (summary block, read-only)
│               └── "SEND MY MEMORY →" → updatePreferencesAction()
│
├── /thanks (PAGE 5 - THANK YOU)
│   └── page.tsx (server)
│       └── Static content + 2 links
│
├── /admin/...
│   └── [unchanged admin routes]
│
└── /api/...
    └── [unchanged API routes]
```

---

## Data Immutability Boundary

```
                    createSubmission()
                    ↓ (atomic write)
                    
    ┌──────────────────────────────────────────────┐
    │         original_json (IMMUTABLE)            │
    ├──────────────────────────────────────────────┤
    │ • memoryText                                 │
    │ • whereWe, aroundWhen, whoElse, etc.        │
    │ • encounterDate, locationName, eventName    │
    │ • mediaLink, mediaConsent                    │
    │ • 7 other progressive-disclosure fields     │
    │                                              │
    │ ✓ WRITTEN ONCE, NEVER MODIFIED             │
    │ ✓ All page 2+3 fields captured here         │
    │ ✓ Visible in admin "Contributor Original"  │
    └──────────────────────────────────────────────┘
                    ↑
                    │ (never patched)
                    └── updateSubmissionPreferences() stops here


    ┌──────────────────────────────────────────────┐
    │    attribution_preference (MUTABLE)          │
    │    preferred_attribution                     │
    │    book_note                                 │
    │    final_notes                               │
    ├──────────────────────────────────────────────┤
    │ ✓ WRITTEN VIA PATCH ONLY                    │
    │ ✓ Can be updated if contributor returns     │
    │ ✓ Never corrupts original_json              │
    │ ✓ Visible in admin "Preferences"            │
    └──────────────────────────────────────────────┘
                    ↑
                    │ updateSubmissionPreferences()
                    └── (only touches these 4 fields)


    ┌──────────────────────────────────────────────┐
    │    media[] (IMMUTABLE)                       │
    │    (1:many link to submissions)              │
    ├──────────────────────────────────────────────┤
    │ ✓ WRITTEN ONCE (with createSubmission)      │
    │ ✓ Never deleted or modified                 │
    │ ✓ mediaConsent flag in submission, not here │
    │ ✓ Stored in private Supabase bucket         │
    │ ✓ Accessible only to admin + uploader       │
    └──────────────────────────────────────────────┘
```

---

## Server Actions (No New API Routes)

```
/remember/actions.ts
├── submitMemoryAction(formData: FormData)
│   ├── Input: Combined page 2 + page 3 FormData
│   ├── Validation: memoryText required
│   ├── Calls: createSubmission(input)
│   ├── Returns: submissionId
│   ├── Calls: validateMediaUpload()
│   ├── Calls: uploadSupabaseMedia() × N
│   ├── Calls: insertMediaRows()
│   └── Redirect: /remember/final?submissionId=<id>
│   
└── updatePreferencesAction(submissionId, formData)
    ├── Input: submissionId + page 4 form data
    ├── Validation: submissionId exists
    ├── Calls: updateSubmissionPreferences()
    │   └── Updates ONLY: attribution/book/notes fields
    ├── Does NOT: modify original_json
    ├── Does NOT: touch media[]
    └── Redirect: /thanks
```

---

## Deployment Safety

```
✓ NO breaking changes to existing routes
✓ NO schema migrations (all columns pre-exist)
✓ NO RLS policy changes
✓ NO auth logic changes
✓ ONE new route (/remember/details) is optional insertion
✓ Old flow still works (if someone links directly to /remember/write)
✓ New flow is backwards-compatible with old data
✓ Media pipeline unchanged
✓ Admin workflows unchanged

→ Safe to deploy with zero downtime
→ Can rollback by re-pointing /remember/write to old component
→ No data corruption risk
```
