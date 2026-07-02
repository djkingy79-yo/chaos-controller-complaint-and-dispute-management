/**
 * Industry Classifier — Australian provider + keyword dictionary.
 * Returns lowercase category matching Case entity enum:
 *   banking | insurance | telco | utilities | tenancy | government | education | other
 *
 * Priority scoring: provider name matches score higher than generic keyword matches.
 * Use detectIndustryDebug() for full reasoning output.
 * Use detectIndustry() for simple category string (backwards-compatible).
 */

// ─── RULES ────────────────────────────────────────────────────────────────────
// Each rule has: category, providers (high-confidence, score 10), keywords (score 3)
// Rules are evaluated independently; highest total score wins.
// Ties broken by rule order (government/education before banking avoids false positives).

const RULES = [
  {
    category: "legal_profession",
    providers: [
      "law society", "bar association", "legal services commissioner",
      "olsc", "office of the legal services commissioner",
    ],
    keywords: [
      "solicitor", "solicitors", "barrister", "barristers", "law firm", "legal firm",
      "lawyer", "lawyers", "attorney", "attorneys", "conveyancer", "conveyancers",
      "legal fees", "costs dispute", "costs assessment", "itemised bill",
      "overcharged legal fees", "legal representation", "retainer agreement",
      "professional misconduct", "solicitor misconduct", "unsatisfactory professional conduct",
    ],
  },
  {
    category: "government",
    providers: [
      "centrelink", "services australia", "medicare", "child support agency",
      "revenue nsw", "transport for nsw", "service nsw", "nsw police",
      "legal aid nsw", "dcj", "department of communities and justice",
      "link2home", "workforce australia", "des provider", "job network",
      "jobnetwork", "local council", "fair work commission",
      "australian taxation office", "ato", "department of home affairs",
      "fair trading nsw", "nsw fair trading",
    ],
    keywords: [
      "council rates", "council fine", "government department", "state debt",
      "mutual obligation", "demerit point", "payment suspension", "income support",
      "jobseeker", "employment services", "job provider",
    ],
  },
  {
    category: "education",
    providers: [
      "department of education", "tafe nsw", "tafe", "university of sydney",
      "unsw", "uow", "university of newcastle", "western sydney university",
      "macquarie university",
    ],
    keywords: [
      "school", "public school", "high school", "primary school", "principal",
      "teacher", "suspension", "expulsion", "learning support", "bullying",
      "attendance", "enrolment", "student", "detention", "classroom",
    ],
  },
  {
    category: "banking",
    providers: [
      "national australia bank", "nab", "commonwealth bank", "commbank", "cba",
      "anz", "westpac", "st george", "banksa", "bank of melbourne",
      "macquarie bank", "ing direct", "ing bank", "ing",
      "bendigo bank", "adelaide bank", "bankwest", "suncorp bank",
      "boq", "bank of queensland", "heritage bank", "great southern bank",
      "me bank", "ubank", "up bank", "revolut", "wise",
      "paypal", "afterpay", "zip pay", "zippay", "humm", "latitude financial",
      "latitude", "visa", "mastercard", "payid", "osko", "bpay",
    ],
    keywords: [
      "transaction dispute", "chargeback", "card dispute", "account frozen",
      "fraud department", "unauthorised transaction", "unauthorized transaction",
      "debit card", "credit card", "mortgage", "home loan", "personal loan",
      "bank transfer", "bank account", "direct debit", "overdraft", "interest rate",
    ],
  },
  {
    category: "insurance",
    providers: [
      "nrma insurance", "nrma", "iag", "aami", "allianz", "budget direct",
      "gio", "qbe", "youi", "suncorp insurance", "suncorp",
      "racq", "racv", "raa", "sgic", "sgio", "bingle",
      "coles insurance", "woolworths insurance", "real insurance",
      "medibank", "bupa", "nib", "hcf", "australian unity",
      "tal", "aia australia", "aia", "zurich", "amp life", "mlc life",
    ],
    keywords: [
      "claim delay", "settlement offer", "write off", "write-off", "repairer",
      "insurance excess", "excess", "policy number", "policy holder", "underwriter",
      "total loss", "third party claim", "comprehensive insurance",
      "insurance claim", "insurer", "insurance policy", "premium", "policy",
      "health insurance", "life insurance", "car insurance", "home insurance",
    ],
  },
  {
    category: "telco",
    providers: [
      "optus", "telstra", "vodafone", "tpg telecom", "tpg internet", "tpg",
      "iinet", "internode", "aussie broadband", "belong", "amaysim",
      "boost mobile", "dodo", "exetel", "superloop", "more telecom",
      "southern phone", "kogan mobile", "spintel", "vocus",
    ],
    keywords: [
      "mobile plan", "internet plan", "nbn connection", "nbn",
      "phone contract", "service disconnection", "handset", "sim card",
      "data usage", "roaming charges", "broadband", "mobile network",
      "telecommunications", "phone bill", "internet bill", "tio",
      "telecommunications industry ombudsman",
    ],
  },
  {
    category: "utilities",
    providers: [
      "agl energy", "agl", "origin energy", "energyaustralia", "energy australia",
      "red energy", "alinta energy", "simply energy", "momentum energy",
      "powershop", "lumo energy", "actewagl", "jemena", "ausgrid",
      "endeavour energy", "essential energy", "sydney water", "waternsw",
      "hunter water", "sa water", "icon water",
    ],
    keywords: [
      "electricity bill", "gas bill", "water bill", "bill shock",
      "smart meter", "meter reading", "solar feed-in", "power disconnection",
      "energy retailer", "energy ombudsman", "ewon", "electricity",
      "gas supply", "water supply", "disconnection notice",
    ],
  },
  {
    category: "tenancy",
    providers: [
      "ray white", "lj hooker", "ljhooker", "mcgrath estate", "mcgrath",
      "belle property", "raine and horne", "raine & horne", "harcourts",
      "professionals real estate", "first national real estate", "first national",
      "richardson and wrench", "richardson & wrench", "housing nsw",
      "dcj housing", "department of communities and justice",
    ],
    keywords: [
      "real estate agent", "property manager", "landlord", "tenant",
      "tenancy", "lease agreement", "rental bond", "bond refund", "bond claim",
      "rent", "eviction notice", "termination notice", "condition report",
      "residential tenancy", "strata", "body corporate", "ncat",
      "fair trading nsw", "repairs", "maintenance request",
    ],
  },
];

// ─── ESCALATION BODIES ────────────────────────────────────────────────────────
// Delegates to the Australia-wide authority routing engine (single source of
// truth for every category × state/territory). Never hardcode a body here.
import { getComplaintPathway, getEscalationBodyLabel, getEscalationUrl as routeEscalationUrl } from "@/lib/authorityRouting";

// ─── CORE SCORING ENGINE ──────────────────────────────────────────────────────

function buildText(input = {}) {
  return [
    input.organisation_name,
    input.organisation,
    input.issue_summary,
    input.issue,
    input.issue_details,
    input.description,
    input.respondent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreRule(rule, text) {
  const matchedProviders = [];
  const matchedKeywords = [];

  for (const p of rule.providers) {
    // Escape special regex chars in provider names, use word boundaries where possible
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(?:^|[\\s,/&])${escaped}(?:[\\s,/.!?]|$)`, "i");
    if (rx.test(` ${text} `)) matchedProviders.push(p);
  }

  for (const k of rule.keywords) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(?:^|[\\s,/])${escaped}(?:[\\s,/.!?]|$)`, "i");
    if (rx.test(` ${text} `)) matchedKeywords.push(k);
  }

  const score = matchedProviders.length * 10 + matchedKeywords.length * 3;
  return { score, matchedProviders, matchedKeywords };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Full debug result: { category, matchedProvider, matchedKeywords, confidence, escalationBody }
 */
export function detectIndustryDebug(input = {}) {
  const text = buildText(input);
  let best = null;

  for (const rule of RULES) {
    const { score, matchedProviders, matchedKeywords } = scoreRule(rule, text);
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score, matchedProviders, matchedKeywords };
    }
  }

  if (!best) {
    return {
      category: "other",
      matchedProvider: null,
      matchedKeywords: [],
      confidence: "none",
      escalationBody: getEscalationBodyLabel(getComplaintPathway({ category: "other" })),
    };
  }

  const confidence =
    best.matchedProviders.length > 0
      ? best.score >= 20 ? "high" : "medium"
      : best.score >= 6 ? "medium" : "low";

  return {
    category: best.rule.category,
    matchedProvider: best.matchedProviders[0] || null,
    matchedKeywords: best.matchedKeywords,
    confidence,
    escalationBody: getEscalationBodyLabel(getComplaintPathway({ category: best.rule.category })),
  };
}

/**
 * Simple category string — backwards-compatible with all existing callers.
 */
export function detectIndustry(input = {}) {
  return detectIndustryDebug(input).category;
}

/**
 * Escalation body for a given category + state. Context: { text, hasCivilClaimPathway }
 * for legal_profession's compound routing (professional body + costs pathway,
 * civil tribunal only when explicitly confirmed).
 * Always prefer passing `state` — without it, jurisdiction-dependent
 * categories default to NSW and flag that the state wasn't confirmed.
 */
export function getEscalationBody(industry, context = {}) {
  const pathway = getComplaintPathway({ category: industry, state: context.state, context });
  return getEscalationBodyLabel(pathway);
}

// Single source of truth for each category's external escalation body URL —
// used anywhere the app needs to send the user to lodge an external complaint.
// Never hardcode a separate category→body mapping elsewhere.
export function getEscalationUrl(industry, state) {
  return routeEscalationUrl(industry, state);
}

/**
 * Detect industry from a case object + optional evidence list (legacy support).
 */
export function detectIndustryFromCase(caseItem, evidenceList = []) {
  const fromCase = detectIndustry(caseItem);
  if (fromCase && fromCase !== "other") return fromCase;
  for (const ev of evidenceList) {
    const text =
      ev.extracted_text ||
      ev.extracted_data?.document_summary ||
      ev.extracted_data?.merchant_name ||
      "";
    const fromDoc = detectIndustry({ issue: text });
    if (fromDoc && fromDoc !== "other") return fromDoc;
  }
  return fromCase || "other";
}