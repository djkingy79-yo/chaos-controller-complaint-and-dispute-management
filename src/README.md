# Chaos Controller™

**AI-Powered Consumer Advocacy & Dispute Management Platform**  
Built by Deb King — Australian-owned & operated  
🌐 [chaoscontroller.com.au](https://chaoscontroller.com.au) · ✉️ djkingy79@gmail.com

---

## What Is Chaos Controller?

Chaos Controller helps everyday Australians fight back against banks, insurers, landlords, telcos, utilities, and government agencies — by organising evidence, writing professional complaint letters, and tracking every deadline automatically.

---

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **State:** TanStack React Query
- **Animations:** Framer Motion
- **Backend:** Base44 BaaS (auth, database, serverless functions, integrations)
- **AI:** Base44 InvokeLLM (document scanning, letter generation, summarisation)
- **Calendar Sync:** Google Calendar, Google Tasks, Microsoft Outlook (OAuth connectors)
- **Storage:** Google Drive (evidence backup)
- **Email:** Gmail connector + Base44 SendEmail
- **Fonts:** Inter (body) + Space Grotesk (headings/display)

---

## Subscription Plans

| Plan | Price | Cases | Evidence Files |
|------|-------|-------|---------------|
| Starter | $9.99/mo AUD | 3 | 25 per case |
| Pro | $15.99/mo AUD | Unlimited | Unlimited |
| Command | $19.99/mo AUD | Unlimited | Unlimited |

Payment is via **PayID** to `djkingy79@gmail.com`. Admin manually verifies and activates subscriptions.

**Admin (djkingy79@gmail.com)** has Command-level access free, permanently.

---

## Pages & Routes

| Route | Page | Auth |
|-------|------|------|
| `/` | Welcome (public landing page) | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password` | Reset Password | Public |
| `/shared-case/:token` | Shared Case Portal (merchant view) | Public |
| `/merchant-login` | Merchant Login | Public |
| `/merchant-portal` | Merchant Portal | Public |
| `/dashboard` | User Dashboard | Protected |
| `/cases` | Case List | Protected |
| `/new-case` | New Case wizard | Protected |
| `/case/:id` | Case Detail (full case management) | Protected |
| `/deadlines` | Deadline War Room | Protected |
| `/checklist` | Smart Checklist | Protected |
| `/calendar` | Command Calendar | Protected |
| `/calendar-sync` | Calendar Sync Settings | Protected |
| `/merchant-responses` | Merchant Responses Dashboard | Protected |
| `/notifications` | Notifications | Protected |
| `/analytics` | Analytics Dashboard | Protected |
| `/escalation` | Escalated Cases | Protected |
| `/letter-agent` | AI Letter Draft Agent | Protected |
| `/templates` | Template & Case Libraries | Protected |
| `/directories` | Organisation Directory | Protected |
| `/payments` | Subscription & Payments | Protected |
| `/settings` | User Settings | Protected |
| `/admin` | Admin Command Centre | Admin Only |
| `/help` | Help Guide | Protected |
| `/qna` | Q&A | Protected |
| `/sample-reports` | Sample Reports | Protected |
| `/sample-previews` | Sample Previews | Protected |
| `/terms` | Terms & Conditions | Protected |
| `/privacy` | Privacy Policy | Protected |

---

## Key Entities

| Entity | Purpose |
|--------|---------|
| `Case` | Core dispute record (letters, status, parties, dates) |
| `Evidence` | Uploaded files with AI-extracted metadata & full text |
| `Deadline` | Critical dates per case (scoped via case_id) |
| `TimelineEvent` | Auto & manual events plotted on the case timeline |
| `ChecklistItem` | Proof-tracked tasks per case |
| `MerchantResponse` | Responses submitted via shared portals |
| `CaseShare` | Tokenised share links for merchant portals |
| `Notification` | Per-user in-app alerts (scoped by user_id) |
| `PaymentRequest` | PayID payment submissions + admin verification |
| `Organisation` | Contacts directory |
| `CaseTemplate` | Pre-filled case templates by category |
| `LetterTemplate` | Saved complaint letter templates |
| `SyncState` | Google Calendar incremental sync token per user |

---

## Backend Functions

| Function | Purpose |
|----------|---------|
| `autoGenerateTimelineFromEvidence` | Creates timeline events on evidence upload |
| `autoGenerateTimelineFromStatus` | Creates timeline events on case status change |
| `autoGenerateTimelineOnCaseCreate` | Seeds timeline on new case creation |
| `backupEvidenceToDrive` | Uploads evidence files to Google Drive per case/category |
| `caseStatusNotifier` | Emails user + merchant shares on status change |
| `dailySummaryEmail` | 8am daily summary of pending deadlines via Gmail |
| `deadlineReminders` | Sends email reminders for upcoming deadlines |
| `evidenceUploadNotifier` | In-app notification on evidence upload |
| `extractTextFromEvidence` | Full-text OCR extraction for evidence keyword search |
| `generateAIChecklist` | AI-generated evidence checklist for a case |
| `generateExecutiveSummary` | AI executive summary of case strength |
| `getMerchantCases` | Retrieves cases for merchant portal (by share token) |
| `getSharedCase` | Public case data for shared portal |
| `inviteMerchant` | Sends merchant invite email with portal link |
| `merchantActivityNotifier` | Notifies user when merchant views their shared portal |
| `merchantLoginNotifier` | Notifies user when merchant logs in |
| `monthlyDisputeReport` | Monthly analytics email to admin |
| `newCaseMerchantNotifier` | Notifies merchant when added to a new case |
| `paymentNotification` | Emails admin (new payment) and user (verified payment) |
| `submitMerchantResponse` | Merchant submits response via portal |
| `syncCalendar` | Sync deadlines to Google Calendar (app-user connector) |
| `syncChecklistToGoogleTasks` | Sync checklist items to Google Tasks |
| `syncDailyTasksToGoogle` | Bulk sync deadlines + checklists to Google Tasks |
| `syncDeadlineToTasks` | Single deadline → Google Tasks |
| `syncDeadlinesToGoogleTasks` | Bulk deadlines → Google Tasks |
| `syncDeadlinesToOutlookTasks` | Deadlines → Outlook Tasks |
| `syncOutlookCalendar` | Deadlines → Outlook Calendar |
| `convertImageToPDF` | Converts uploaded images to PDF |
| `convertImageToSearchablePDF` | Image → searchable PDF with OCR |
| `cleanupDeadlinesFromTasks` | Removes stale tasks from Google Tasks |
| `syncTasks` | General task sync utility |

---

## Automations

| Automation | Type | Trigger |
|-----------|------|---------|
| Timeline on case create | Entity | Case → create |
| Timeline on status change | Entity | Case → update (status field) |
| Timeline on evidence upload | Entity | Evidence → create |
| Backup evidence to Drive | Entity | Evidence → create |
| Calendar sync on deadline change | Entity | Deadline → create/update |
| Checklist sync to Google Tasks | Entity | ChecklistItem → create/update |
| Status notifier | Entity | Case → update (status field) |
| Daily summary email | Scheduled | Daily 8:00 AM AEST |
| Deadline reminders | Scheduled | Daily 8:00 AM AEST |

---

## Data Security — Key Rules

- **All user queries are scoped by `created_by_id: user.id`** — no user can see another user's cases.
- **Notifications filtered by `user_id`** — never returned platform-wide.
- **Deadlines filtered via `case_id: { $in: userCaseIds }`** — Deadline entity has no `created_by_id`.
- **Merchant responses filtered by user's case IDs** — not platform-wide.
- **Admin routes** (`/admin`) redirect non-admin users to `/dashboard`.
- **Shared case portals** use a tokenised `share_token` — no authenticated session required for merchants.

---

## Branding & Contact

- **Domain:** chaoscontroller.com.au
- **Support email:** chaoscontrollerapp@gmail.com
- **PayID:** djkingy79@gmail.com
- **Disclaimer:** All content is for educational/informational purposes only. Not formal legal advice.
- **Fonts:** Space Grotesk (headings) + Inter (body)
- **Colours:** Black bg · #FFD700 (gold) · #C0392B (red) · #A855F7 (purple)

---

## Known Limitations

- Custom domain (`chaoscontroller.com.au`) must be configured manually in Base44 platform settings.
- Payment verification is manual — admin receives email, verifies PayID, then activates subscription in AdminDashboard → Payments tab.
- Microsoft Outlook OAuth login may show "App not found" — requires Microsoft Azure app registration to be active.

---

## Deployment Notes

- Hosted on Base44 cloud — auto-deploys on save.
- Backend functions use Deno runtime (not Node.js).
- No `.env` file needed — secrets set via Base44 dashboard → Environment Variables.
- Test database available — toggle via Base44 dashboard.