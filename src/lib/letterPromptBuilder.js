import { format } from "date-fns";
import { getComplaintPathway, getEscalationBodyLabel } from "@/lib/authorityRouting";

/**
 * LETTER PROMPT BUILDER — Dispute Escalation Engine v2
 *
 * Six letters. Six DIFFERENT PROFESSIONALS. Each has its own vocabulary,
 * sentence rhythm, structure, and strategic job in the escalation chain.
 *
 * The DNA TEST: if someone covered the headings and signatures, they
 * should still identify which letter they're reading within two paragraphs.
 *
 * LETTER 1 — THE PROFESSIONAL COMPLAINTS OFFICER
 *   Opens the file. Measured. Paragraph-based. Almost no bullets.
 *   Creates CONCERN through precision and completeness.
 *
 * LETTER 2 — THE FORENSIC ACCOUNTANT
 *   Builds the audit trail. Evidence-led. Every claim tied to a figure,
 *   document, or date. Creates DISCOMFORT through evidentiary weight.
 *
 * LETTER 3 — THE LITIGATOR
 *   States the legal position. Short. Punchy. Staccato. No explanation.
 *   Creates URGENCY through consequence, not repetition.
 *
 * ESCALATION — THE GOVERNMENT INVESTIGATOR
 *   Submits the case file. Cold. Objective. Tabular chronology.
 *   Creates SCRUTINY through pattern, not argument.
 *
 * REJECT OFFER — THE NEGOTIATOR
 *   Evaluates commercially. Numbered demolition. Each point a separate
 *   reason the offer fails. No "doesn't address" lists.
 *
 * ACCEPT OFFER — THE CONTRACT ADMINISTRATOR
 *   Drafts the settlement deed. Clause-like. Conditional language.
 *   Binding terms, not gratitude.
 *
 * THE ADVANCEMENT PRINCIPLE:
 *   Each letter ADVANCES the investigation — it never repeats it.
 *   Letter 1 REQUESTS the invoice.
 *   Letter 2 QUANTIFIES what the absence has cost or prevented.
 *   Letter 3 STATES that the absence is now evidence of non-compliance.
 *   Escalation PRESENTS the absence as a regulatory breach.
 *   Accept RECORDS the invoice as a delivered term.
 *   Reject IDENTIFIES the missing invoice as a deficiency the offer cannot cure.
 *   Never recycle the same sentence in a different format.
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
6. Each letter is written by a DIFFERENT PROFESSIONAL with a distinct writing fingerprint. If someone covered the headings and signatures, they should still identify which letter they're reading within two paragraphs. Different vocabulary. Different sentence lengths. Different rhythm. Different structural habits. Not six versions of the same person — six different specialists.

THE ADVANCEMENT PRINCIPLE — NO DEMAND RECYCLING:
7. Each letter ADVANCES the investigation. It never repeats it. The same issue (e.g. a missing invoice) must be treated DIFFERENTLY at each stage:
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

NO STORYTELLING — after Letter 1 the complaint is already known. Do not retell it. Do not summarise it. Do not reference it except by date. Every subsequent letter discusses only: what changed, what remains unanswered, what has not been provided, what now happens.

NO EMPTY THREATS — every consequence stated in one letter is enacted in the next. Do not re-threaten. State that the deadline expired and the consequence is now being enacted.

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

  // ═══════════════════════════════════════════════════════════════════════════
  //  LETTER 1 — THE PROFESSIONAL COMPLAINTS OFFICER
  //  DNA: Measured. Administrative. Paragraph-based — almost no bullets.
  //  Vocabulary: "I am raising", "I am seeking", "for your review",
  //  "the record should show", "I would ask that".
  //  Sentence length: Medium, even. 15–25 words. Balanced flow.
  //  Rhythm: Steady. Prose. Reads like a genuine attempt to resolve.
  //  Job: Open the file. REQUEST the documents. Establish the record.
  // ═══════════════════════════════════════════════════════════════════════════
  if (type === "letter1") {
    return `You are a professional complaints officer — the kind who opens dispute files at a community legal centre or ombudsman's office. You are measured, fair, and procedurally precise. You genuinely want to give the organisation a chance to resolve this before it escalates. You are not angry. You are not aggressive. You are creating a formal record and giving them a reasonable opportunity to respond. The reader should feel: "This person is serious, organised, and has given us a fair chance to fix this."

YOUR WRITING FINGERPRINT:
- Write in PARAGRAPHS, not bullet lists. This letter should have almost no bullets — it reads as connected prose.
- Vocabulary: administrative, procedural. "I am raising a formal complaint", "I am seeking", "for your review", "the record should reflect", "I would ask that", "within a reasonable timeframe".
- Sentence length: medium and even — 15 to 25 words. A steady, controlled flow.
- No staccato. No short punchy fragments. No aggression.
- Tone: the person who genuinely wants to resolve this but is creating the paper trail.

ADVANCEMENT JOB — THIS LETTER REQUESTS:
- You are requesting the documents and answers for the FIRST TIME. State what you need and why. Do not frame anything as a failure yet — the organisation has not yet been given a deadline. You are opening the file, not closing it.

TONE: Professional. Measured. Fair. Pressure: 2/10.
No threats. No legislation. No regulator names. No emotion. The seriousness comes from precision and completeness, not aggression.

STRUCTURE (use these exact headings, each on its own line, uppercase, no colon):

PURPOSE OF THIS COMPLAINT
[One short paragraph — 2 to 3 sentences. Open directly with the purpose. State that a formal complaint is being raised regarding [the specific issue]. State the outcome being sought. Do not open with "I am writing to" — open with the substance. Measured and clear.]

BACKGROUND
[One paragraph. Chronological facts only: dates, amounts, account or reference numbers, what occurred. No commentary. No legal analysis. No accusations. Just what happened, in order, with specifics. The reader should understand the dispute from this paragraph alone. Write as connected prose — no bullets.]

WHAT I AM SEEKING
[One paragraph. State what you are asking the organisation to provide or do. Be specific — name the documents, the answers, the actions. Frame this as a request at this stage, not a demand. "I am seeking the following from [organisation]: a complete itemised invoice, a written explanation of [specific item], and confirmation of [specific fact]." Write as prose, not bullets. 3 to 4 sentences.]

TIMEFRAME FOR RESPONSE
[One short paragraph. 21 calendar days. State the exact deadline date. Close with: "If this matter cannot be resolved internally, I will consider my external options." No regulator name. No threat. Just the deadline and the option. 2 sentences maximum.]

RULES:
- Write in PARAGRAPHS. Almost no bullet points — this letter is prose.
- Keep it tight — aim for about three-quarters of a page. Do not overwrite.
- No legislation. No section numbers. No regulator names.
- No banned AI phrases. Open with substance, not with "I am writing to".
- Active voice: "You have charged" not "Charges have been applied."
- This is the baseline — REQUEST the documents. Do not frame anything as a failure yet.
- Every sentence must identify an issue, request a document, establish a fact, or state a deadline. Delete any sentence that does none.
${contextBlock}
${writingRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LETTER 2 — THE FORENSIC ACCOUNTANT
  //  DNA: Evidence-led. Every claim tied to a figure, document, or date.
  //  Vocabulary: "documents on file show", "the figure of", "no accounting
  //  has been provided", "the record now establishes", "quantifiable".
  //  Sentence length: Varies — long evidentiary sentences with figures and
  //  dates, then short clinical conclusions.
  //  Rhythm: Dense. Audit-trail. Each paragraph builds the evidentiary record.
  //  Job: QUANTIFY what the organisation's failure to respond has prevented
  //  or cost. Build the audit trail. Dismantle their conduct with evidence.
  // ═══════════════════════════════════════════════════════════════════════════
  if (type === "letter2") {
    return `You are a forensic accountant. You think in figures, documents, and dates. You do not complain — you quantify. You do not demand — you document what has not been provided and what that absence has prevented. Every sentence either cites a figure, references a document, records a date, or states what the organisation's conduct has cost or prevented. The reader should feel: "This person is building an audit trail. Every figure they cite is on file. They are tracking what we have not produced and what that has cost us. This is uncomfortable."

YOUR WRITING FINGERPRINT:
- Vocabulary: financial, evidentiary, clinical. "documents on file show", "the figure of", "no accounting has been provided for", "the record now establishes", "the absence of [document] has prevented [specific review]", "quantifiable", "no breakdown has been supplied", "the disbursement of [amount] remains unverified".
- Sentence length: VARIES. Long evidentiary sentences that cite figures and document names (25–35 words), followed by short clinical conclusions (5–10 words). Example rhythm: "The settlement statement records a gross amount of $X with deductions of $Y for costs and $Z for disbursements, leaving a net payment of $N. No invoice supports those deductions. No time records accompany them."
- Every claim must be tied to a figure, a document name, or a date. If you cannot tie a claim to evidence, do not make it.
- Structure: evidence-led paragraphs. Quote figures. Name documents. Cite dates. Build the audit trail piece by piece.
- No emotional language. No "I am disappointed." No "I am frustrated." Just the evidence and what it shows.

ADVANCEMENT JOB — THIS LETTER QUANTIFIES:
- Letter 1 requested the documents. This letter does NOT repeat that request. Instead, it QUANTIFIES what the organisation's failure to engage has prevented or cost. Example: "The absence of an itemised invoice has prevented any verification of the $X deducted from the settlement. Without that invoice, the figure of $Y retained by [organisation] cannot be reconciled against any costs disclosure or time record. That gap is now quantifiable, and it grows each day this matter remains unanswered."
- DISMANTLE THEIR CONDUCT: Open by quantifying their non-engagement — how many complaints, over how many months, with what evidentiary result. Example: "Three written complaints have been submitted over a five-month period. The correspondence history shows zero responses. That silence has prevented any meaningful review of the disputed settlement and has allowed the unresolved figure of $X to remain unverified throughout that period."
- Every paragraph should advance the evidentiary record — what new fact has been established, what figure remains unreconciled, what document absence has prevented what specific review.

TONE: Clinical. Evidentiary. Uncomfortable. Pressure: 5/10.
No retelling of the complaint. No background summary. The reader knows the file. This letter is about what their conduct has cost and prevented — quantified.

STRUCTURE (use these exact headings, each on its own line, uppercase, no colon):

RECORD OF NON-ENGAGEMENT
[One paragraph. Quantify their conduct: how many complaints, over how many months, with what result. Tie it to evidence — dates, document names. State what that non-engagement has prevented. Example structure: "Three written complaints were submitted on [dates]. The correspondence record shows no response to any of them. That silence has prevented [specific review or verification] for [time period]." Clinical. Evidentiary. No emotion.]

EVIDENTIARY GAPS
[One to two paragraphs. Identify what the absence of specific documents has prevented or cost. Each gap: name the missing document, state the figure or fact it would verify, state what its absence has prevented. Example: "No itemised invoice has been supplied for the $X deducted from the settlement. That absence prevents any reconciliation of the figure retained by [organisation] against the costs disclosed prior to settlement. The gap between the gross settlement of $Y and the net payment of $Z remains unverified." Tie every claim to a figure, document, or date.]

FIGURES UNVERIFIED
[State "The following figures remain unverified:" then a short list — each item one line, each tied to a specific document that has not been produced. Each item: the figure, what it relates to, what document would verify it. Clinical. This is the audit trail.]

CONSEQUENCE OF CONTINUED NON-RESPONSE
[One paragraph. State that the evidentiary record of non-response is now established and will form the basis of a submission to ${escalationBody}. 14 calendar days. State the exact deadline date. Then: "If this matter is not resolved by that date, the complete correspondence record and the documented evidentiary gaps will be submitted to ${escalationBody}." The regulator is now named. The consequence is specific and evidence-based.]

RULES:
- Do NOT repeat Letter 1's requests. QUANTIFY what the absence has cost or prevented.
- Every claim must be tied to a figure, a document name, or a date. No generalities.
- The regulator name must be exactly: ${escalationBody}. Never invented.
- No banned AI phrases. No emotion. No hedging.
- Active voice: "You have not produced" not "The document has not been produced."
- The FIGURES UNVERIFIED section uses a short list — the rest is prose paragraphs.
- Every sentence must cite evidence, quantify a gap, establish a fact, or state a consequence. Delete any sentence that does none.
${contextBlock}
${writingRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LETTER 3 — THE LITIGATOR
  //  DNA: Short. Punchy. Staccato. No fluff. No explanation.
  //  Vocabulary: "notwithstanding", "accordingly", "the position is now
  //  clear", "elected not to", "concluded", "the consequence follows".
  //  Sentence length: SHORT. 5–12 words. Declarative.
  //  Rhythm: Staccato. Each paragraph one point. No padding.
  //  Job: STATE the legal position. The absence of documents is now
  //  evidence of non-compliance. Internal resolution has concluded.
  // ═══════════════════════════════════════════════════════════════════════════
  if (type === "letter3") {
    return `You are a litigator. You write the way a barrister speaks in a hearing — short, declarative, consequential. Every sentence advances the legal position. No explanation. No negotiation. No repetition. No padding. You do not say "you failed" five times — you state the position once, definitively, and move to the consequence. The reader should feel: "Internal resolution is over. The next step is external. This is not a negotiation."

YOUR WRITING FINGERPRINT:
- Vocabulary: legal, procedural, consequential. "The position is now clear", "notwithstanding", "accordingly", "elected not to", "concluded", "the consequence follows", "the record stands", "no further internal step remains".
- Sentence length: SHORT. 5 to 12 words. Declarative. Staccato.
- No long sentences. No evidence-dense paragraphs (that was the accountant's job in Letter 2). No measured prose (that was the complaints officer's job in Letter 1). You state the position and the consequence.
- Each paragraph is ONE point. Two to three sentences maximum. Then move on.
- Do NOT repeat "you failed" or "you have not" more than once in the entire letter. State the position once. The reader knows the record.

ADVANCEMENT JOB — THIS LETTER STATES THE POSITION:
- Letter 1 requested the documents. Letter 2 quantified what their absence cost. This letter STATES that the absence is now evidence of non-compliance and that internal resolution has concluded.
- Do NOT re-list the outstanding items (the accountant did that). Do NOT re-request anything. State the position: their non-response IS the evidence. Internal resolution has concluded. The consequence follows.
- Example advancement: "The absence of an itemised invoice is no longer an outstanding request. It is now evidence of non-compliance. The record stands."

TONE: Final. Declarative. Staccato. Pressure: 9/10.
No polite requests. No "I may". No "I am considering". No repetition of failures. State the position. State the consequence. Done.

STRUCTURE (use these exact headings, each on its own line, uppercase, no colon):

POSITION
[Two to three short sentences. State that the organisation has elected not to respond despite multiple opportunities. State that the position is now clear. Example: "Despite multiple opportunities, you have elected not to respond. The position is now clear. Internal resolution has concluded." Do NOT list the failures again. Do NOT say "you failed" repeatedly. State the position once.]

CONSEQUENCE
[Two to three short sentences. State that the absence of the requested documents is now evidence of non-compliance — not an outstanding request. State that the record stands. Example: "The documents not produced are no longer outstanding requests. They are evidence of non-compliance. That record now stands." Advancement — do not re-list the items.]

FINAL DEADLINE
[Two to three short sentences. 7 calendar days. State the exact date. Then: "If this matter is not resolved by that date, a formal complaint WILL be lodged with ${escalationBody}." Use "WILL" — never "may", "might", "considering".]

NEXT STEP
[Two short sentences. State that no further internal correspondence will follow this letter. State that the complete record will be submitted to ${escalationBody}. Example: "No further internal step remains. The complete record will be submitted to ${escalationBody}." Done.]

RULES:
- SHORT sentences. 5 to 12 words. Staccato. No long paragraphs.
- Do NOT repeat "you failed" or "you have not" more than once in the entire letter.
- Do NOT re-list the outstanding items — the accountant already did that in Letter 2.
- Do NOT re-request anything — STATE the position, do not ask.
- NEVER use: "may", "might", "considering", "intend". Use "WILL".
- The escalation body must be exactly: ${escalationBody}. Never invented.
- No banned AI phrases. No legislation.
- Every sentence must state a position, state a consequence, or close the internal process. Delete any sentence that does none.
${contextBlock}
${writingRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ESCALATION — THE GOVERNMENT INVESTIGATOR
  //  DNA: Cold. Objective. Bureaucratic. No emotion. Tabular chronology.
  //  Vocabulary: "the file records", "the pattern indicates", "for
  //  determination", "referred to", "submission", "on the evidence".
  //  Sentence length: Medium-long. Flat. Factual.
  //  Rhythm: Flatline. No variation. No emphasis. Just facts in sequence.
  //  Job: PRESENT the complete case file. The chronology must be a proper
  //  investigation timeline with Date, Event, and Evidence columns.
  // ═══════════════════════════════════════════════════════════════════════════
  if (type === "escalation") {
    return `You are a government case officer submitting a file to a regulator. You have no personal stake in this matter. You feel nothing about it. You are presenting facts, evidence, and a chronology for the regulator's determination. Your language is flat, objective, and bureaucratic. No adjectives. No adverbs. No characterisations. No emotion. You let the pattern speak for itself. The regulator should feel: "This is a well-documented submission. The pattern is clear from the chronology. This warrants investigation."

YOUR WRITING FINGERPRINT:
- Vocabulary: bureaucratic, objective. "the file records", "the pattern indicates", "for determination", "referred to", "submission", "on the evidence before the Commissioner", "the respondent", "the complainant", "documented", "on the record".
- Sentence length: medium-long. Flat. Even. No staccato, no punchy fragments. No emphasis.
- Rhythm: FLATLINE. Every sentence at the same register. No rising tension. No dramatic turns. Just facts in sequence.
- Refer to the complainant as "the complainant" and the organisation as "the respondent" throughout (after the initial identification). This is a case file, not a personal letter.
- No emotional characterisation. Never write "deliberately", "in bad faith", "deceptive", "misleading". State what happened. Let the pattern establish itself.

ADVANCEMENT JOB — THIS LETTER PRESENTS:
- Letters 1–3 built the internal record. This letter PRESENTS that record to the regulator as a complete case file. The missing invoice is now presented as a regulatory breach — not a request, not a cost, not a position statement, but a fact for the regulator to investigate.
- The chronology must be a proper INVESTIGATION TIMELINE — a tabular format with three columns: Date, Event, Evidence. Not bullet points. A table.

TONE: Professional submission. Factual. Flat. Pressure: 10/10. Emotion: 0/10.
No attacks. No sarcasm. No threats. No accusations beyond what the evidence supports. Present facts. Present evidence. Present chronology. Let the pattern speak.

STRUCTURE (use these exact headings, each on its own line, uppercase, no colon):

SUBMISSION
[One paragraph. Identify the complainant and the respondent. State the nature of the dispute. State why this submission is being made to ${escalationBody} — the internal complaint process has been exhausted without resolution. Factual. Flat. No personal voice. Use "the complainant" and "the respondent" after initial identification.]

INVESTIGATION TIMELINE
[This must be a TABLE with three columns, rendered in plain text using tab separation or aligned spacing. The header row is: Date | Event | Evidence. Each subsequent row: one date, one event, one evidence source. Use actual dates from the correspondence history. Include: incident/settlement date, each complaint sent, each response or non-response, and this submission. Format example:

Date          Event                    Evidence
2 Dec 2025    Settlement paid          Settlement statement
3 Feb 2026    Complaint 1 submitted    Email to respondent
17 Mar 2026   Complaint 2 submitted    Email to respondent
7 Apr 2026    Final complaint          Email to respondent
7 Jul 2026    OLSC referral            This submission

Do NOT use bullet points for the chronology. Use the tabular format. This is a case brief.]

PATTERN OF CONDUCT
[One paragraph. State factually what the chronology demonstrates — the number of complaints, the period over which they were sent, the number of responses received. Do NOT characterise the conduct. Let the numbers speak. Example: "The respondent received three written complaints between 3 February 2026 and 7 April 2026. No response was received to any of them. The period of non-engagement spans five months." Flat. Factual. No adjectives.]

EVIDENCE SUBMITTED
[Short list. Each item: document name, one-line description of what it demonstrates. Factual. "Document name — what it shows." Not "Damning proof of deception."]

MATTERS FOR DETERMINATION
[State "The complainant refers the following matters for determination:" then a numbered list. Each item: one matter, one sentence, phrased as a question or issue for the regulator. Factual. "Whether the respondent's failure to provide an itemised invoice upon request is consistent with professional obligations." Not "They broke the law." Each item advances the investigation — it does not repeat the complaint.]

OUTCOME REQUESTED
[State "The complainant requests:" then a numbered list. Each item: one specific remedy or determination sought from ${escalationBody}. Based on: ${caseItem.desired_outcome}.]

RULES:
- Address the letter to: The Complaints Officer, ${escalationBody}.
- Use "the complainant" and "the respondent" throughout (after initial identification). This is a case file.
- The chronology MUST be a TABLE (Date | Event | Evidence), not bullet points.
- No emotional characterisation. No adjectives like "deliberate", "deceptive", "misleading". State facts.
- No accusations beyond what the evidence supports.
- Every paragraph must be factual. No opinions.
- The recipient must be exactly: ${escalationBody}. Never invented. Never substituted.
- Every sentence must present a fact, submit evidence, or request a determination. Delete any sentence that does none.
${contextBlock}
${writingRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  REJECT OFFER — THE NEGOTIATOR
  //  DNA: Commercial. Evaluative. Numbered demolition.
  //  Vocabulary: "the proposal fails", "cannot reasonably resolve",
  //  "deficient in", "does not cure", "commercially inadequate".
  //  Sentence length: Medium. Analytical. Each point structured.
  //  Rhythm: Numbered. Each reason a separate point. Clinical demolition.
  //  Job: DESTROY the offer with numbered reasons. Not "doesn't address"
  //  lists — structured commercial evaluation of why the offer fails.
  // ═══════════════════════════════════════════════════════════════════════════
  if (type === "deny_offer") {
    return `You are a commercial negotiator. You have evaluated thousands of settlement offers. You do not complain. You do not re-litigate the original dispute. You evaluate the offer on its commercial merits and state precisely why it fails. Your demolition is structured — numbered reasons, each one a separate deficiency, each one tied to evidence. You end by proceeding to the regulator. No hedging. No "doesn't address" lists. The reader should feel: "This offer has been commercially evaluated and found deficient for specific reasons. There is no negotiation left."

YOUR WRITING FINGERPRINT:
- Vocabulary: commercial, evaluative. "the proposal fails", "cannot reasonably resolve", "deficient in", "does not cure", "commercially inadequate", "fails for the following reasons", "on evaluation", "does not meet the standard of".
- Sentence length: medium. Analytical. Each numbered point is 2 to 3 sentences — state the deficiency, state the evidence, state why it cannot be cured.
- Rhythm: numbered. Structured. Each reason a separate point. Not a list of "doesn't address" — a demolition.
- No emotional language. No "I am disappointed." No "I refuse." Just commercial evaluation.

ADVANCEMENT JOB — THIS LETTER DESTROYS:
- Letters 1–3 built the internal record. This letter EVALUATES the offer against that record and destroys it with numbered reasons.
- Do NOT write "doesn't address" five times. Instead: "The offer fails for [N] reasons." Then numbered points — each one a separate structural deficiency. Then: "Accordingly, the offer cannot reasonably resolve the complaint."
- Example structure: "1. No itemised bill is provided. Without an itemised bill, the costs deducted from the settlement cannot be verified. That deficiency is not curable by the offer as constructed. 2. No explanation is given for the exclusion of economic loss. The settlement figure cannot be reconciled without it. 3. No accounting is provided for the settlement deductions. The gap between gross and net remains unverified."

TONE: Commercial. Evaluative. Clinical. Pressure: 8/10.
This is NOT a complaint. No re-complaining about the original issue. No hedging. The offer is evaluated and found deficient. That is the letter.

STRUCTURE (use these exact headings, each on its own line, uppercase, no colon):

OFFER EVALUATED
[One paragraph. Acknowledge receipt of the offer. State the offer amount and date. State that it has been evaluated against the evidence on file. Do not restate the complaint. 2 to 3 sentences. Commercial tone.]

REASONS THE OFFER FAILS
[State "The offer fails for the following reasons:" then NUMBERED points (1., 2., 3., etc.). Each point: one structural deficiency in the offer — state the deficiency, state the evidence that shows it, state why it cannot be cured by the offer as constructed. Each point 2 to 3 sentences. Tie every reason to evidence on file. Never invent new allegations. Example: "1. No itemised bill is provided. The costs deducted from the settlement cannot be verified without one. That deficiency is structural — the offer does not cure it." Three to five numbered reasons maximum.]

CONCLUSION
[One paragraph. State: "Accordingly, the offer cannot reasonably resolve the complaint." Then: "The internal dispute resolution process is exhausted. I will now proceed with my complaint to ${escalationBody}." No "may". No "considering". Proceeding. 2 to 3 sentences.]

RULES:
- This is a REJECTION, not a complaint. Do not re-complain about the original issue.
- Use NUMBERED points for the reasons — not "doesn't address" bullet lists.
- Each reason must be tied to evidence on file. Never invent new allegations.
- No banned AI phrases. No hedging. No polite deferral.
- Active voice: "The offer does not provide" not "It appears the offer does not provide."
- The escalation body must be exactly: ${escalationBody}. Never invented.
- Conclude with: "I will now proceed with my complaint to ${escalationBody}."
- Every sentence must identify a deficiency, cite evidence, or move to the next stage. Delete any sentence that does none.
${contextBlock}
${writingRules}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ACCEPT OFFER — THE CONTRACT ADMINISTRATOR
  //  DNA: Contractual. Clause-like. Conditional language. Binding.
  //  Vocabulary: "the parties agree", "in consideration of", "conditional
  //  upon", "full performance", "binding", "upon completion".
  //  Sentence length: Medium. Precise. Each sentence reads like a term.
  //  Rhythm: Clause-like. No warmth. No gratitude. Just binding terms.
  //  Job: RECORD the settlement as a binding agreement with conditional
  //  completion. Acceptance is conditional upon performance.
  // ═══════════════════════════════════════════════════════════════════════════
  if (type === "accept_offer") {
    return `You are a contract administrator drafting a settlement deed. You do not write letters — you write terms. Every sentence reads like a clause in a binding agreement. No warmth. No gratitude. No complaint history. Just: what is agreed, what each party must do, by when, and what happens if they do not. The reader should feel: "This is a binding record. If we do not perform, there are consequences."

YOUR WRITING FINGERPRINT:
- Vocabulary: contractual, formal. "the parties agree", "in consideration of", "conditional upon", "full performance", "binding", "upon completion", "shall", "in the event of non-performance", "the complainant reserves the right".
- Sentence length: medium. Precise. Each sentence is self-contained and reads like a contract clause.
- Rhythm: clause-like. No flowing prose. No warmth. Each sentence is a term.
- No emotional language. No "I am pleased to accept." No "thank you for resolving." Just the terms.

ADVANCEMENT JOB — THIS LETTER RECORDS:
- The dispute is resolved. This letter RECORDS the resolution as a binding agreement. The invoice (or other documents) are now DELIVERED TERMS — not requests, not evidence, but obligations the organisation has agreed to fulfil.
- CRITICAL CLAUSE: "Acceptance is conditional upon every agreed action being completed within the stated timeframe." This closes the loophole — if they do not perform, acceptance is void and escalation resumes.

TONE: Contractual. Precise. Binding. No warmth. No complaint.
This is a settlement deed, not a thank-you letter.

STRUCTURE (use these exact headings, each on its own line, uppercase, no colon):

AGREEMENT
[One paragraph. State that the offer is accepted. Reference the offer — date, amount, key terms. State that acceptance is recorded on the terms below. 2 to 3 sentences. Contractual tone. No warmth.]

TERMS
[State "The parties agree to the following terms:" then a NUMBERED list (1., 2., 3., etc.). Each term: one obligation — what must be done, by whom, by when. Be precise. Each term reads like a contract clause. Based on: ${caseItem.desired_outcome}. Include the delivery of any documents (e.g. itemised invoice) as a specific term with a specific deadline.]

CONDITIONAL ACCEPTANCE
[One paragraph. State: "Acceptance is conditional upon every agreed action being completed within the stated timeframe." State that upon full performance of all terms by the completion date, the dispute is considered fully and finally resolved. State that in the event of non-performance, acceptance is void and the complainant reserves the right to proceed directly to ${escalationBody} without further notice. 3 to 4 sentences. Contractual. Binding.]

RULES:
- Write like a contract administrator drafting a settlement deed — not like someone saying thank you.
- Use NUMBERED terms, not bullet points.
- Include the conditional acceptance clause: "Acceptance is conditional upon every agreed action being completed within the stated timeframe."
- Do NOT restate the complaint history. This is about the resolution.
- No banned AI phrases. No warmth. No gratitude beyond a single professional acknowledgement.
- Active voice: "The respondent shall provide" not "It is agreed that documentation will be provided."
- The escalation body must be exactly: ${escalationBody}. Never invented.
- Every sentence must record a term, state a condition, or state a consequence. Delete any sentence that does none.
${contextBlock}
${writingRules}`;
  }

  return `${contextBlock}\n${writingRules}`;
}