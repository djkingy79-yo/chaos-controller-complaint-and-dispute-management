import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, RefreshCw, Pencil, Check, Loader2, Download, Printer, FileText, Lock, Mail, CheckCircle2, XCircle, Trash2, CalendarClock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LetterTemplateManager from "./LetterTemplateManager";
import LetterEmailDialog from "./LetterEmailDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { captureLetterDocumentPDF, downloadPDFBlob, openPDFForPrint, PRINT_BLOCKED_MESSAGE } from "@/lib/pdfGenerator";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription, hasPlanAccess } from "@/lib/subscription";
import { Link } from "react-router-dom";
import LetterHeader, { buildLetterHeaderData } from "@/components/cases/LetterHeader.jsx";
import LetterDocument, { LetterPreviewWrapper } from "@/components/letters/LetterDocument.jsx";
import MarkSentDialog from "@/components/cases/MarkSentDialog.jsx";
import { markLetterSent } from "@/lib/letterTracking";
import { LETTER_SENT_FIELD_MAP, getLetterReSubject } from "@/lib/disputeStageLogic";
import { getComplaintPathway, getEscalationBodyLabel } from "@/lib/authorityRouting";

function buildClientContext(caseItem, evidenceList) {
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

// minPlan: "Starter" | "Pro" | "Command"
const LETTER_TYPES = [
  { key: "letter1", label: "1st Complaint", field: "first_complaint_letter", description: "Initial formal complaint to the organisation", minPlan: "Starter" },
  { key: "letter2", label: "2nd Complaint", field: "second_complaint_letter", description: "Follow-up when no response or unsatisfactory response", minPlan: "Pro" },
  { key: "letter3", label: "3rd Complaint", field: "third_complaint_letter", description: "Final demand before external escalation", minPlan: "Pro" },
  { key: "accept_offer", label: "Accept Offer", field: "accept_offer_letter", description: "Formally accept a settlement offer", minPlan: "Pro" },
  { key: "deny_offer", label: "Deny Offer", field: "deny_offer_letter", description: "Reject an unsatisfactory offer and state reasons", minPlan: "Pro" },
  { key: "escalation", label: "Escalation Letter", field: "escalation_letter", description: "Formal complaint to the assigned external escalation body", minPlan: "Command" },
];

function buildPrompt(type, caseItem, client, today, evidenceList) {
  // Single source of truth for the complaint pathway — the case's own
  // stored structured pathway, falling back to the routing engine's own
  // category+state lookup (never an ad hoc "AFCA/TIO/NCAT" style generic string).
  const complaintPathway = caseItem.complaint_pathway || getComplaintPathway({
    category: caseItem.category,
    state: caseItem.state,
    context: {
      text: `${caseItem.issue_summary || ""} ${caseItem.issue_details || ""}`,
      hasCivilClaimPathway: !!caseItem.has_civil_claim_pathway,
    },
  });
  const escalationBody = caseItem.escalation_body || getEscalationBodyLabel(complaintPathway);

  const evidenceSummary = (evidenceList || []).length > 0
    ? (evidenceList || []).map(ev => {
        const summary = ev.extracted_data?.document_summary || ev.description || '';
        const amounts = (ev.extracted_data?.key_amounts || []).join(', ');
        const dates = (ev.extracted_data?.dates_mentioned || []).join(', ');
        return `- ${ev.file_name}${summary ? ': ' + summary.slice(0, 400) : ''}${amounts ? ' | Amounts: ' + amounts : ''}${dates ? ' | Dates: ' + dates : ''}`;
      }).join('\n')
    : 'No documents uploaded.';

  const fmtDate = (dt) => dt ? format(new Date(dt), "d MMMM yyyy") : null;
  const priorCorrespondence = [
    caseItem.first_complaint_sent_at ? `- First Complaint: sent ${fmtDate(caseItem.first_complaint_sent_at)}` : '- First Complaint: not yet sent',
    caseItem.second_complaint_sent_at ? `- Second Complaint: sent ${fmtDate(caseItem.second_complaint_sent_at)}` : '- Second Complaint: not yet sent',
    caseItem.third_complaint_sent_at ? `- Third/Final Complaint: sent ${fmtDate(caseItem.third_complaint_sent_at)}` : '- Third/Final Complaint: not yet sent',
  ].join('\n');

  // ─── SHARED FACTUAL CONTEXT (no legal lecture, no mandatory section structure) ───
  const contextBlock = `
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

CASE:
- Category: ${caseItem.category}
- State/Territory: ${caseItem.state || "not confirmed"}
- Issue Summary: ${caseItem.issue_summary}
- Full Details: ${caseItem.issue_details}
- Desired Outcome: ${caseItem.desired_outcome}
- Today's Date: ${today}

ASSIGNED ESCALATION BODY (from the routing engine — use ONLY this name, never invent or substitute):
${escalationBody}

ASSIGNED COMPLAINT PATHWAY (for reference — never substitute any body listed here):
- Internal: ${complaintPathway.internalComplaint || "n/a"}
- Regulator: ${complaintPathway.regulator || "n/a"}
- Ombudsman: ${complaintPathway.ombudsman || "n/a"}
- Tribunal: ${complaintPathway.tribunal || "n/a"}

PRIOR CORRESPONDENCE:
${priorCorrespondence}

EVIDENCE ON FILE (${(evidenceList || []).length} documents):
${evidenceSummary}`;

  // ─── SHARED FORMAT RULES (no mandatory section headings — each letter defines its own) ───
  const formatRules = `
UNIVERSAL FORMAT RULES:
1. PLAIN TEXT ONLY — no HTML tags, no angle brackets, no <div>, <br>, <p>, <strong>.
2. AUSTRALIAN ENGLISH spelling (organise, recognise, behaviour, colour, centre, licence, defence).
3. Standard Australian business letter format.
4. NEVER use placeholder brackets like [Name] — if a detail is missing, omit that line entirely.
5. Address lines must be tight single-spaced with no gaps.
6. BANNED PHRASES — never use any of these or similar AI filler:
   "I trust this finds you well", "I respectfully request", "I wish to advise",
   "As previously stated", "I appreciate your attention", "I am writing to",
   "I hope this letter finds you", "Please be advised that",
   "Significant stress", "Serious concerns", "Transparency", "Professionalism",
   "I urge you", "I remain hopeful".
7. No emotional language, no personal opinions, no sarcasm, no hyperbole.
8. Every sentence must move the complaint forward. Maximum impact, minimum words.
9. Do not repeat facts from previous letters unless directly necessary for context.
10. PROGRESSIVE ESCALATION: Each letter progressively increases pressure while progressively decreasing explanation. Each new letter contains less history, more accountability, more evidence, and clearer consequences. The reader should immediately know which letter they are reading without looking at the title.
11. Each letter achieves ONE objective only — never combine objectives across letters.
12. NO PARAGRAPH REUSE: Never reproduce the same paragraph across multiple letters. Every paragraph must be unique. If you detect you are repeating previous wording, rewrite the section entirely.
13. STRATEGIC ANALYSIS: Before writing each letter, determine: (a) what changed since the previous letter, (b) what the organisation failed to do, (c) what new evidence exists, (d) what pressure should now be applied, (e) what outcome this letter is trying to achieve. If nothing has changed, focus on the organisation's failure to respond — do not repeat the same paragraphs.
14. NO EMPTY THREATS: Every consequence stated in one letter must occur in the next stage if the deadline expires. Do not re-threaten what was already threatened — state that the deadline has expired and the consequence is now being enacted.

LETTER SKELETON (plain text — headings vary per letter type as specified):
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

  // ═══════════════════════════════════════════════════════════════════════
  //  LETTER 1 — FIRST COMPLAINT
  //  Pressure: 2/10 | Tone: Professional, firm, calm
  //  Purpose: Identify the issue, state what happened, state outcome, give deadline
  // ═══════════════════════════════════════════════════════════════════════
  if (type === "letter1") {
    return `You are a professional consumer dispute strategist with 30 years of experience. Write the FIRST formal complaint letter from the complainant to the organisation.

TONE: Professional, firm, calm. Pressure: 2/10.
This letter gives the organisation the opportunity to resolve the matter internally. Do NOT lecture. Do NOT threaten. Do NOT discuss legislation in detail. Do NOT cite section numbers of any Act.

OBJECTIVE: Raise the issue. Identify the problem. State what happened. State what is required. Give a 21-day deadline. Maximum length: 1 page. No legislation. No regulator discussion. No threats.

MANDATORY STRUCTURE (use these exact headings on their own line, uppercase, no colon):

THE ISSUE
[2–3 sentences: what the problem is. Direct. No preamble. No "I am writing to...". Open with the issue itself.]

WHAT HAPPENED
[Chronological facts only: dates, amounts, what occurred. No commentary, no accusations, no legal analysis. Just what happened. Be specific — use actual dates, amounts, and account numbers from the case details.]

WHAT I REQUIRE
[State the specific outcome: ${caseItem.desired_outcome}. Be precise about amounts, actions, or corrections required. One paragraph.]

RESPONSE REQUIRED
[State: 21 calendar days from today. State the exact deadline date. Close with exactly: "If this matter cannot be resolved internally, I will consider my external options."]

RULES:
- Do NOT restate evidence in detail — evidence is on file and available on request.
- Do NOT explain consumer law or cite legislation sections.
- Do NOT discuss, name, or reference any regulator, ombudsman, or tribunal.
- Do NOT use any banned filler phrases.
- Open with the issue, not with pleasantries.
- Close with the deadline, not with threats.
- Be direct: "I require" not "I would appreciate if you could perhaps".
- Maximum length: 1 page.
- EVIDENCE EVOLUTION: This is the first letter — include only evidence available at this time. Do not reference future evidence or anticipate the organisation's response.
${contextBlock}
${formatRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  LETTER 2 — SECOND COMPLAINT
  //  Pressure: 5/10 | Tone: Noticeably firmer
  //  Purpose: They failed to resolve. Reference prior correspondence.
  //  Explain why response is inadequate. Introduce the external authority.
  // ═══════════════════════════════════════════════════════════════════════
  if (type === "letter2") {
    return `You are a professional consumer dispute strategist with 30 years of experience. Write the SECOND formal complaint letter from the complainant to the organisation.

TONE: Noticeably firmer. Pressure: 5/10.
The organisation has either not responded within 21 days or gave an inadequate response. This letter raises the pressure and introduces the external authority by name.

STRATEGIC ANALYSIS (determine before writing):
- What changed since the first letter? (Has the organisation responded? Has the deadline expired? Has new evidence emerged?)
- What has the organisation failed to do? (Did they ignore the complaint? Did they respond inadequately? Did they avoid specific questions?)
- What new evidence exists? (Proof the complaint was ignored, proof of inadequate response, proof of continued non-compliance)
- What pressure should now be applied? (Accountability for their failure, introduction of the regulator, shortened deadline)
- What outcome is this letter trying to achieve? (Force a proper response or create the record needed for escalation)

ACCOUNTABILITY RULE: This letter MUST begin by acknowledging the organisation's conduct since the previous letter. Do NOT restart the complaint from the beginning. Open with their failure — e.g. "You have not responded to my previous complaint dated..." or "Your response failed to address the following issues..." or "You provided a response, however it did not answer the questions raised."

RESPONSE ANALYSIS: If a response was received from the organisation, analyse it before writing. Identify: what they answered, what they avoided, what they denied, what documents remain outstanding, what questions remain unanswered. Target those failures instead of repeating the original complaint.

OBJECTIVE: Hold the organisation accountable. Do NOT retell the complaint. State they were given an opportunity and failed. Explain why their response is inadequate. Introduce the regulator by name. Give a 14-day deadline. Maximum length: 1 page.

MANDATORY STRUCTURE (use these exact headings on their own line, uppercase, no colon):

FAILURE TO RESPOND
[Open by acknowledging the organisation's conduct: "You have not responded to my previous complaint dated [date]." or "Your response dated [date] failed to address the following issues..." Then state plainly: "You were given an opportunity to resolve this matter. You failed to respond adequately." Direct — no hedging.]

WHY YOUR RESPONSE IS INADEQUATE
[State the specific reasons their response (or silence) falls short. If they responded, identify what they answered, what they avoided, what they denied, what remains outstanding. Do NOT retell the complaint — reference it. Focus on their failures. 2–3 tight paragraphs.]

WHAT REMAINS OUTSTANDING
[State the specific outcome still required: ${caseItem.desired_outcome}. If their response partially addressed the matter, acknowledge what was done and state what remains.]

FINAL INTERNAL DEADLINE
[14 calendar days from today. State the exact deadline date. Then: "Failure to resolve this complaint will result in a formal complaint being lodged with ${escalationBody}."]

RULES:
- Do NOT retell the complaint — reference the first letter by date only.
- Do NOT cite legislation in detail.
- The regulator/ombudsman name must be exactly: ${escalationBody}. Never a generic placeholder. Never invented.
- No banned filler phrases. No hedging.
- Be direct: "You have failed to resolve this" not "I regret that the matter remains outstanding."
- Maximum length: 1 page.
- EVIDENCE EVOLUTION: Include the original evidence PLUS proof the complaint was ignored or inadequately answered (no response by the deadline, response that avoids key questions, response that denies without evidence).
- NO EMPTY THREATS: The escalation threat made in this letter WILL be enacted in the next letter if the deadline expires. Do not make threats you will not honour.
${contextBlock}
${formatRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  LETTER 3 — FINAL COMPLAINT
  //  Pressure: 9/10 | Tone: Very firm, final
  //  Purpose: Final opportunity. No polite requests. Escalation is imminent.
  // ═══════════════════════════════════════════════════════════════════════
  if (type === "letter3") {
    return `You are a professional consumer dispute strategist with 30 years of experience. Write the THIRD AND FINAL formal complaint letter from the complainant to the organisation.

TONE: Very firm. Final. Pressure: 9/10.
No more polite requests. No "I may". No "I am considering". This is the last internal communication before external escalation. The internal complaint process ends with this letter.

STRATEGIC ANALYSIS (determine before writing):
- What changed since the second letter? (Did the 14-day deadline expire? Did they respond again? Did they continue to avoid the issues?)
- What has the organisation failed to do? (Failed to meet the deadline, failed to address the issues, failed to comply with their own complaints process)
- What new evidence exists? (Evidence the internal complaint process has failed — expired deadlines, inadequate responses, continued non-compliance)
- What pressure should now be applied? (Maximum — this is the final demand, no more negotiation)
- What outcome is this letter trying to achieve? (Force compliance or create the definitive record that internal resolution has been exhausted)

ACCOUNTABILITY RULE: This letter MUST begin by acknowledging that the organisation failed to meet the deadline set in the previous letter. Do NOT re-threaten — state what has already happened. Open with: "As you failed to resolve this matter within the deadline provided in my letter dated [date], this is your final notice before my complaint is lodged."

HONOUR YOUR DEADLINES: The second letter threatened escalation to ${escalationBody} if the 14-day deadline expired. That deadline has now expired. Do NOT repeat the threat — state that the consequence is now imminent. The reader should feel that every letter closes another escape route. By the time they receive this letter, it should be obvious they had multiple genuine opportunities to resolve the matter and chose not to.

OBJECTIVE: Final internal demand. No more discussion. No more negotiation. The internal complaint process ends here. Provide one final 7-day deadline. State that once it expires, the complaint WILL be lodged with ${escalationBody}. Maximum length: 1 page.

MANDATORY STRUCTURE (use these exact headings on their own line, uppercase, no colon):

FINAL NOTICE
[Open by stating the organisation failed to meet the previous deadline: "As you failed to resolve this matter within the deadline provided in my letter dated [date], this is your final notice before my complaint is lodged." Then: "You have failed to resolve this matter despite multiple opportunities." "This is your final opportunity." 2–3 sentences maximum.]

OUTSTANDING FAILURES
[Bullet-point list of what remains outstanding. Each bullet: one issue, one sentence. No repetition of full history — just what is still wrong. Be specific: amounts still owed, questions still unanswered, failures still unaddressed.]

FINAL DEADLINE
[7 calendar days from today. State the exact deadline date. Then state unequivocally: "If compliance is not received by the above date, I WILL lodge my complaint with ${escalationBody} without further notice."]

RULES:
- NEVER use the words: "may", "might", "considering", "intend". Use "WILL" in every escalation statement.
- Do NOT restate the full dispute — this letter is about the organisation's failure to resolve, not the original issue.
- Do NOT cite legislation.
- Do NOT use any banned filler phrases. No "I respectfully". No "I appreciate". No "I trust".
- Keep it short and definitive. This letter should make it obvious the internal process has ended.
- The escalation body must be exactly: ${escalationBody}. Never invented. Never generic.
- Maximum length: 1 page.
- EVIDENCE EVOLUTION: Include everything from previous letters PLUS evidence demonstrating the internal complaint process has failed — expired deadlines, ignored correspondence, inadequate responses, continued non-compliance.
- NO EMPTY THREATS: The escalation threatened in the second letter has now become imminent. Do not re-threaten — state that the deadline has expired and escalation is the next step.
${contextBlock}
${formatRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ESCALATION LETTER
  //  Pressure: 10/10 | Emotion: 0/10 | Audience: The external regulator
  //  Purpose: Professional submission — facts, evidence, chronology
  // ═══════════════════════════════════════════════════════════════════════
  if (type === "escalation") {
    return `You are a professional consumer dispute strategist with 30 years of experience. Write a formal ESCALATION submission from the complainant to ${escalationBody}.

AUDIENCE CHANGE: The recipient is now the external regulator — ${escalationBody} — NOT the organisation. The tone changes completely from the prior complaint letters.

TONE: Professional submission. Factual. Pressure: 10/10. Emotion: 0/10.
This is an investigation brief — not a complaint letter. Do NOT attack the organisation. Do NOT use sarcasm. Do NOT use threats. No accusations beyond what the evidence supports. Present facts. Present evidence. Present chronology. Nothing else.

STRATEGIC ANALYSIS (determine before writing):
- What is the complete chronology of the dispute from incident to escalation?
- What did the organisation do or fail to do at each stage of the internal complaint process?
- What evidence demonstrates a clear pattern of conduct?
- What issues remain unresolved that require investigation by the regulator?
- What outcome is the complainant seeking from the regulator?

OBJECTIVE: Present the evidence. Provide ${escalationBody} with a complete investigation brief covering: background, chronology, internal complaint history, evidence, issues requiring investigation, and the outcome sought. The chronology must demonstrate a clear pattern of conduct supported by evidence, without exaggeration or repetition.

MANDATORY STRUCTURE (use these exact headings on their own line, uppercase, no colon):

BACKGROUND
[Who the complainant is, who the dispute is with (${caseItem.organisation_name}), the nature of the dispute, and why the complainant is contacting ${escalationBody}. 1–2 paragraphs.]

CHRONOLOGY
[Bullet-point timeline of key events: incident date, first complaint sent and response (or lack thereof), second complaint, third/final complaint, current status. Use actual dates from the prior correspondence section. No commentary — just dates and events.]

INTERNAL COMPLAINT HISTORY
[Summary of the internal complaint process: how many complaints were sent, when, and the organisation's response or failure to respond at each stage. Factual — no characterisation of conduct as "bad faith" or "deliberate".]

EVIDENCE
[Bullet list of each document on file and what it demonstrates. Factual descriptions only — "Bank statement dated [date] showing [amount]" not "Damning proof of their deception".]

ISSUES REQUIRING INVESTIGATION
[What remains unresolved. What the organisation has failed to address. Factual statements only — "The organisation has not responded to the question of..." not "They are clearly hiding something." No accusations beyond what the evidence supports.]

OUTCOME SOUGHT
[Specific remedy sought from ${escalationBody}: ${caseItem.desired_outcome}. State clearly what the complainant is asking the regulator to investigate or order.]

RULES:
- Address the letter to: The Complaints Officer, ${escalationBody}.
- Do NOT characterise the organisation's conduct emotionally — state facts and let the evidence speak.
- Do NOT cite legislation unless directly relevant and accurately referenced.
- Present as a professional submission, not a complaint letter.
- Every paragraph must be factual. No opinions. No "I believe they deliberately..." — instead: "The organisation did not respond to the complaint dated [date]."
- The recipient must be exactly: ${escalationBody}. Never invented. Never substituted.
- EVIDENCE EVOLUTION: Include the complete evidence package in chronological order — every document on file, each with a factual description of what it demonstrates. This is the full record for the regulator.
- PATTERN OF CONDUCT: The chronology and evidence must demonstrate a clear pattern of conduct — multiple missed deadlines, ignored correspondence, inadequate responses — without exaggeration or repetition. Let the facts establish the pattern.
${contextBlock}
${formatRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ACCEPT OFFER LETTER
  //  Tone: Professional, appreciative | Purpose: Record agreement, close dispute
  // ═══════════════════════════════════════════════════════════════════════
  if (type === "accept_offer") {
    return `You are a professional consumer dispute strategist with 30 years of experience. Write a letter from the complainant FORMALLY ACCEPTING a settlement offer from the organisation.

TONE: Professional, appreciative. The dispute is being resolved. This letter formally records the agreement and closes the matter. Not effusive — genuine and precise.

OBJECTIVE: Thank the organisation for resolving the matter. Clearly record: what has been agreed, payment amount, settlement terms, completion date, and any remaining obligations. Formally close the dispute upon completion.

MANDATORY STRUCTURE (use these exact headings on their own line, uppercase, no colon):

ACKNOWLEDGEMENT
[Acknowledge the offer received. Reference the offer details — date, amount, terms. Thank the organisation for resolving the matter. One paragraph. Professional and genuine, not effusive.]

TERMS ACCEPTED
[State the exact terms being accepted: payment amount, method, timeline, any non-financial obligations. Be precise — this letter creates a binding record. Use the desired outcome as the basis: ${caseItem.desired_outcome}.]

COMPLETION
[State the completion date by which the terms must be fulfilled. State that upon full performance, the dispute is considered fully resolved and no further action will be taken. State that if the terms are not fulfilled by the completion date, the complainant reserves the right to reopen the matter and escalate to ${escalationBody}.]

RULES:
- Professional and appreciative — but still precise and binding.
- Do NOT restate the complaint history. This is about the resolution, not the dispute.
- Do NOT cite legislation.
- No banned filler phrases.
- Keep it concise — this is a closure letter, not a complaint.
${contextBlock}
${formatRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DENY OFFER LETTER
  //  Tone: Extremely firm, confident, assertive | This is a REJECTION, not a complaint
  // ═══════════════════════════════════════════════════════════════════════
  if (type === "deny_offer") {
    return `You are a professional consumer dispute strategist with 30 years of experience. Write a letter from the complainant REJECTING an unsatisfactory settlement offer from the organisation.

TONE: Extremely firm. Confident. Highly assertive. Pressure: 8/10. This is NOT another complaint letter — this is a rejection. No hesitation. No uncertainty. No begging. No repeated complaint paragraphs.

OBJECTIVE: Reject the offer. Not another complaint. Explain why the offer fails with evidence already on file. Then proceed to escalation. Never invent new allegations.

MANDATORY STRUCTURE (use these exact headings on their own line, uppercase, no colon):

OFFER RECEIVED
[Acknowledge receipt of the offer. State the offer amount and date. One paragraph only — do not restate the complaint.]

WHY IT IS REJECTED
[State clearly: "I do not accept this offer." Then explain precisely why. Use these exact statements where applicable, followed by specific evidence:
- "The offer does not adequately resolve the issues raised."
- "The evidence provided has not been properly addressed."
- "The proposed resolution fails to compensate the losses incurred."
Reference specific evidence on file, specific unresolved losses, specific unanswered questions. Be precise about each deficiency. Never invent new allegations — every reason must be supported by evidence already contained within the case.]

EVIDENCE NOT ADDRESSED
[Bullet-point list of what the offer fails to address: missing compensation, unanswered questions, unaddressed evidence. Each bullet: one issue, one sentence, tied to a specific document on file. Factual.]

NEXT STEP
[State: "As this matter remains unresolved, I will now proceed with my complaint to ${escalationBody}." No "may". No "considering". Proceeding.]

RULES:
- This is a REJECTION, not a complaint. Do not re-complain about the original issue.
- Do NOT cite legislation.
- Reference evidence specifically — "The statement dated [date] shows [amount] was incorrectly charged. The offer does not address this."
- Never invent new allegations — every reason for rejection must be supported by evidence already contained within the case.
- Do NOT use filler, hedging, or polite deferral.
- The escalation body must be exactly: ${escalationBody}. Never invented.
- Conclude with: "As this matter remains unresolved, I will now proceed with my complaint to ${escalationBody}."
${contextBlock}
${formatRules}`;
  }

  return `${contextBlock}\n${formatRules}`;
}

const GENERATE_PHASES = [
  "Preparing case facts…",
  "Reviewing evidence…",
  "Drafting letter…",
  "Saving letter…",
  "Almost done…",
];

const HARD_TIMEOUT_MS = 130000; // 130 seconds — backend AI responses are regularly taking 87–107s in production

function LetterEditor({ letterType, caseItem, evidence }) {
  const queryClient = useQueryClient();
  const field = letterType.field;
  const [text, setText] = useState(caseItem[field] || "");
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState(GENERATE_PHASES[0]);
  const [generateError, setGenerateError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [emailOpen, setEmailOpen] = useState(false);
  const [markSentOpen, setMarkSentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timedOutRef = React.useRef(false);
  const abortControllerRef = React.useRef(null);
  const letterDocRef = React.useRef(null);

  // Elapsed timer — ticks every second while generating
  useEffect(() => {
    if (!generating) { setElapsedSeconds(0); return; }
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [generating]);

  // Sync text from caseItem when the field or caseItem updates (fixes all-tabs-same-letter bug)
  // Also clears the timeout sentinel if the backend saved the letter while we were waiting
  useEffect(() => {
    const newText = caseItem[field] || "";
    setText(newText);
    if (newText && generateError === "__timeout__") {
      setGenerateError(null);
      toast.success(`${letterType.label} generated`);
    }
  }, [caseItem.id, field, caseItem[field]]);

  // Load last send log for this letter for status badge
  const { data: emailLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['emailLogs', caseItem?.id, letterType?.key],
    queryFn: () => base44.entities.EmailLog.filter({ case_id: caseItem?.id, letter_type: letterType?.key }),
    enabled: !!caseItem?.id,
  });
  const lastLog = emailLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  // Stamp complaint sent timestamp and progress stage when a letter is emailed
  const handleLetterSent = async () => {
    await markLetterSent(caseItem, letterType.key, {
      sentDate: new Date().toISOString(),
      method: "email",
      recipientEmail: caseItem.organisation_complaints_email || "",
      manuallyMarkedSent: false,
    });
    queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
    queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.id] });
  };

  const handleApplyTemplate = async (content) => {
    setText(content);
    try {
      await updateMutation.mutateAsync({ [field]: content });
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
    } catch {
      toast.error("Failed to save template. Please try again.");
    }
    setEditing(false);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Null out only this letter's field — all other case data untouched
      await base44.entities.Case.update(caseItem.id, { [field]: null });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      toast.success(`${letterType.label} deleted`);
    } catch (e) {
      toast.error("Failed to delete letter: " + e.message);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleGenerate = async () => {
    if (generating) return; // Block duplicate clicks
    console.log(`[LetterGen] START — letter: ${letterType.key}, case: ${caseItem.id}`);

    // Reset timeout ref — must happen before any awaits
    timedOutRef.current = false;

    // Abort any previous in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setGenerating(true);
    setGenerateError(null);

    // Phase ticker — cycles through all 5 phases across 60s window (~12s each)
    let phaseIndex = 0;
    setGenerateStatus(GENERATE_PHASES[0]);
    const phaseTicker = setInterval(() => {
      phaseIndex = Math.min(phaseIndex + 1, GENERATE_PHASES.length - 1);
      setGenerateStatus(GENERATE_PHASES[phaseIndex]);
    }, 24000); // 24s per phase × 5 phases = 120s coverage window

    // Hard timeout — backend saves to DB directly, so on timeout we just refresh the case
    // rather than showing an error (the letter may already be saved by the backend)
    const hardTimeout = setTimeout(async () => {
      timedOutRef.current = true;
      clearInterval(phaseTicker);
      setGenerating(false);
      setGenerateStatus("");
      console.warn(`[LetterGen] TIMEOUT — exceeded ${HARD_TIMEOUT_MS / 1000}s, letter: ${letterType.key} — refreshing case in case backend saved`);
      // Refresh the case — if the backend completed and saved, the letter will appear
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      // Show a soft notice rather than an error — not a failure, just slow
      setGenerateError("__timeout__");
    }, HARD_TIMEOUT_MS);

    try {
      const client = buildClientContext(caseItem, evidence);
      const today = format(new Date(), "d MMMM yyyy");
      const prompt = buildPrompt(letterType.key, caseItem, client, today, evidence);

      console.log(`[LetterGen] Payload — caseId: ${caseItem.id}, letter: ${letterType.key}, promptBytes: ${new Blob([prompt]).size}, evidenceCount: ${(evidence||[]).length}`);
      console.log(`[LetterGen] Backend request sent — ${letterType.key} @ ${new Date().toISOString()}`);

      const aiStart = Date.now();
      const response = await base44.functions.invoke('generateLetter', { prompt, caseId: caseItem.id, letterType: letterType.key });
      const aiMs = Date.now() - aiStart;

      // Discard if timeout already fired — backend saved it, the query refresh will pick it up
      if (timedOutRef.current) {
        console.warn(`[LetterGen] Late response arrived after timeout (${aiMs}ms) — backend saved, query refresh will render it`);
        queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
        return;
      }

      // Backend reported another request is already generating — stay in loading state
      if (response.data?.existing) {
        console.log(`[LetterGen] Already generating on backend — waiting`);
        setGenerateStatus("Already generating on server — please wait…");
        // Keep spinner running; the case query refresh on timeout will surface the result
        return;
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      const result = response.data?.result;
      console.log(`[LetterGen] Response — length: ${result?.length ?? 0}, aiMs: ${response.data?.aiMs ?? '?'}, totalMs: ${aiMs}`);

      if (!result || !result.trim()) {
        throw new Error("AI returned empty content. Please try again.");
      }

      // Backend already saved to DB — update local state and invalidate
      setText(result);
      // Regenerated content is fresh against the current pathway — clear any stale flag for this letter
      if (caseItem.stale_letters?.includes(letterType.key)) {
        await base44.entities.Case.update(caseItem.id, {
          stale_letters: caseItem.stale_letters.filter((k) => k !== letterType.key),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      setGenerateError(null);
      toast.success(`${letterType.label} generated`);
      console.log(`[LetterGen] DONE — ${letterType.key}`);
    } catch (e) {
      // Swallow AbortError and any error that fires after timeout
      if (timedOutRef.current || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;

      const httpStatus = e.response?.status;
      const serverMsg = e.response?.data?.error || e.response?.data?.message;
      console.error(`[LetterGen] ERROR —`, { message: e.message, httpStatus, serverMsg });

      // Show friendly message — never expose provider/server error details to users
      const isTransient = httpStatus === 502 || httpStatus === 503 || httpStatus === 504 ||
        e.message?.includes('502') || e.message?.includes('503') || e.message?.includes('timeout') ||
        e.message?.includes('network') || e.message?.includes('ECONNRESET');
      const displayError = (serverMsg && !serverMsg.match(/502|503|504|upstream|provider|network/i))
        ? serverMsg
        : isTransient
          ? 'AI service was temporarily unavailable. Your case is safe. Please retry.'
          : 'Letter generation failed. Your case is safe. Please retry.';
      setGenerateError(displayError);
    } finally {
      // Only clean up spinner if timeout hasn't already done it
      if (!timedOutRef.current) {
        clearInterval(phaseTicker);
        clearTimeout(hardTimeout);
        setGenerating(false);
        setGenerateStatus("");
      }
    }
  };

  const letterFilename = `${String(letterType.label).replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  const handleDownloadPDF = async () => {
    pdfDiagStart({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!text });
    if (!text || !text.trim()) { pdfDiagMissingData({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', dataName: 'letter content (generate letter first)' }); return; }
    if (!letterDocRef.current) { pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', error: new Error('Letter preview not mounted') }); return; }
    try {
      const blob = await captureLetterDocumentPDF(letterDocRef.current, { caseId: caseItem?.id });
      pdfDiagBlobCreated({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', blob });
      downloadPDFBlob(blob, letterFilename);
      pdfDiagSuccess({ tab: `Letter: ${letterType.label}`, action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', error });
    }
  };

  const handlePrintPDF = async () => {
    pdfDiagStart({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!text });
    if (!text || !text.trim()) { pdfDiagMissingData({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', dataName: 'letter content (generate letter first)' }); return; }
    if (!letterDocRef.current) { pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', error: new Error('Letter preview not mounted') }); return; }
    try {
      const blob = await captureLetterDocumentPDF(letterDocRef.current, { caseId: caseItem?.id });
      pdfDiagBlobCreated({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, letterFilename);
      if (!opened) { toast.error(PRINT_BLOCKED_MESSAGE); downloadPDFBlob(blob, letterFilename); }
      pdfDiagSuccess({ tab: `Letter: ${letterType.label}`, action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', error });
    }
  };

  const hasPlaceholders = /\[Your Name\]|\[Your Address\]|\[.*?\]/.test(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <h3 className="font-heading font-semibold text-foreground" style={{ fontSize: "12pt" }}>{letterType.label}</h3>
            <p className="text-xs text-muted-foreground" style={{ fontSize: "10pt" }}>{letterType.description}</p>
          </div>
          {/* Send status badge */}
          {lastLog && (
            lastLog.status === 'sent' ? (
              <Badge className="bg-green-500/15 text-green-700 border-green-500/30 gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3" />
                Sent {lastLog.sent_at ? format(new Date(lastLog.sent_at), "d MMM") : ''}
              </Badge>
            ) : lastLog.status === 'failed' ? (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1 text-[10px]">
                <XCircle className="w-3 h-3" />
                Failed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Pending</Badge>
            )
          )}
          {!lastLog && text && (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">Not Sent</Badge>
          )}
          {caseItem[LETTER_SENT_FIELD_MAP[letterType.key]] && caseItem.letter_tracking?.[letterType.key]?.manuallyMarkedSent && (
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px] gap-1">
              <CalendarClock className="w-3 h-3" />
              Marked sent {format(new Date(caseItem[LETTER_SENT_FIELD_MAP[letterType.key]]), "d MMM yyyy")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <LetterTemplateManager
            letterType={letterType.key}
            currentText={text}
            onApplyTemplate={handleApplyTemplate}
          />
          <Button
            variant="outline" size="sm"
            onClick={() => setMarkSentOpen(true)}
            className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            {caseItem[LETTER_SENT_FIELD_MAP[letterType.key]] ? "Change Sent Date" : "Mark as Sent"}
          </Button>
          {text && (
            <>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }} className="gap-1.5 text-xs">
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintPDF} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setEmailOpen(true)}
                className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
              >
                <Mail className="w-3.5 h-3.5" /> Send Email
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={async () => {
                  if (editing) {
                    try {
                      await updateMutation.mutateAsync({ [field]: text });
                      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
                      toast.success("Letter saved");
                    } catch {
                      toast.error("Failed to save. Please try again.");
                      return;
                    }
                  }
                  setEditing(!editing);
                }}
                className="gap-1.5 text-xs"
              >
                {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                {editing ? "Save" : "Edit"}
              </Button>
            </>
          )}
          {text && (
            <Button
              variant="outline" size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting || generating}
              className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </Button>
          )}
          <Button
            size="sm"
            onClick={text ? () => setRegenConfirmOpen(true) : handleGenerate}
            disabled={generating || deleting}
            className="gap-1.5 text-xs min-w-[140px]"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {generating ? "Generating…" : (text ? "Regenerate" : "Generate Letter")}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-xs text-primary font-medium flex items-center gap-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="flex-1">{generateStatus}</span>
          <span className="font-mono text-primary/70 tabular-nums">
            {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {generateError === "__timeout__" && !generating && !text && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-xs text-warning-foreground flex items-center justify-between gap-3">
          <span>⏳ Still generating — the server is processing your letter. This page will update automatically when complete, or click Retry to try again.</span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 shrink-0" onClick={handleGenerate}>
            Retry
          </Button>
        </div>
      )}
      {generateError && generateError !== "__timeout__" && !generating && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-xs text-destructive flex items-center justify-between gap-3">
          <span>⚠️ {generateError}</span>
          <Button size="sm" variant="destructive" className="h-7 text-xs px-3 shrink-0" onClick={handleGenerate}>
            Retry
          </Button>
        </div>
      )}

      {hasPlaceholders && !generating && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-xs text-destructive font-medium">
          ⚠️ Placeholder text detected. Click Regenerate to fill with your real case details.
        </div>
      )}

      {caseItem.stale_letters?.includes(letterType.key) && !generating && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-xs text-warning-foreground font-medium flex items-center justify-between gap-3">
          <span>⚠️ This letter may reference an outdated escalation authority. Click Regenerate to update it to {caseItem.escalation_body || "the current assigned authority"}.</span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 shrink-0" onClick={() => setRegenConfirmOpen(true)}>
            Regenerate
          </Button>
        </div>
      )}

      {/* Last failed send detail */}
      {lastLog?.status === 'failed' && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5 text-xs text-destructive flex items-center justify-between gap-2">
          <span><strong>Send failed:</strong> {lastLog.error_message || 'Unknown error'}</span>
          <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={() => setEmailOpen(true)}>
            Retry
          </Button>
        </div>
      )}

      {text ? (
        <div className="overflow-hidden rounded-lg shadow-sm border border-border">
          {editing ? (
            <div className="bg-white p-4">
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={18}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5" }}
              />
            </div>
          ) : (() => {
            const client = buildClientContext(caseItem, evidence);
            const { receiverLines, senderLines, today } = buildLetterHeaderData(caseItem, client);
            return (
              <LetterPreviewWrapper>
                <div ref={letterDocRef}>
                  <LetterDocument
                    receiverLines={receiverLines}
                    senderLines={senderLines}
                    today={today}
                    reSubject={getLetterReSubject(letterType.key, caseItem.organisation_name)}
                    bodyText={text}
                  />
                </div>
              </LetterPreviewWrapper>
            );
          })()}
        </div>
      ) : (
        <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-10 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No {letterType.label} generated yet.</p>
          <p className="text-xs text-muted-foreground mb-4">Upload evidence and complete your timeline before generating.</p>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? "Generating..." : `Generate ${letterType.label}`}
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. You can generate a new one afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Delete Letter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate confirmation */}
      <AlertDialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate this letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current version with a newly generated one. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setRegenConfirmOpen(false); handleGenerate(); }}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email send dialog */}
      <LetterEmailDialog
        open={emailOpen}
        onClose={() => { setEmailOpen(false); refetchLogs(); }}
        onSent={handleLetterSent}
        caseItem={caseItem}
        letterType={letterType}
        letterText={text}
        letterDocRef={letterDocRef}
        evidence={evidence}
      />

      {/* Mark as sent / retrospective sent date dialog */}
      <MarkSentDialog
        open={markSentOpen}
        onClose={() => setMarkSentOpen(false)}
        caseItem={caseItem}
        letterType={letterType}
      />
    </div>
  );
}

export default function LetterSuite({ caseItem }) {
  const { user } = useAuth();

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", caseItem.id],
    queryFn: () => base44.entities.Evidence.filter({ case_id: caseItem.id }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const subscription = getActiveSubscription(user, payments);

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Letter Suite</span> — Generate each letter as your dispute progresses.
          Start with the 1st Complaint. Move to 2nd/3rd if unresolved. Use Accept/Deny Offer letters when a settlement is proposed.
          Use the Escalation Letter to lodge with {caseItem.escalation_body || getEscalationBodyLabel(getComplaintPathway({ category: caseItem.category, state: caseItem.state, context: { text: `${caseItem.issue_summary || ""} ${caseItem.issue_details || ""}`, hasCivilClaimPathway: !!caseItem.has_civil_claim_pathway } }))}.
        </p>
      </div>

      <Tabs defaultValue="letter1">
        <TabsList className="flex-wrap h-auto gap-1">
          {LETTER_TYPES.map(lt => {
            const locked = !hasPlanAccess(subscription, lt.minPlan);
            const hasContent = !!caseItem[lt.field];
            // Sent = EmailLog with status 'sent' exists — checked via caseItem context not available here,
            // so we derive: no content = grey dot, has content = green dot (sent is shown inside the editor)
            return (
              <TabsTrigger key={lt.key} value={lt.key} className="text-xs gap-1">
                {locked && <Lock className="w-3 h-3 opacity-60" />}
                {lt.label}
                {!locked && (
                  hasContent
                    ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" title="Generated" />
                    : <span className="ml-1 w-1.5 h-1.5 rounded-full bg-gray-400/50 inline-block" title="Not generated" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {LETTER_TYPES.map(lt => {
          const locked = !hasPlanAccess(subscription, lt.minPlan);
          return (
            <TabsContent key={lt.key} value={lt.key} className="mt-4">
              {locked ? (
                <div className="bg-secondary/30 border border-dashed border-border rounded-xl p-10 text-center">
                  <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">{lt.label} — {lt.minPlan} Plan Required</p>
                  <p className="text-sm text-muted-foreground mb-4">{lt.description}</p>
                  <Link to="/payments">
                    <Button size="sm" className="gap-2">Upgrade to {lt.minPlan}</Button>
                  </Link>
                </div>
              ) : (
                <LetterEditor letterType={lt} caseItem={caseItem} evidence={evidence} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}