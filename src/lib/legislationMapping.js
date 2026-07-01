/**
 * CHAOS CONTROLLER — case-specific legislation mapping.
 * Returns ONLY the legislation relevant to a case's category (plus baseline
 * Australian Consumer Law provisions that apply broadly), each with a plain
 * one-line explanation of why it applies. Never dumps every Act.
 */

const BASE = [
  { law: "Australian Consumer Law — s18 (Misleading or Deceptive Conduct)", why: "Prohibits misleading or deceptive conduct in trade or commerce — relevant to how the organisation represented its services or handled the complaint." },
  { law: "Australian Consumer Law — s60 (Guarantee of Due Care and Skill)", why: "Services must be provided with due care and skill — relevant where service failures caused the dispute." },
  { law: "Australian Consumer Law — s61 (Guarantee of Fitness for Purpose)", why: "Services must be reasonably fit for the purpose the consumer made known — relevant if the service did not meet its intended purpose." },
];

const BY_CATEGORY = {
  banking: [
    { law: "Banking Code of Practice", why: "Sets standards for how banks must handle complaints fairly, transparently and in a timely manner." },
    { law: "ASIC Regulatory Guide 271 (Internal Dispute Resolution)", why: "Requires financial firms to resolve complaints within statutory timeframes and keep consumers informed." },
    { law: "ePayments Code", why: "Applies where the dispute involves electronic transactions, unauthorised payments, or chargebacks." },
  ],
  insurance: [
    { law: "Insurance Contracts Act 1984 (Cth)", why: "Governs the duty of utmost good faith and claims-handling obligations of insurers." },
    { law: "ASIC Regulatory Guide 271 (Internal Dispute Resolution)", why: "Requires insurers to resolve complaints within statutory timeframes." },
    { law: "General Insurance Code of Practice", why: "Sets service standards insurers must meet when handling claims and complaints." },
  ],
  tenancy: [
    { law: "Residential Tenancies Act (state/territory specific)", why: "Governs the rights and obligations of landlords and tenants, including repairs, bonds and terminations." },
  ],
  telco: [
    { law: "Telecommunications Consumer Protections (TCP) Code", why: "Sets standards for complaint handling, billing and service quality for telecommunications providers." },
    { law: "Telecommunications (Consumer Protection and Service Standards) Act 1999", why: "Establishes consumer protection obligations for carriage service providers." },
  ],
  utilities: [
    { law: "National Energy Retail Law / National Energy Retail Rules", why: "Governs energy retailer obligations including billing, disconnection and complaint handling." },
    { law: "State Energy/Water Ombudsman Scheme Rules", why: "Sets standards for utility providers' conduct and dispute resolution timeframes." },
  ],
  government: [
    { law: "Ombudsman Act (state/territory or Commonwealth, as applicable)", why: "Establishes the jurisdiction of the relevant Ombudsman to investigate government agency conduct." },
  ],
  education: [
    { law: "Education Services for Overseas Students (ESOS) Act 2000", why: "Applies where the dispute involves an international student education provider." },
  ],
};

export function getRelevantLegislation(caseItem) {
  const list = [...BASE, ...(BY_CATEGORY[caseItem?.category] || [])];
  const text = `${caseItem?.issue_details || ''} ${caseItem?.issue_summary || ''}`;
  if (/privacy|personal information|data breach/i.test(text)) {
    list.push({ law: "Privacy Act 1988 (Cth)", why: "May apply where personal information was mishandled or disclosed without consent." });
  }
  return list;
}