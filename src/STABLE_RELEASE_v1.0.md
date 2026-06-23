# Chaos Controller — Stable Release v1.0
**Tagged:** 23 June 2026  
**Status:** ✅ PRODUCTION APPROVED — DO NOT REFACTOR CORE SYSTEMS

---

## Release Summary

This document marks the stable baseline for Chaos Controller v1.0.  
All systems below have been smoke-tested, verified, and approved for production.

---

## ✅ Locked Systems — Additive Changes Only

The following systems are **stable and locked**. Do not refactor internals unless a critical bug requires it. All future changes must be **additive only** (new fields, new letter types, new integrations) — never modify the core flow.

### 1. Case Creation (`pages/NewCase.jsx`)
- `creation_request_id` idempotency key (UUID per attempt)
- Hard-guarded `isCreating` state blocks rapid duplicate submissions
- Background processing: evidence linking, AI checklist, timeline auto-generation post-create
- Immediate navigation to case dashboard on creation

### 2. Letter Suite (`components/cases/LetterSuite.jsx` + `functions/generateLetter`)
- 6 dedicated Case entity fields: `first_complaint_letter`, `second_complaint_letter`, `third_complaint_letter`, `accept_offer_letter`, `deny_offer_letter`, `escalation_letter`
- Legacy fields (`complaint_letter`, `complaint_letter_2`, `complaint_letter_3`, `letter_accept_offer`, `letter_deny_offer`, `letter_escalation`) deprecated — do not write to them
- Backend saves letter to DB directly — no data loss on frontend timeout
- `LetterGenerationLock` entity prevents duplicate AI calls (180s stale threshold)
- Hard timeout (130s) with soft retry UI — no stuck spinners
- Provider 502/503/504 errors caught on backend, lock released, friendly message returned
- User-facing error: "AI service was temporarily unavailable. Your case is safe. Please retry."

### 3. Calendar Sync
- **Google Calendar** (`functions/syncCalendar`): shared connector, `created_by_id`-scoped, `check`/`sync` actions
- **Outlook Calendar** (`functions/syncOutlookCalendar`): stable `cc_event_id` deduplication via `singleValueExtendedProperties` — keyed `cc_{type}_{case_id}_{item_id}` — prevents all duplicate visible events on repeat sync

### 4. Generation Locking (`entities/LetterGenerationLock.json`)
- Lock created before AI call, released (completed/failed) after
- Stale lock threshold: 180 seconds
- Any lock older than 180s is treated as abandoned and allows retry
- Transient provider errors release lock immediately so retry creates one clean new attempt

---

## Entity Field Map (Letter Suite)

| Letter Type    | Case Entity Field          | Word Limit  |
|----------------|---------------------------|-------------|
| 1st Complaint  | `first_complaint_letter`  | 700–1,000   |
| 2nd Complaint  | `second_complaint_letter` | 600–900     |
| 3rd Complaint  | `third_complaint_letter`  | 600–900     |
| Accept Offer   | `accept_offer_letter`     | 350–600     |
| Deny Offer     | `deny_offer_letter`       | 500–800     |
| Escalation     | `escalation_letter`       | 900–1,200   |

---

## Verified Production Tests (23 June 2026)

| Check | Result |
|---|---|
| Idempotency guard (duplicate case creation) | ✅ Pass |
| All 6 letters generated, saved, no HTML, no placeholders | ✅ Pass |
| All 6 letters within word limits | ✅ Pass |
| Legacy fields empty | ✅ Pass |
| All locks resolved `completed`, 0 stuck | ✅ Pass |
| Letter persistence after DB re-fetch | ✅ Pass |
| Google Calendar `connected: true` | ✅ Pass |
| Outlook sync 16 items, 0 duplicates on re-sync | ✅ Pass |
| Directory: 14 categories, 8 states/territories | ✅ Pass |
| Provider 502 error → friendly retry message | ✅ Pass |
| Lock released on provider failure | ✅ Pass |

---

## Architecture Decisions (Do Not Revert)

- **No browser-side InvokeLLM** — all AI calls go through `generateLetter` backend function
- **No single `complaint_letter` field** — HTTP 500 size limit errors; use dedicated fields
- **No subject-based Outlook dedup** — title changes caused duplicates; use `cc_event_id` extended property
- **No Math.random() tokens** — use `crypto.randomUUID()` for all identifiers

---

## Future Development Rules

1. Letter Suite: add new letter types as new fields + new LETTER_TYPES entries only
2. Calendar: add new event types via `makeCcEventId()` + new sync block only
3. Case creation: add new background tasks by appending to the post-create queue only
4. Lock system: do not change the 180s threshold without testing under load
5. This file must be updated whenever a locked system is intentionally changed

---

*Approved by: Production smoke test + manual verification*  
*Release engineer: Base44 AI*