/**
 * Industry Classifier — detects industry from case input fields and returns escalation body.
 */

export function detectIndustry(input = {}) {
  const text = [
    input.organisation_name,
    input.organisation,
    input.category,
    input.issue_summary,
    input.issue,
    input.issue_details,
    input.description,
    input.respondent
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(bank|nab|commbank|westpac|anz|st george|credit card|loan|payid|visa|mastercard|transaction|dispute|chargeback|afca)/i.test(text)) {
    return "banking";
  }

  if (/(nrma|insurance|insurer|claim|policy|premium|excess|aami|allianz|gio|budget direct|suncorp|qbe|youi|racq|afca)/i.test(text)) {
    return "insurance";
  }

  if (/(telstra|optus|vodafone|tpg|internet|mobile|phone bill|telecommunications|nbn|tio)/i.test(text)) {
    return "telco";
  }

  if (/(electricity|gas|energy|water|origin|agl|energy australia|red energy|endeavour energy|essential energy|ausgrid|ewon)/i.test(text)) {
    return "utilities";
  }

  if (/(housing|tenant|landlord|rent|bond|lease|eviction|repairs|ncat|tribunal)/i.test(text)) {
    return "tenancy";
  }

  if (/(centrelink|services australia|jobnetwork|job network|workforce australia|job provider|employment services|mutual obligation|demerit point|payment suspension|income support|jobseeker)/i.test(text)) {
    return "other";
  }

  if (/(school|teacher|principal|suspension|education|student|detention|department of education)/i.test(text)) {
    return "other";
  }

  return "other";
}

export function getEscalationBody(industry) {
  const bodies = {
    banking: "Australian Financial Complaints Authority (AFCA)",
    insurance: "Australian Financial Complaints Authority (AFCA)",
    telco: "Telecommunications Industry Ombudsman (TIO)",
    utilities: "Energy & Water Ombudsman",
    tenancy: "NSW Civil and Administrative Tribunal (NCAT)",
    other: "Relevant ombudsman or tribunal",
  };
  return bodies[industry] || bodies.other;
}

/**
 * Detect industry from a case object + optional evidence list (legacy support).
 */
export function detectIndustryFromCase(caseItem, evidenceList = []) {
  const fromCase = detectIndustry(caseItem);
  if (fromCase && fromCase !== 'other') return fromCase;
  for (const ev of evidenceList) {
    const text = ev.extracted_text || ev.extracted_data?.document_summary || ev.extracted_data?.merchant_name || '';
    const fromDoc = detectIndustry({ issue: text });
    if (fromDoc && fromDoc !== 'other') return fromDoc;
  }
  return fromCase || 'other';
}