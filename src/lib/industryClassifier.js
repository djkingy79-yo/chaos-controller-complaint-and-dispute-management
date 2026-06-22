/**
 * Industry Classifier — detects industry from case input fields and returns escalation body.
 * Returns lowercase values matching the Case entity category enum:
 * banking | insurance | telco | utilities | tenancy | government | education | other
 */

export function detectIndustry(input = {}) {
  const text = [
    input.organisation_name,
    input.organisation,
    input.issue_summary,
    input.issue,
    input.issue_details,
    input.description,
    input.respondent
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Government / Centrelink — check BEFORE banking to avoid "dispute" false-positives
  if (/centrelink|services australia|job network|jobnetwork|workforce australia|job provider|employment services|mutual obligation|demerit point|payment suspension|income support|jobseeker/i.test(text)) {
    return "government";
  }

  // Education — check BEFORE banking ("student dispute" must not trigger banking)
  if (/\bschool\b|teacher|principal|\bsuspension\b|\beducation\b|\bstudent\b|detention|department of education/i.test(text)) {
    return "education";
  }

  // Banking — use word-boundary anchors on generic words to avoid false matches
  if (/\bnab\b|commbank|westpac|\banz\b|st george|credit card|\bloan\b|payid|\bvisa\b|mastercard|\btransaction dispute\b|\bchargeback\b|account frozen|unauthoris|unauthoriz|debit card|mortgage|home loan|personal loan|\bbank\b/i.test(text)) {
    return "banking";
  }

  // Insurance
  if (/\bnrma\b|insurance|insurer|\bclaim\b|\bpolicy\b|premium|\bexcess\b|\baami\b|allianz|\bgio\b|budget direct|\bsuncorp\b|\bqbe\b|\byoui\b|\bracq\b/i.test(text)) {
    return "insurance";
  }

  // Telco
  if (/telstra|optus|vodafone|\btpg\b|internet plan|mobile plan|phone bill|telecommunications|\bnbn\b|\btio\b|aussie broadband|phone contract|broadband|mobile network|sim card/i.test(text)) {
    return "telco";
  }

  // Utilities
  if (/electricity|gas bill|\benergy\b|\bwater bill\b|origin energy|origin power|\bagl\b|energy australia|red energy|endeavour energy|essential energy|ausgrid|\bewon\b/i.test(text)) {
    return "utilities";
  }

  // Tenancy / Housing
  if (/housing nsw|\bhousing\b|\btenant\b|\blandlord\b|\brent\b|\bbond\b|\blease\b|\beviction\b|\brepairs\b|\bncat\b|\btribunal\b/i.test(text)) {
    return "tenancy";
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
    government: "Relevant agency complaints team / Commonwealth Ombudsman",
    education: "School principal / Department of Education complaints",
    other: "Relevant ombudsman or tribunal",
  };
  return bodies[industry] || bodies.other;
}

/**
 * Detect industry from a case object + optional evidence list (legacy support).
 */
export function detectIndustryFromCase(caseItem, evidenceList = []) {
  const fromCase = detectIndustry(caseItem);
  if (fromCase && fromCase !== "other") return fromCase;
  for (const ev of evidenceList) {
    const text = ev.extracted_text || ev.extracted_data?.document_summary || ev.extracted_data?.merchant_name || "";
    const fromDoc = detectIndustry({ issue: text });
    if (fromDoc && fromDoc !== "other") return fromDoc;
  }
  return fromCase || "other";
}