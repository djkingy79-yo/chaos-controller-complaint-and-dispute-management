import { format } from "date-fns";
import { getComplaintPathway, getEscalationBodyLabel } from "@/lib/authorityRouting";
import { buildPersonaPrompt } from "@/lib/letterPersonas";

/**
 * LETTER PROMPT BUILDER — Dispute Escalation Engine v3
 *
 * Entry point. Builds shared context + universal writing rules, then
 * delegates to letterPersonas.js for persona-specific prompt construction.
 *
 * Each persona is backed by FOUR hard sections:
 *   1. PROHIBITED SCOPE — what this letter must NOT contain (mechanical)
 *   2. STRUCTURAL RULES — objective rules, not personality descriptions
 *   3. FORBIDDEN LANGUAGE — banned words/phrases specific to this persona
 *   4. ADVANCEMENT JOB — what this letter does that previous letters didn't
 *
 * Post-generation validation runs in generateLetter/entry.ts and regenerates
 * if mechanical rules are violated. See extractMetadata for the structured
 * metadata object produced alongside each letter.
 */

export function buildClientContext(caseItem, evidenceList) {
  const merged = {
    name: caseItem.complainant_name || "",
    address: caseItem.complainant_address || "",
    email: caseItem.complainant_email || "",
    phone: caseItem.complainant_phone || "",
    accounts: caseItem.account_number ? [caseItem.account_number] : [],
    policies: [],
    amounts: [],
    dates: caseItem.incident_date ? [format(new Date(caseItem.incident_date), "d MMMM yyyy")] : [],
  };
  for (const ev of (evidenceList || [])) {
    const d = ev.extracted_data;
    if (!d) continue;
    if (!merged.name && d.complainant_name) merged.name = d.complainant_name;
    if (!merged.address && d.complainant_address) merged.address = d.complainant_address;
    if (!merged.email && d.complainant_email) merged.email = d.complainant_email;
    if (!merged.phone && d.complainant_phone) merged.phone = d.complainant_phone;
    if (d.account_numbers?.length) merged.accounts = [...merged.accounts, ...d.account_numbers];
    if (d.policy_numbers?.length) merged.policies = [...merged.policies, ...d.policy_numbers];
    if (d.key_amounts?.length) merged.amounts = [...merged.amounts, ...d.key_amounts];
    if (d.dates_mentioned?.length) merged.dates = [...merged.dates, ...d.dates_mentioned];
  }
  for (const k of ["accounts", "policies", "amounts", "dates"]) {
    merged[k] = [...new Set(merged[k])];
  }
  return merged;
}

// ═══════════════════════════════════════════════════════════════════════════
//  WRITING ENGINE — universal rules enforced on every letter
// ═══════════════════════════════════════════════════════════════════════════

function buildWritingRules(today) {
  return `
WRITING ENGINE RULES (UNIVERSAL — apply to every letter):

FORMAT:
1. PLAIN TEXT ONLY — no HTML tags, no angle brackets, no <div>, <br>, <p>, <strong>.
2. AUSTRALIAN ENGLISH spelling (organise, recognise, behaviour, colour, centre, licence, defence).
3. Standard Australian business letter format.
4. NEVER use placeholder brackets like [Name] — if a detail is missing, omit that line entirely.
5. Address lines must be tight single-spaced with no gaps.

THE DNA TEST:
6. Each letter is written by a DIFFERENT PROFESSIONAL with a distinct writing fingerprint. If someone covered the headings and signatures, they should still identify which letter they're reading within two paragraphs. Different vocabulary. Different sentence lengths. Different rhythm. Different structural habits.

THE ADVANCEMENT PRINCIPLE — NO DEMAND RECYCLING:
7. Each letter ADVANCES the investigation. It never repeats it. The same issue must be treated DIFFERENTLY at each stage:
   - Letter 1 REQUESTS it.
   - Letter 2 QUANTIFIES what its absence has prevented or cost.
   - Letter 3 STATES that its absence is now evidence of non-compliance.
   - Escalation PRESENTS its absence as a regulatory breach.
   - Accept RECORDS it as a delivered term.
   - Reject IDENTIFIES its absence as a deficiency the offer cannot cure.
   Never write the same sentence in a different format. If you catch yourself restating a previous letter's demand, STOP and rewrite it as an advancement.

NO AI PATTERNS — never use any of these or similar phrases:
   "I am writing to", "I would like to bring to your attention", "I am writing to advise",
   "Please be advised", "I trust this finds you well", "I respectfully request",
   "I wish to advise", "As previously stated", "I appreciate your attention",
   "I hope this letter finds you", "Significant stress", "Serious concerns",
   "Transparency", "Professionalism", "Proper examination", "Professional obligations",
   "A number of", "I have concerns regarding", "It appears", "It would be appreciated",
   "Settlement contains a number of undertakings", "I remain hopeful", "I urge you".

ACTIVE VOICE — THE ORGANISATION OWNS EVERY FAILURE:
   - "You have failed to provide..." not "The requested information has not been provided."
   - "You have not responded..." not "No response has been received."
   - "The evidence shows..." not "It appears that..."

NO STORYTELLING — after Letter 1 the complaint is already known. Do not retell it. Do not summarise it. Do not reference it except by date.

NO EMPTY THREATS — every consequence stated in one letter is enacted in the next. Do not re-threaten.

EVERY SENTENCE MUST DO ONE OF FOUR THINGS: (a) identify a failure, (b) demand a remedy, (c) increase accountability, or (d) move the matter to the next stage. If a sentence does none of these, DELETE IT.

LETTER SKELETON (plain text — headings vary per letter type):
${today}

[Sender Name]
[Sender Street Address]
[Sender City Postcode]
[Sender Email]
[Sender Phone]

[Recipient Name/Title]
[Organisation Name]
[Organisation Address]

Re: [Subject]

Dear [Name/Sir/Madam],

[Body — use the headings and structure specified for this letter type]

Yours faithfully,

[Sender Name]`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SHARED CONTEXT — factual case data injected into every prompt
// ═══════════════════════════════════════════════════════════════════════════

function buildContextBlock(caseItem, client, today, evidenceList, complaintPathway, escalationBody) {
  const fmtDate = (dt) => dt ? format(new Date(dt), "d MMMM yyyy") : null;

  const stages = [
    { sent: caseItem.first_complaint_sent_at, resp: caseItem.first_response_received_at, noResp: caseItem.first_no_response_at, label: "First Complaint" },
    { sent: caseItem.second_complaint_sent_at, resp: caseItem.second_response_received_at, noResp: caseItem.second_no_response_at, label: "Second Complaint" },
    { sent: caseItem.third_complaint_sent_at, resp: caseItem.third_response_received_at, noResp: caseItem.third_no_response_at, label: "Third/Final Complaint" },
  ];
  const priorCorrespondence = stages.map(s => {
    if (!s.sent) return `- ${s.label}: NOT YET SENT`;
    let line = `- ${s.label}: sent ${fmtDate(s.sent)}`;
    if (s.resp) line += ` → response received ${fmtDate(s.resp)}`;
    else if (s.noResp) line += ` → NO RESPONSE by ${fmtDate(s.noResp)}`;
    else line += ` → awaiting response`;
    return line;
  }).join('\n');

  const evidenceSummary = (evidenceList || []).length > 0
    ? (evidenceList || []).map(ev => {
        const summary = ev.extracted_data?.document_summary || ev.description || '';
        const amounts = (ev.extracted_data?.key_amounts || []).join(', ');
        const dates = (ev.extracted_data?.dates_mentioned || []).join(', ');
        return `- ${ev.file_name}${summary ? ': ' + summary.slice(0, 400) : ''}${amounts ? ' | Amounts: ' + amounts : ''}${dates ? ' | Dates: ' + dates : ''}`;
      }).join('\n')
    : 'No documents uploaded.';

  return `
CASE FACTS:

COMPLAINANT:
- Name: ${client.name || "not provided — omit name line"}
- Address: ${client.address || "not provided — omit address block"}
- Email: ${client.email || "not provided"}
- Phone: ${client.phone || "not provided"}
- Account/Reference: ${client.accounts?.join(", ") || caseItem.account_number || "not provided"}
- Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : client.dates?.join(", ") || "not provided"}
${client.policies?.length ? `- Policy Numbers: ${client.policies.join(", ")}` : ""}
${client.amounts?.length ? `- Key Amounts in Dispute: ${client.amounts.join(", ")}` : ""}

ORGANISATION:
- Organisation: ${caseItem.organisation_name || "not provided"}
- Complaints Address: ${caseItem.organisation_complaints_address || "Complaints Department, " + (caseItem.organisation_name || "the organisation")}
- Complaints Email: ${caseItem.organisation_complaints_email || "not provided"}
- Complaint Handler: ${caseItem.complaint_handler_name || "The Complaints Manager"}

DISPUTE:
- Category: ${caseItem.category}
- State/Territory: ${caseItem.state || "not confirmed"}
- Issue Summary: ${caseItem.issue_summary}
- Full Details: ${caseItem.issue_details}
- Desired Outcome: ${caseItem.desired_outcome}
- Today's Date: ${today}

ESCALATION BODY (from routing engine — use ONLY this name, never invent or substitute):
${escalationBody}

COMPLAINT PATHWAY (for reference — never substitute any body listed here):
- Internal: ${complaintPathway.internalComplaint || "n/a"}
- Regulator: ${complaintPathway.regulator || "n/a"}
- Ombudsman: ${complaintPathway.ombudsman || "n/a"}
- Tribunal: ${complaintPathway.tribunal || "n/a"}

CORRESPONDENCE HISTORY (what was sent, when, and whether the organisation responded):
${priorCorrespondence}

EVIDENCE ON FILE (${(evidenceList || []).length} documents):
${evidenceSummary}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

export function buildPrompt(type, caseItem, client, today, evidenceList) {
  const complaintPathway = caseItem.complaint_pathway || getComplaintPathway({
    category: caseItem.category,
    state: caseItem.state,
    context: {
      text: `${caseItem.issue_summary || ""} ${caseItem.issue_details || ""}`,
      hasCivilClaimPathway: !!caseItem.has_civil_claim_pathway,
    },
  });
  const escalationBody = caseItem.escalation_body || getEscalationBodyLabel(complaintPathway);

  const contextBlock = buildContextBlock(caseItem, client, today, evidenceList, complaintPathway, escalationBody);
  const writingRules = buildWritingRules(today);

  return buildPersonaPrompt(type, { contextBlock, writingRules, escalationBody, caseItem, today });
}