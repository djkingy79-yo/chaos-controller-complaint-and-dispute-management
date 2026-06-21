/**
 * CHAOS CONTROLLER™ — Industry Classifier
 * Auto-detects industry category from organisation name or text content.
 * Used by: EvidenceVault (OCR scan), NewCase (document upload), CaseSummary.
 */

const INDUSTRY_RULES = [
  {
    category: 'banking',
    keywords: [
      'nab', 'national australia bank', 'commonwealth bank', 'commbank', 'cba',
      'anz', 'westpac', 'st george', 'stgeorge', 'ing ', 'ing bank', 'macquarie bank',
      'bendigo bank', 'suncorp bank', 'bankwest', 'bank of melbourne', 'bank of queensland',
      'boq', 'citibank', 'hsbc', 'payid', 'visa card', 'mastercard',
      'transaction dispute', 'chargeback', 'account frozen', 'fraud department',
      'debit card', 'credit card dispute', 'unauthorized transaction', 'unauthorised transaction',
      'bank', 'banking', 'loan', 'mortgage', 'interest rate', 'overdraft',
    ],
  },
  {
    category: 'insurance',
    keywords: [
      'nrma insurance', 'nrma', 'iag', 'aami', 'allianz', 'budget direct',
      'gio', 'qbe', 'youi', 'suncorp insurance', 'real insurance', 'cgu',
      'claim delay', 'settlement offer', 'write off', 'write-off', 'repairer',
      'excess', 'policy', 'insurer', 'insurance claim', 'underwriter',
      'total loss', 'third party', 'comprehensive', 'insurance',
    ],
  },
  {
    category: 'tenancy',
    keywords: [
      'landlord', 'real estate', 'ray white', 'lj hooker', 'ljhooker',
      'harcourts', 'first national', 'mcgrath', 'domain', 'tenancy',
      'termination notice', 'eviction', 'rent ', 'rental', 'bond ',
      'bond refund', 'bond claim', 'condition report', 'repairs',
      'ncat', 'housing nsw', 'department of communities', 'fair trading',
      'residential tenancy', 'lease agreement', 'property manager',
      'tenant', 'landlord', 'strata', 'body corporate',
    ],
  },
  {
    category: 'telco',
    keywords: [
      'optus', 'telstra', 'vodafone', 'tpg', 'tpg telecom', 'vocus', 'aussie broadband',
      'superloop', 'kogan mobile', 'amaysim', 'boost mobile', 'spintel',
      'internet', 'mobile plan', 'phone contract', 'service disconnection',
      'broadband', 'nbn', 'data usage', 'phone bill', 'roaming charges',
      'telecommunications', 'telco', 'mobile network', 'sim card',
    ],
  },
  {
    category: 'utilities',
    keywords: [
      'electricity', 'gas ', 'water ', 'energyaustralia', 'energy australia',
      'origin energy', 'origin', 'agl', 'red energy', 'simply energy',
      'alinta energy', 'powershop', 'jemena', 'ausgrid', 'endeavour energy',
      'essential energy', 'bill shock', 'disconnection notice', 'smart meter',
      'solar', 'energy retailer', 'power bill', 'utility', 'utilities',
    ],
  },
  {
    category: 'other',
    keywords: [
      'centrelink', 'services australia', 'revenue nsw', 'revenue nsw',
      'council', 'local council', 'government department', 'department of',
      'federal government', 'state government', 'police',
      'school', 'principal', 'suspension', 'teacher', 'department of education',
      'tafe', 'university',
    ],
  },
];

/**
 * Detect industry category from a text string.
 * @param {string} text - Organisation name, issue summary, or extracted document text.
 * @returns {string} category - one of: banking, insurance, tenancy, telco, utilities, other
 */
export function detectIndustry(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();

  for (const rule of INDUSTRY_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return null; // no match
}

/**
 * Detect industry from a case object (checks org name, issue summary, extracted evidence text).
 * @param {object} caseItem
 * @param {array} evidenceList
 * @returns {string|null} detected category
 */
export function detectIndustryFromCase(caseItem, evidenceList = []) {
  // Check org name first (most reliable)
  const fromOrg = detectIndustry(caseItem?.organisation_name);
  if (fromOrg) return fromOrg;

  // Check issue summary
  const fromIssue = detectIndustry(caseItem?.issue_summary);
  if (fromIssue) return fromIssue;

  // Check issue details
  const fromDetails = detectIndustry(caseItem?.issue_details);
  if (fromDetails) return fromDetails;

  // Check evidence extracted text
  for (const ev of evidenceList) {
    const text = ev.extracted_text || ev.extracted_data?.document_summary || ev.extracted_data?.merchant_name;
    const fromDoc = detectIndustry(text);
    if (fromDoc) return fromDoc;
  }

  return null;
}