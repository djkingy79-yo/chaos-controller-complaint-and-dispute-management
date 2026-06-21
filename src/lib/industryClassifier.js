/**
 * CHAOS CONTROLLER™ — Industry Classifier
 * Auto-detects industry category from text.
 * NAB → banking. NRMA → insurance. Ray White → tenancy. Optus → telco. AGL → utilities. Centrelink → other.
 */

const RULES = [
  {
    category: 'banking',
    keywords: [
      'nab', 'national australia bank', 'commbank', 'commonwealth bank', 'anz ',
      'westpac', 'st george', 'stgeorge', 'ing bank', 'ing direct', 'macquarie bank',
      'bankwest', 'bank of melbourne', 'bank of queensland', 'boq', 'citibank',
      'hsbc', 'bendigo bank', 'suncorp bank', 'payid', 'pay id',
      'chargeback', 'transaction dispute', 'card dispute', 'account frozen',
      'fraud team', 'unauthorized transaction', 'unauthorised transaction',
      'debit card', 'credit card', 'mortgage', 'home loan', 'personal loan',
    ],
  },
  {
    category: 'insurance',
    keywords: [
      'nrma', 'nrma insurance', 'iag', 'aami', 'allianz', 'budget direct',
      'gio', 'qbe', 'youi', 'suncorp insurance', 'real insurance', 'cgu',
      'claim delay', 'settlement offer', 'write off', 'write-off', 'repairer',
      'insurance excess', 'policy number', 'policy holder', 'underwriter',
      'total loss', 'third party claim', 'comprehensive insurance',
      'insurance claim', ' insurer', 'insurance policy',
    ],
  },
  {
    category: 'tenancy',
    keywords: [
      'ray white', 'lj hooker', 'ljhooker', 'harcourts', 'first national real estate',
      'mcgrath estate', 'rea group', 'landlord', 'tenancy',
      'termination notice', 'eviction notice', 'bond refund', 'bond claim',
      'condition report', 'ncat', 'housing nsw', 'department of communities',
      'rental bond', 'lease agreement', 'property manager', 'tenant notice',
      'fair trading nsw', 'residential tenancy', 'strata', 'body corporate',
    ],
  },
  {
    category: 'telco',
    keywords: [
      'optus', 'telstra', 'vodafone', 'tpg telecom', 'tpg internet', 'vocus',
      'aussie broadband', 'superloop', 'kogan mobile', 'amaysim', 'boost mobile',
      'spintel', 'internode', 'iinet', 'mobile plan', 'internet plan',
      'phone contract', 'service disconnection', 'broadband', 'nbn connection',
      'data usage', 'roaming charges', 'mobile network', 'sim card',
      'telecommunications industry ombudsman', 'tio complaint',
    ],
  },
  {
    category: 'utilities',
    keywords: [
      'energyaustralia', 'energy australia', 'origin energy', 'origin power',
      'agl energy', ' agl ', 'red energy', 'simply energy', 'alinta energy',
      'powershop', 'jemena', 'ausgrid', 'endeavour energy', 'essential energy',
      'bill shock', 'disconnection notice', 'smart meter', 'solar feed-in',
      'electricity bill', 'gas bill', 'water bill', 'energy retailer',
      'power disconnection', 'energy ombudsman',
    ],
  },
  {
    category: 'other',
    keywords: [
      'centrelink', 'services australia', 'revenue nsw', 'fair work commission',
      'council', 'local council', 'government department', 'ato ', 'australian tax',
      'police ', 'department of home affairs', 'department of',
      'school principal', 'suspension', 'department of education',
      'tafe ', 'university ', 'service nsw',
    ],
  },
];

/**
 * Detect industry category from a text string.
 * @param {string} text
 * @returns {string|null} one of: banking, insurance, tenancy, telco, utilities, other — or null if no match
 */
export function detectIndustry(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) return rule.category;
    }
  }
  return null;
}

/**
 * Detect industry from a case object + optional evidence list.
 * Checks: org name → issue summary → issue details → evidence text
 */
export function detectIndustryFromCase(caseItem, evidenceList = []) {
  const fromOrg = detectIndustry(caseItem?.organisation_name);
  if (fromOrg) return fromOrg;
  const fromIssue = detectIndustry(caseItem?.issue_summary);
  if (fromIssue) return fromIssue;
  const fromDetails = detectIndustry(caseItem?.issue_details);
  if (fromDetails) return fromDetails;
  for (const ev of evidenceList) {
    const text = ev.extracted_text || ev.extracted_data?.document_summary || ev.extracted_data?.merchant_name;
    const fromDoc = detectIndustry(text);
    if (fromDoc) return fromDoc;
  }
  return null;
}