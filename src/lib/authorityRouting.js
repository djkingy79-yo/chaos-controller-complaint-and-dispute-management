/**
 * AUSTRALIA-WIDE AUTHORITY ROUTING ENGINE — single source of truth.
 *
 * Every case has a structured complaintPathway:
 *   { internalComplaint, regulator, ombudsman, tribunal, court, supportServices, notes }
 *
 * This is the ONLY place that decides which body applies to which
 * category + state/territory. No prompt, letter, checklist, or report
 * may invent/substitute a different body — they must render exactly
 * what this engine returns.
 *
 * Never use NCAT outside NSW, never route telco to AFCA, never route
 * insurance/banking to TIO, never route tenancy to AFCA/TIO, etc.
 */

export const AU_STATES = [
  { value: "federal", label: "Federal / National" },
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "SA", label: "SA" },
  { value: "WA", label: "WA" },
  { value: "TAS", label: "TAS" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "NT" },
];

function emptyPathway() {
  return { internalComplaint: "", regulator: "", ombudsman: "", tribunal: "", court: "", supportServices: [], notes: "" };
}

// ─── STATE/TERRITORY TRIBUNALS ─────────────────────────────────────────────
const TENANCY_BY_STATE = {
  NSW: { regulator: "NSW Fair Trading", tribunal: "NSW Civil and Administrative Tribunal (NCAT)", supportServices: ["Tenants' Union NSW", "Tenancy Advice and Advocacy Service (TAAS)"] },
  VIC: { regulator: "Consumer Affairs Victoria", tribunal: "Victorian Civil and Administrative Tribunal (VCAT)", supportServices: ["Tenants Victoria"] },
  QLD: { regulator: "Residential Tenancies Authority (RTA) Queensland", tribunal: "Queensland Civil and Administrative Tribunal (QCAT)", supportServices: ["QSTARS", "Tenants Queensland"] },
  SA: { regulator: "Consumer and Business Services SA", tribunal: "South Australian Civil and Administrative Tribunal (SACAT)", supportServices: ["RentRight SA"] },
  WA: { regulator: "Consumer Protection WA", tribunal: "Magistrates Court of WA / State Administrative Tribunal (SAT) — as applicable", supportServices: ["Circle Green Community Legal", "Tenancy WA"] },
  TAS: { regulator: "Consumer, Building and Occupational Services (CBOS) Tasmania", tribunal: "Tasmanian Civil and Administrative Tribunal (TASCAT)", supportServices: ["Tenants' Union of Tasmania"] },
  ACT: { regulator: "Access Canberra", tribunal: "ACT Civil and Administrative Tribunal (ACAT)", supportServices: ["Tenants' Union ACT"] },
  NT: { regulator: "Consumer Affairs NT", tribunal: "NT Civil and Administrative Tribunal (NTCAT)", supportServices: ["Darwin Community Legal Service — Tenants' Advice"] },
};

const UTILITIES_BY_STATE = {
  NSW: { ombudsman: "Energy & Water Ombudsman NSW (EWON)" },
  VIC: { ombudsman: "Energy and Water Ombudsman Victoria (EWOV)" },
  QLD: { ombudsman: "Energy and Water Ombudsman Queensland (EWOQ)" },
  SA: { ombudsman: "Energy and Water Ombudsman SA (EWOSA)" },
  WA: { ombudsman: "Energy and Water Ombudsman WA (EWOWA)" },
  TAS: { ombudsman: "Energy Ombudsman Tasmania" },
  ACT: { tribunal: "ACT Civil and Administrative Tribunal (ACAT)", notes: "ACT energy/water complaints are handled via the ACT civil and administrative pathway where the provider's internal process does not resolve the issue." },
  NT: { regulator: "Utilities Commission NT", notes: "The provider's own complaints pathway applies first; the Utilities Commission NT oversees the sector." },
};

const GOVERNMENT_OMBUDSMAN_BY_STATE = {
  federal: "Commonwealth Ombudsman",
  NSW: "NSW Ombudsman",
  VIC: "Victorian Ombudsman",
  QLD: "Queensland Ombudsman",
  SA: "Ombudsman SA",
  WA: "Ombudsman Western Australia",
  TAS: "Ombudsman Tasmania",
  ACT: "ACT Ombudsman",
  NT: "Ombudsman NT",
};

const LEGAL_PROFESSION_BY_STATE = {
  NSW: { regulator: "Office of the Legal Services Commissioner (OLSC) NSW", professionalBody: "Law Society of NSW / NSW Bar Association" },
  VIC: { regulator: "Victorian Legal Services Board + Commissioner", professionalBody: "Law Institute of Victoria / Victorian Bar" },
  QLD: { regulator: "Legal Services Commission Queensland", professionalBody: "Queensland Law Society / Bar Association of Queensland" },
  SA: { regulator: "Legal Profession Conduct Commissioner SA", professionalBody: "Law Society of South Australia / South Australian Bar Association" },
  WA: { regulator: "Legal Practice Board WA / Legal Profession Complaints Committee WA", professionalBody: "Law Society of WA / Western Australian Bar Association" },
  TAS: { regulator: "Legal Profession Board of Tasmania", professionalBody: "Law Society of Tasmania / Tasmanian Bar" },
  ACT: { regulator: "ACT Law Society legal profession complaints pathway", professionalBody: "ACT Law Society / ACT Bar Association" },
  NT: { regulator: "Law Society Northern Territory legal profession complaints pathway", professionalBody: "Law Society Northern Territory / Northern Territory Bar Association" },
};

// Fair trading / consumer body + civil tribunal — used for "other" (general
// consumer/trader disputes) AND reused as the tribunal when a legal
// profession case has a confirmed separate civil/consumer claim.
const CONSUMER_BY_STATE = {
  NSW: { regulator: "NSW Fair Trading", tribunal: "NSW Civil and Administrative Tribunal (NCAT)" },
  VIC: { regulator: "Consumer Affairs Victoria", tribunal: "Victorian Civil and Administrative Tribunal (VCAT)" },
  QLD: { regulator: "Office of Fair Trading Queensland", tribunal: "Queensland Civil and Administrative Tribunal (QCAT)" },
  SA: { regulator: "Consumer and Business Services SA", tribunal: "South Australian Civil and Administrative Tribunal (SACAT)" },
  WA: { regulator: "Consumer Protection WA", tribunal: "Magistrates Court of WA / State Administrative Tribunal (SAT) — as applicable" },
  TAS: { regulator: "Consumer, Building and Occupational Services (CBOS) Tasmania", tribunal: "Tasmanian Civil and Administrative Tribunal (TASCAT)" },
  ACT: { regulator: "Access Canberra", tribunal: "ACT Civil and Administrative Tribunal (ACAT)" },
  NT: { regulator: "Consumer Affairs NT", tribunal: "NT Civil and Administrative Tribunal (NTCAT)" },
};

const COSTS_DISPUTE_PATTERN = /costs? dispute|itemised bill|overcharg(ed|ing)|legal fees|invoice|retainer|costs assessment|fee dispute/i;

function normaliseState(state) {
  if (!state) return null;
  const s = String(state).trim();
  if (/federal|national|commonwealth/i.test(s)) return "federal";
  const match = AU_STATES.find(x => x.value.toLowerCase() === s.toLowerCase());
  return match ? match.value : null;
}

/**
 * Core routing engine. Returns a fully structured complaintPathway object.
 * Never guesses a body for a jurisdiction it doesn't have data for — leaves
 * the field blank and adds a note instead.
 */
export function getComplaintPathway({ category, state, context = {} } = {}) {
  const p = emptyPathway();
  const st = normaliseState(state);
  const stateMissingNote = !st ? "State/territory not confirmed for this case — pathway shown defaults to NSW. Confirm the correct state to ensure accuracy." : "";

  switch (category) {
    case "banking":
      p.internalComplaint = "Bank's Internal Dispute Resolution (IDR) team";
      p.ombudsman = "Australian Financial Complaints Authority (AFCA)";
      p.regulator = "ASIC / APRA (where relevant)";
      break;

    case "insurance":
      p.internalComplaint = "Insurer's Internal Dispute Resolution (IDR) team";
      p.ombudsman = "Australian Financial Complaints Authority (AFCA)";
      p.regulator = "ASIC / APRA (where relevant)";
      break;

    case "telco":
      p.internalComplaint = "Provider's complaints team";
      p.ombudsman = "Telecommunications Industry Ombudsman (TIO)";
      p.regulator = "Australian Communications and Media Authority (ACMA)";
      break;

    case "utilities": {
      const u = UTILITIES_BY_STATE[st || "NSW"];
      p.internalComplaint = "Energy/water retailer's internal complaints team";
      p.ombudsman = u.ombudsman || "";
      p.tribunal = u.tribunal || "";
      p.regulator = ["Australian Energy Regulator (AER) — where relevant", u.regulator].filter(Boolean).join(" / ");
      p.notes = [u.notes, stateMissingNote].filter(Boolean).join(" ");
      break;
    }

    case "tenancy": {
      const t = TENANCY_BY_STATE[st || "NSW"];
      p.internalComplaint = "Landlord / property manager / housing provider";
      p.regulator = t.regulator;
      p.tribunal = t.tribunal;
      p.supportServices = t.supportServices;
      p.notes = stateMissingNote;
      break;
    }

    case "government": {
      p.internalComplaint = "Agency's internal complaints / feedback team";
      p.ombudsman = GOVERNMENT_OMBUDSMAN_BY_STATE[st || "federal"];
      p.notes = stateMissingNote;
      break;
    }

    case "legal_profession": {
      const l = LEGAL_PROFESSION_BY_STATE[st || "NSW"];
      p.internalComplaint = "Law firm / solicitor's own complaints process (where available)";
      p.regulator = l.regulator;
      const notes = [`Professional body: ${l.professionalBody}`];
      if (COSTS_DISPUTE_PATTERN.test(context.text || "")) {
        notes.push("Costs pathway applies: itemised bill / costs assessment review.");
      }
      if (context.hasCivilClaimPathway) {
        const c = CONSUMER_BY_STATE[st || "NSW"];
        p.tribunal = `${c.tribunal} — only because a genuine separate civil/consumer claim has been confirmed, not for the conduct/costs complaint itself`;
      }
      if (stateMissingNote) notes.push(stateMissingNote);
      p.notes = notes.join(" ");
      break;
    }

    case "education":
      p.internalComplaint = "School principal / education provider's complaints process";
      p.regulator = "Relevant state/territory Department of Education complaints unit";
      break;

    case "other":
    default: {
      const c = CONSUMER_BY_STATE[st || "NSW"];
      p.internalComplaint = "Business/trader's internal complaints process";
      p.regulator = c.regulator;
      p.tribunal = c.tribunal;
      p.notes = ["For systemic or national consumer issues, the ACCC may also be relevant.", stateMissingNote].filter(Boolean).join(" ");
      break;
    }
  }

  return p;
}

/**
 * Compose a single human-readable escalation body string from a structured
 * pathway — used for the case's legacy `escalation_body` display field.
 */
export function getEscalationBodyLabel(pathway) {
  if (!pathway) return "Relevant complaint body — to be confirmed";
  const parts = [pathway.ombudsman, pathway.tribunal, pathway.regulator, pathway.court].filter(Boolean);
  if (!parts.length) return "Relevant complaint body — to be confirmed";
  return parts.join("; ");
}

// ─── OFFICIAL LODGEMENT URLS (only where confidently known — never guessed) ─
const FIXED_URLS = {
  banking: "https://www.afca.org.au/make-a-complaint/",
  insurance: "https://www.afca.org.au/make-a-complaint/",
  telco: "https://www.tio.com.au/complaints",
};

const TENANCY_URLS = {
  NSW: "https://www.ncat.nsw.gov.au/ncat/how-to-apply.html",
  VIC: "https://www.vcat.vic.gov.au/how-to-apply",
  QLD: "https://www.qcat.qld.gov.au/case-types",
  SA: "https://www.sacat.sa.gov.au/",
  TAS: "https://www.tascat.tas.gov.au/",
  ACT: "https://www.acat.act.gov.au/",
  NT: "https://ntcat.nt.gov.au/",
};

const UTILITIES_URLS = {
  NSW: "https://www.ewon.com.au/page/making-a-complaint/complaint-forms",
  VIC: "https://www.ewov.com.au/complaints",
};

const LEGAL_PROFESSION_URLS = {
  NSW: "https://www.olsc.nsw.gov.au/how-to-complain.html",
};

const GOVERNMENT_URLS = {
  federal: "https://www.ombudsman.gov.au/How-we-can-help/making-a-complaint",
};

const CONSUMER_URLS = {
  NSW: "https://www.fairtrading.nsw.gov.au/help-centre/online-complaints",
  VIC: "https://www.consumer.vic.gov.au/contact-us/complaints",
};

/**
 * Official lodgement URL for a category + state. Returns null (never a
 * guess) when we don't have a confirmed official link for that jurisdiction —
 * callers should fall back to showing the escalation body name only.
 */
export function getEscalationUrl(category, state) {
  const st = normaliseState(state);
  if (FIXED_URLS[category]) return FIXED_URLS[category];
  if (category === "tenancy") return TENANCY_URLS[st] || null;
  if (category === "utilities") return UTILITIES_URLS[st] || null;
  if (category === "legal_profession") return LEGAL_PROFESSION_URLS[st] || null;
  if (category === "government") return GOVERNMENT_URLS[st] || GOVERNMENT_URLS.federal;
  if (category === "other") return CONSUMER_URLS[st] || null;
  return null;
}