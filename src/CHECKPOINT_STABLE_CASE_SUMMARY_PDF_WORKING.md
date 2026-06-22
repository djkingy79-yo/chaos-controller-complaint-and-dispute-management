# CHECKPOINT: STABLE_CASE_SUMMARY_PDF_WORKING
**Created:** 22 June 2026 — Australia/Sydney timezone  
**Status:** FROZEN — DO NOT MODIFY LISTED FILES WITHOUT STATED REASON + CONFIRMED BUG

---

## BACKUP MANIFEST

### Location
All source files reside in the live Base44 project repository. This document serves as the canonical checkpoint record and content snapshot for the stable build.

---

## FROZEN FILE LIST

Any edit to these files requires stating:
1. Exact file path
2. Exact reason (confirmed bug only — not optimisation)
3. Exact line/function
4. Expected outcome

| File | Purpose | Frozen |
|---|---|---|
| `lib/pdfGenerator.js` | Core PDF generator, image loader, cleanForPDF, openPDFForPrint | YES |
| `components/cases/CaseSummary.jsx` | Dashboard summary tab, PDF body builders, all 4 PDF buttons | YES |
| `components/cases/ExecutiveSummaryGenerator.jsx` | AI summary generator, dialog, Download/Print PDF buttons | YES |
| `components/cases/WeeklySnapshot.jsx` | Weekly snapshot generator, Download/Print PDF buttons | YES |
| `components/cases/LetterSuite.jsx` | 6-letter suite, all generate/download/print/edit flows | YES |
| `components/cases/PrintBundle.jsx` | Full bundle, individual section PDF buttons | YES |
| `lib/pdfDiagnostics.js` | PDF diagnostic helpers, toast feedback, debug state | YES |
| `functions/generateExecutiveSummary.js` | Backend AI case summary function, saves to DB | YES |

---

## VERIFIED WORKING BEHAVIOUR AT CHECKPOINT

| Behaviour | State |
|---|---|
| Case Summary generates via `generateExecutiveSummary` backend function | WORKING |
| AI assessment displays all 10 sections (new schema) + legacy fallback | WORKING |
| Dashboard PDF downloads — `buildDashboardPDFBody` → `generateChaosDocumentPDF` → `downloadPDFBlob` | WORKING |
| AI Summary PDF downloads — `buildAISummaryPDFBody` → `generateChaosDocumentPDF` → `downloadPDFBlob` | WORKING |
| Print opens blob in new tab; `load` event fires `win.print()`; 1500ms Safari fallback also fires | WORKING |
| Popup blocked → `toast.warning` → fallback to `downloadPDFBlob` automatically | WORKING |
| All PDF output is plain ASCII — no `══`, `✓`, `✗`, `~`, `%P`, em-dash corruption | CONFIRMED |
| `cleanForPDF` strips all non-ASCII via `/[^\x00-\x7F]/g` before jsPDF render | CONFIRMED |
| Dashboard PDF dividers: `----------------------------------------` (40 dashes) | CONFIRMED |
| Checklist markers: `YES -` / `NO  -` / `N/A -` | CONFIRMED |
| Progress tracker markers: `[COMPLETE]` / `[CURRENT] ` / `[PENDING] ` | CONFIRMED |
| Letter generation — all 6 types — generates, saves, displays, PDF exports | WORKING |
| WeeklySnapshot generates, caches to localStorage, exports PDF | WORKING |
| PrintBundle — all section PDFs + bundle summary — download + print | WORKING |
| ExecutiveSummaryGenerator — generates, displays in dialog, Download PDF + Print PDF | WORKING |
| pdfDiagnostics — toast on start/success/fail, console logging | WORKING |

---

## BUTTON LABEL REGISTER (frozen)

| Component | Button Label |
|---|---|
| CaseSummary | "Download Dashboard PDF" |
| CaseSummary | "Print Dashboard" |
| CaseSummary | "Download AI Summary PDF" |
| CaseSummary | "Print AI Summary" |
| CaseSummary | "Generate Case Summary" |
| ExecutiveSummaryGenerator | "Generate Case Summary" |
| ExecutiveSummaryGenerator | "View Summary" |
| ExecutiveSummaryGenerator | "Download PDF" |
| ExecutiveSummaryGenerator | "Print PDF" |
| WeeklySnapshot | "Download PDF" |
| WeeklySnapshot | "Print PDF" |
| WeeklySnapshot | "Generate Snapshot" / "Regenerate" |
| LetterSuite (each letter) | "Generate Letter" / "Regenerate" |
| LetterSuite (each letter) | "Download PDF" |
| LetterSuite (each letter) | "Print PDF" |
| LetterSuite (each letter) | "Copy" |
| LetterSuite (each letter) | "Edit" / "Save" |
| PrintBundle | "Download Case Summary PDF" |
| PrintBundle | "Print Case Summary PDF" |
| PrintBundle (each section) | "Download PDF" |
| PrintBundle (each section) | "Print PDF" |

---

## KEY FUNCTION SIGNATURES (frozen)

```js
// lib/pdfGenerator.js
generateChaosDocumentPDF({ documentType, title, matter, date, body, sections, includeHeader, includeFooter }) → Blob
cleanForPDF(content) → string   // strips HTML, markdown, non-ASCII /[^\x00-\x7F]/g
downloadPDFBlob(blob, filename) → void
openPDFForPrint(blob, filename) → Promise<boolean>
// load event + 1500ms setTimeout fallback for Safari; returns false if popup blocked
```

```js
// components/cases/CaseSummary.jsx
buildDashboardPDFBody(caseItem, executiveSummary, evidence, events, deadlines) → string
buildAISummaryPDFBody(s) → string   // handles new schema + legacy schema
runPDFAction({ action, tab, title, body, filename, onBlob }) → Promise<Blob>
handleDashboardDownload() / handleDashboardPrint()
handleSummaryDownload() / handleSummaryPrint()
```

```js
// functions/generateExecutiveSummary.js
// Invoked as: base44.functions.invoke('generateExecutiveSummary', { caseId })
// Returns: { success: true, summary: { case_overview, facts, timeline_summary,
//   evidence_summary, issues_identified, strengths, weaknesses,
//   missing_evidence, next_actions, escalation_path } }
// Saves summary to: Case.executive_summary = JSON.stringify(aiResponse)
// Model: gemini_3_1_pro
```

---

## PDF GENERATOR CONSTANTS (frozen)

```js
LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'
FOOTER_URL     = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'

Page:     A4 portrait (210mm × 297mm)
Font:     Times New Roman, 11pt body / 12pt headings / 14pt title
Margins:  L/R 17.5mm, T/B 12.5mm, bottom safe zone 30mm
Image timeout: 6000ms (never throws — returns null, PDF continues)
```

---

## AI SUMMARY SCHEMA (frozen — new schema)

```json
{
  "case_overview": "string",
  "facts": ["string"],
  "timeline_summary": "string",
  "evidence_summary": ["string"],
  "issues_identified": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missing_evidence": ["string"],
  "next_actions": ["string"],
  "escalation_path": "string"
}
```

Legacy schema keys (fallback display): `summary`, `key_issues`, `evidence_analysis`, `correspondence_summary`, `next_steps`, `case_strength_assessment`, `critical_deadlines`

---

## SUBSCRIPTION ACCESS (frozen — LetterSuite)

| Letter | Min Plan |
|---|---|
| 1st Complaint | Starter |
| 2nd Complaint | Pro |
| 3rd Complaint | Pro |
| Accept Offer | Pro |
| Deny Offer | Pro |
| Escalation Letter | Command |

---

## PACKAGE VERSIONS (frozen — relevant packages)

| Package | Version |
|---|---|
| jspdf | ^4.2.1 |
| @base44/sdk | ^0.8.32 |
| react | ^18.2.0 |
| @tanstack/react-query | ^5.84.1 |
| date-fns | ^3.6.0 |
| sonner | ^2.0.1 |
| lucide-react | ^0.475.0 |
| react-router-dom | ^6.26.0 |

---

## FREEZE RULES

Any future edit to a frozen file requires the editor to state:

1. **Exact file path**
2. **Exact reason** — must be a confirmed reproducible bug
3. **Exact line/function** being changed
4. **Expected outcome** after the change

**If the reason is any of the following, the edit MUST NOT proceed:**
- "optimisation"
- "refactoring"
- "cleanup"
- "improvement"
- "modernisation"
- Adding unrequested features
- Renaming working functions or schema keys
- Changing button handlers that are confirmed working
- Altering the PDF generation flow

---

*Checkpoint recorded by Base44 AI. Date: 22 June 2026.*