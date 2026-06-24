import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowLeft, Zap, AlertTriangle, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { templates } from "@/lib/templateData";
import { base44 } from "@/api/base44Client";

// ─── Brand colours ────────────────────────────────────────────────────────────
const GOLD    = "#E8A020";
const GOLD_DK = "#D4930A";
const GOLD_LT = "#FEF3D0";

// ─── Category definitions — plain English, problem-focused ───────────────────
const CATEGORIES = [
  {
    id: "banking",
    emoji: "🏦",
    title: "Banking & Money Problems",
    desc: "Problems with banks, credit cards, loans, payments, frozen accounts, financial hardship, debt or scams.",
    examples: ["Account frozen or closed", "Money taken without permission", "Charged unfair fees", "Struggling to repay a loan"],
    escalateTo: "AFCA (Australian Financial Complaints Authority)",
    templates: [
      { id: "bank-scam",     title: "Scam / Fraud Reimbursement Request",   creates: "Formal reimbursement demand to your bank",        escalate: "AFCA",                      when: ["Bank failed to protect you from a scam", "Money was taken in a fraudulent transaction", "You reported it but the bank won't refund"] },
      { id: "bank-transfer", title: "Failed or Delayed Transfer",            creates: "Formal investigation request for missing funds",   escalate: "AFCA",                      when: ["Money you sent never arrived", "Transfer was delayed and caused you loss", "Bank won't explain what happened to your funds"] },
      { id: "bank-fees",     title: "Unauthorised Fee Complaint",            creates: "Formal fee dispute and refund request",            escalate: "AFCA",                      when: ["Your bank charged a fee without warning", "Fees were applied you didn't agree to", "You can't get support to explain the charges"] },
      { id: "bank-hardship", title: "Financial Hardship Request",            creates: "Hardship variation request under the NCCP Act",    escalate: "AFCA or financial counsellor", when: ["You've lost your job or had a change in income", "You can't keep up with loan repayments", "You need a payment pause or reduction"] },
      { id: "bank-credit",   title: "Credit Decision Dispute",               creates: "Formal challenge to a credit decision",            escalate: "AFCA",                      when: ["Your credit application was rejected", "Your credit limit was reduced without warning", "You believe the decision was based on wrong information"] },
    ],
  },
  {
    id: "insurance",
    emoji: "🛡",
    title: "Insurance Claim Problems",
    desc: "Insurance companies delaying, rejecting or underpaying your claim.",
    examples: ["Claim was rejected or denied", "Insurer is not responding", "Settlement offer is too low", "Policy cancelled unfairly"],
    escalateTo: "AFCA (handles all insurance disputes)",
    templates: [
      { id: "insurance-rejection",  title: "Rejected Claim Dispute",        creates: "Formal internal review request",                   escalate: "AFCA",  when: ["Your insurer said no to your claim", "The rejection reason doesn't match your policy", "You have evidence the claim should be covered"] },
      { id: "insurance-delay",      title: "Delayed Claim Complaint",        creates: "Formal complaint demanding urgent resolution",      escalate: "AFCA",  when: ["You lodged a claim weeks ago and nothing is happening", "You keep getting excuses or delays", "The delay is causing you financial hardship"] },
      { id: "insurance-total-loss", title: "Dispute Settlement Valuation",   creates: "Formal valuation dispute with supporting evidence", escalate: "AFCA",  when: ["The insurer's payout offer is too low", "Your vehicle or property was worth more than offered", "You have independent evidence of its value"] },
    ],
  },
  {
    id: "tenancy",
    emoji: "🏠",
    title: "Renting / Housing / Property",
    desc: "Problems with landlords, agents, rentals, bonds, repairs, social housing and homelessness risk.",
    examples: ["Bond being kept unfairly", "Repairs ignored", "Eviction notice received", "Landlord entered without notice"],
    escalateTo: "NCAT / VCAT / QCAT / SACAT (your state tribunal)",
    templates: [
      { id: "tenancy-bond",           title: "Bond Dispute Letter",          creates: "Formal bond refund demand",                        escalate: "State tenancy tribunal", when: ["Landlord is keeping your bond after you moved out", "Bond deductions are unfair or not supported by evidence", "You cleaned and repaired the property properly"] },
      { id: "tenancy-repairs",        title: "Repairs Not Completed",        creates: "Formal urgent repair demand",                      escalate: "State tenancy tribunal", when: ["Your landlord is ignoring repair requests", "The property is unsafe or uninhabitable", "Repairs have been outstanding for weeks"] },
      { id: "tenancy-notice-dispute", title: "Eviction Notice Response",     creates: "Formal challenge to eviction or notice to vacate", escalate: "State tenancy tribunal", when: ["You received a notice to vacate", "You believe the eviction is unlawful or retaliatory", "The notice period is too short or the form is wrong"] },
      { id: "tenancy-entry",          title: "Unlawful Entry Complaint",     creates: "Formal objection to unauthorised entry",           escalate: "State tenancy tribunal", when: ["Your landlord or agent entered without proper notice", "Your privacy was breached", "You want this to stop"] },
    ],
  },
  {
    id: "telco",
    emoji: "📱",
    title: "Phone & Internet",
    desc: "Mobile, internet, NBN, billing errors and provider disputes.",
    examples: ["Billed for a service you don't use", "Internet never worked properly", "Disconnected without warning", "Trapped in a contract"],
    escalateTo: "TIO (Telecommunications Industry Ombudsman)",
    templates: [
      { id: "telco-billing", title: "Incorrect Bill Complaint",      creates: "Formal billing dispute and refund request",   escalate: "TIO", when: ["Your bill has charges you didn't agree to", "You were charged for a service you cancelled", "You've contacted support but nothing changed"] },
      { id: "telco-service", title: "Service Failure Complaint",     creates: "Formal demand for service fix and compensation", escalate: "TIO", when: ["Your internet or phone hasn't worked properly for weeks", "You're paying full price for a broken service", "The provider keeps promising fixes but nothing changes"] },
    ],
  },
  {
    id: "utilities",
    emoji: "⚡",
    title: "Electricity / Gas / Water",
    desc: "Utility bills, disconnections, meter problems and hardship.",
    examples: ["Energy bill is 3x higher than normal", "Threatened with disconnection", "Meter reading seems wrong", "Can't afford to pay"],
    escalateTo: "Energy Ombudsman in your state (EWON / EWOV / EWOQ / EWOSA / EWOWA)",
    templates: [
      { id: "utilities-billing",       title: "High or Incorrect Bill Complaint",  creates: "Formal billing dispute with meter review request", escalate: "State Energy Ombudsman", when: ["Your bill is much higher than usual", "You believe the meter reading is wrong", "You haven't changed your usage but the bill exploded"] },
      { id: "utilities-disconnection", title: "Wrongful Disconnection Dispute",    creates: "Urgent formal dispute against disconnection",     escalate: "State Energy Ombudsman", when: ["Your power or gas is being cut off", "You have a payment arrangement in place", "The disconnection is happening during a dispute"] },
    ],
  },
  {
    id: "government",
    emoji: "🏛",
    title: "Government Problems",
    desc: "Problems with Centrelink, ATO, councils, departments and government decisions.",
    examples: ["Centrelink payment stopped", "ATO debt you don't agree with", "Council fine or decision", "Government agency isn't responding"],
    escalateTo: "Commonwealth Ombudsman / State Ombudsman / Administrative Review Tribunal",
    templates: [
      { id: "centrelink-dispute", title: "Centrelink Decision Dispute",          creates: "Formal Authorised Review Officer request",          escalate: "Commonwealth Ombudsman / ART", when: ["Your Centrelink payment was reduced or stopped", "You have a debt you believe is wrong", "Your income was assessed incorrectly"] },
      { id: "council-complaint",  title: "Council / Local Government Complaint", creates: "Formal complaint to council with response demand",   escalate: "State Ombudsman",              when: ["You received a council fine you believe is wrong", "Council isn't maintaining infrastructure", "A planning or development decision affected you"] },
      { id: "tax-dispute",        title: "ATO Tax Assessment Dispute",           creates: "Formal objection under the Taxation Administration Act", escalate: "ART (Administrative Review Tribunal)", when: ["The ATO assessed you incorrectly", "A deduction was disallowed wrongly", "You disagree with a tax decision"] },
      { id: "medicare-dispute",   title: "Medicare / Services Australia Dispute", creates: "Formal Medicare billing complaint",                 escalate: "Commonwealth Ombudsman",      when: ["You were charged incorrectly by a provider", "Your Medicare rebate was denied", "A bulk billing arrangement was broken"] },
      { id: "ndis-plan-dispute",  title: "NDIS Plan Review Request",             creates: "Formal internal review under the NDIS Act 2013",   escalate: "Administrative Review Tribunal", when: ["Your NDIS access was rejected", "Your plan funding was cut", "Evidence provided was not considered properly"] },
    ],
  },
  {
    id: "legal",
    emoji: "⚖",
    title: "Legal / Court / Documents",
    desc: "Formal letters, demands, declarations, affidavits, privacy requests and legal documents.",
    examples: ["Need to demand someone pays you", "Need a statutory declaration", "Requesting your personal records", "Need to authorise someone to act for you"],
    escalateTo: "Courts / Tribunals / OAIC (for privacy)",
    templates: [
      { id: "general-demand",         title: "Letter of Demand",                   creates: "Formal legal demand for payment or action",         escalate: "Local / Magistrates Court",   when: ["Someone owes you money", "A business needs to take action urgently", "You want written proof before legal action"] },
      { id: "authority-to-act",       title: "Authority to Act (Third Party)",     creates: "Written authority for someone to act on your behalf", escalate: "N/A",                       when: ["You need someone to handle your complaint for you", "You are unwell or unable to communicate directly", "You are authorising a support worker or family member"] },
      { id: "stat-dec",               title: "Statutory Declaration",              creates: "Formal statutory declaration (requires witness)",   escalate: "N/A",                         when: ["You need to declare facts officially", "An organisation needs a formal statement from you", "You're supporting an insurance claim or legal matter"] },
      { id: "affidavit-template",     title: "Affidavit (Tribunal Use)",           creates: "Formal affidavit for tribunal or court",            escalate: "N/A",                         when: ["You're preparing evidence for NCAT, VCAT or QCAT", "You need a sworn statement of facts", "Your case is going to a tribunal hearing"] },
      { id: "privacy-access",         title: "Request Your Personal Information",  creates: "Formal Privacy Act access request",                 escalate: "OAIC",                        when: ["An organisation holds records about you", "You want to see what information they have", "You want call recordings, notes or account history"] },
      { id: "privacy-correction",     title: "Correct Wrong Personal Information", creates: "Formal Privacy Act correction request",             escalate: "OAIC",                        when: ["An organisation has wrong details about you", "Incorrect records are affecting you financially or otherwise", "They won't update your records voluntarily"] },
      { id: "credit-report-dispute",  title: "Credit Report Error Dispute",        creates: "Formal credit listing dispute and correction request", escalate: "OAIC",                    when: ["You have a listing on your credit file that's wrong", "A debt you paid is still showing", "An account you didn't open is listed"] },
    ],
  },
  {
    id: "health",
    emoji: "🏥",
    title: "Health / Medical",
    desc: "Doctors, hospitals, health services, Medicare billing and health practitioner complaints.",
    examples: ["Treated badly in hospital", "Doctor refused proper care", "Medical bill is wrong", "Health records denied"],
    escalateTo: "AHPRA / State Health Complaints Commission / Private Health Insurance Ombudsman",
    templates: [
      { id: "general-complaint", title: "Health Service Complaint",          creates: "Formal complaint to a health provider",         escalate: "AHPRA / State Health Commission", when: ["A hospital or clinic treated you poorly", "A doctor or nurse behaved unprofessionally", "You received incorrect or harmful treatment"] },
      { id: "general-escalation", title: "Escalation to Health Regulator",  creates: "Formal complaint to AHPRA or health commission",  escalate: "AHPRA or state health body",     when: ["The health provider didn't respond to your complaint", "You need a formal investigation", "A practitioner's conduct was unsafe"] },
    ],
  },
  {
    id: "ndis",
    emoji: "♿",
    title: "NDIS / Disability Support",
    desc: "NDIS participants, carers, providers and disability service complaints.",
    examples: ["NDIS access denied", "Provider not delivering supports", "Plan funding cut", "Carer support refused"],
    escalateTo: "NDIS Commission / NDIA / Administrative Review Tribunal",
    templates: [
      { id: "ndis-plan-dispute",  title: "NDIS Plan Review Request",         creates: "Formal internal review under NDIS Act 2013",     escalate: "Administrative Review Tribunal", when: ["Your NDIS plan was cut or underfunded", "Access was denied", "Evidence wasn't considered properly"] },
      { id: "general-complaint",  title: "NDIS Provider Complaint",          creates: "Formal complaint about a provider's conduct",    escalate: "NDIS Commission",               when: ["A provider isn't delivering your supports", "A support worker behaved improperly", "Your service agreement is being breached"] },
    ],
  },
  {
    id: "employment",
    emoji: "👷",
    title: "Workplace / Employment",
    desc: "Problems at work involving pay, unfair treatment, bullying or dismissal.",
    examples: ["Not paid correctly", "Fired unfairly", "Being bullied at work", "Forced to resign"],
    escalateTo: "Fair Work Commission / Fair Work Ombudsman",
    templates: [
      { id: "underpayment",       title: "Unpaid Wages Demand",              creates: "Formal demand for wage repayment",               escalate: "Fair Work Ombudsman",           when: ["Your employer owes you wages or entitlements", "You're paid below the award rate", "Super wasn't paid correctly"] },
      { id: "unfair-dismissal",   title: "Unfair Dismissal Letter",          creates: "Formal challenge to your termination",           escalate: "Fair Work Commission (21 days)", when: ["You lost your job and believe it was unfair", "You weren't warned or given a chance to respond", "The reason given doesn't make sense"] },
      { id: "workplace-bullying", title: "Bullying / Harassment Complaint",  creates: "Formal workplace complaint",                     escalate: "Fair Work Commission",          when: ["You are being bullied or harassed at work", "Management is ignoring the problem", "You've tried to raise it informally and been dismissed"] },
      { id: "redundancy-dispute", title: "Dispute Genuine Redundancy",       creates: "Formal challenge to your redundancy",            escalate: "Fair Work Commission",          when: ["Your redundancy doesn't seem real", "Your role is still being done by others", "No redeployment options were offered to you"] },
    ],
  },
  {
    id: "consumer",
    emoji: "🛒",
    title: "Consumer Problems",
    desc: "Businesses, products, refunds, vehicles, repairs and services that failed to deliver.",
    examples: ["Product is faulty and they won't refund", "Builder didn't finish the job", "Car dealer sold you a lemon", "Online purchase never arrived"],
    escalateTo: "ACCC / State consumer authority (Fair Trading / Consumer Affairs)",
    templates: [
      { id: "general-complaint",   title: "General Consumer Complaint",      creates: "Formal consumer complaint letter",              escalate: "ACCC / State Fair Trading",     when: ["A business sold you something faulty", "A service wasn't delivered as promised", "You can't get a refund or repair"] },
      { id: "general-escalation",  title: "Escalation to Ombudsman",         creates: "Formal escalation complaint",                  escalate: "Relevant ombudsman or regulator", when: ["Your first complaint was ignored", "The company gave an unsatisfactory response", "You need a third party to investigate"] },
      { id: "general-demand",      title: "Letter of Demand",                creates: "Formal payment / action demand letter",         escalate: "Courts / Tribunals",            when: ["You are owed money", "A business needs to act urgently", "You want a formal paper trail before legal action"] },
    ],
  },
];

const URGENT_ITEMS = [
  { label: "My account is frozen — I can't access money", cat: "banking" },
  { label: "My power or gas is about to be disconnected",  cat: "utilities" },
  { label: "I received an eviction notice",                cat: "tenancy" },
  { label: "I have a court date coming up",                cat: "legal" },
  { label: "My insurance claim was just rejected",         cat: "insurance" },
  { label: "My Centrelink payment was stopped",            cat: "government" },
  { label: "I was just fired from my job",                 cat: "employment" },
  { label: "Someone took money from my account",           cat: "banking" },
];

const CUSTOM_QUESTIONS = [
  { key: "who",      label: "Who is the complaint about?",       placeholder: "e.g. Commonwealth Bank, my landlord, Telstra…" },
  { key: "what",     label: "What happened?",                    placeholder: "Describe what went wrong in plain words…" },
  { key: "when",     label: "When did it happen?",               placeholder: "e.g. March 2024, last week, ongoing since January…" },
  { key: "involved", label: "Who was involved?",                 placeholder: "e.g. A customer service rep, my landlord's agent…" },
  { key: "tried",    label: "What have you already tried?",      placeholder: "e.g. Called 3 times, sent email, visited in person…" },
  { key: "impact",   label: "How has this affected you?",        placeholder: "e.g. I lost $800, I can't pay rent, I'm very stressed…" },
  { key: "outcome",  label: "What outcome do you want?",         placeholder: "e.g. Full refund, reconnect service, written apology…" },
  { key: "evidence", label: "What evidence do you have?",        placeholder: "e.g. Bank statements, emails, photos, receipts…" },
];

// ─── Letter Card ──────────────────────────────────────────────────────────────
function LetterCard({ tmpl, onSelect }) {
  const full = templates.find(t => t.id === tmpl.id);
  return (
    <div className="bg-white rounded-2xl border-2 overflow-hidden" style={{ borderColor: GOLD }}>
      {/* Title */}
      <div className="px-5 pt-5 pb-3">
        <h4 className="font-black text-black text-xl leading-tight mb-1">{tmpl.title}</h4>
        <p className="text-base font-bold" style={{ color: GOLD_DK }}>Creates: <span className="font-normal text-black">{tmpl.creates}</span></p>
        <p className="text-base font-bold mt-1" style={{ color: GOLD_DK }}>Can escalate to: <span className="font-normal text-black">{tmpl.escalate}</span></p>
      </div>

      <div className="mx-5 h-0.5" style={{ background: GOLD }} />

      {/* Use this when */}
      <div className="px-5 py-3">
        <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: GOLD_DK }}>USE THIS WHEN:</p>
        <ul className="space-y-1.5">
          {tmpl.when.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-black leading-6">
              <span className="font-black shrink-0" style={{ color: GOLD }}>✓</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={() => full && onSelect(full)}
          disabled={!full}
          className="w-full py-3 rounded-xl text-black font-black text-base uppercase tracking-widest transition-opacity hover:opacity-85 disabled:opacity-40"
          style={{ background: GOLD }}>
          CREATE LETTER →
        </button>
      </div>
    </div>
  );
}

// ─── Letter Preview Modal ──────────────────────────────────────────────────────
function LetterPreview({ template, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border-2 w-full max-w-3xl my-8 overflow-hidden shadow-2xl"
        style={{ borderColor: GOLD }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between gap-4" style={{ borderBottom: `3px solid ${GOLD}` }}>
          <div>
            <h2 className="font-black text-black text-2xl leading-tight">{template.title}</h2>
            <p className="text-base text-black/70 mt-1">{template.description}</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-black font-black text-base uppercase tracking-widest"
              style={{ background: GOLD }}>
              {copied ? <><Check className="w-4 h-4" /> COPIED!</> : <><Copy className="w-4 h-4" /> COPY</>}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border-2 text-black font-black text-base uppercase bg-white hover:bg-black/5 transition-colors"
              style={{ borderColor: GOLD }}>
              CLOSE
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4" style={{ background: GOLD_LT, borderBottom: `2px solid ${GOLD}` }}>
          <p className="text-base text-black font-bold leading-7">
            📋 Copy this letter, open your email or Word document, paste it in, then replace everything in{" "}
            <span className="font-black" style={{ color: GOLD_DK }}>[square brackets]</span> with your own details.
          </p>
        </div>

        {/* Letter body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <pre className="whitespace-pre-wrap text-base text-black leading-8 font-body">{template.body}</pre>
        </div>

        {/* CTA footer */}
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-3" style={{ borderTop: `2px solid ${GOLD}` }}>
          <Link to="/new-case" className="flex-1">
            <button className="w-full py-4 rounded-xl text-black font-black text-base uppercase tracking-widest" style={{ background: GOLD }}>
              ⚡ CREATE A CASE WITH AI LETTER
            </button>
          </Link>
          <button
            onClick={handleCopy}
            className="flex-1 py-4 rounded-xl border-2 text-black font-black text-base uppercase bg-white hover:bg-black/5"
            style={{ borderColor: GOLD }}>
            {copied ? "✓ COPIED!" : "COPY LETTER TEXT"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Custom AI Builder ────────────────────────────────────────────────────────
function CustomBuilder({ onBack }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setAnswers(prev => ({ ...prev, [k]: v }));
  const filled = CUSTOM_QUESTIONS.filter(q => answers[q.key]?.trim()).length;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = `You are an expert Australian consumer advocate. Based on the user's situation below, determine:
1. complaint_category: the best matching category (banking/insurance/tenancy/telco/utilities/government/legal/employment/consumer/health/ndis)
2. responsible_org_type: who should receive the complaint (e.g. "Commonwealth Bank — Complaints Department")
3. complaint_pathway: step-by-step (e.g. "1. Send this letter to bank. 2. If no response in 21 days, escalate to AFCA.")
4. regulator: the relevant ombudsman or regulator (e.g. "AFCA — afca.org.au — 1800 931 678")
5. letter: a complete, formal Australian complaint letter (plain text, no markdown, no HTML, no bracket placeholders)

User's situation:
Who: ${answers.who || "Not specified"}
What happened: ${answers.what || "Not specified"}
When: ${answers.when || "Not stated"}
Who was involved: ${answers.involved || "Not stated"}
What they've tried: ${answers.tried || "Nothing yet"}
Impact: ${answers.impact || "Not stated"}
Desired outcome: ${answers.outcome || "Fair resolution"}
Evidence: ${answers.evidence || "Not stated"}

Write the letter in full — professional, firm, evidence-based Australian English.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            complaint_category: { type: "string" },
            responsible_org_type: { type: "string" },
            complaint_pathway: { type: "string" },
            regulator: { type: "string" },
            letter: { type: "string" },
          }
        }
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-base font-black px-4 py-3 rounded-xl border-2 bg-white text-black uppercase tracking-widest hover:opacity-80 transition-opacity" style={{ borderColor: GOLD }}>
        <ArrowLeft className="w-4 h-4" /> BACK TO CATEGORIES
      </button>

      <div className="rounded-2xl border-2 bg-black px-6 py-6" style={{ borderColor: GOLD }}>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-7 h-7" style={{ color: GOLD }} />
          <h2 className="font-black text-white text-2xl md:text-3xl uppercase">🧩 SOMETHING ELSE HAPPENED</h2>
        </div>
        <div className="mt-3 space-y-1.5">
          {["Your problem does not fit any category", "You are unsure who is responsible", "Multiple organisations are involved", "You need help explaining what happened"].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-lg" style={{ color: GOLD_LT }}>
              <span className="font-black" style={{ color: GOLD }}>✓</span> {s}
            </div>
          ))}
        </div>
        <p className="text-base mt-4 leading-7" style={{ color: "rgba(255,255,255,0.7)" }}>
          Answer the questions below. Our AI will identify your category, find the right organisation, choose the correct pathway and write your complaint letter.
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          {CUSTOM_QUESTIONS.map(q => (
            <div key={q.key} className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: answers[q.key] ? GOLD : "#e5e7eb" }}>
              <label className="block font-black text-black text-lg mb-3">{q.label}</label>
              <textarea
                rows={3}
                value={answers[q.key] || ""}
                onChange={e => set(q.key, e.target.value)}
                placeholder={q.placeholder}
                className="w-full rounded-xl border-2 bg-white text-black text-lg leading-7 p-4 resize-none focus:outline-none placeholder-black/40"
                style={{ borderColor: answers[q.key] ? GOLD : "#e5e7eb", fontSize: "18px" }}
              />
            </div>
          ))}

          <button
            onClick={handleGenerate}
            disabled={filled < 3 || loading}
            className="w-full py-5 rounded-2xl text-black font-black text-xl uppercase tracking-widest transition-opacity disabled:opacity-40"
            style={{ background: GOLD, fontSize: "20px" }}>
            {loading ? "⏳ BUILDING YOUR LETTER…" : `⚡ BUILD MY COMPLAINT LETTER`}
          </button>
          {filled < 3 && (
            <p className="text-center text-base text-black/50 font-bold">Please answer at least 3 questions to continue.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Analysis result */}
          <div className="rounded-2xl border-2 p-6" style={{ borderColor: GOLD, background: GOLD_LT }}>
            <p className="font-black text-black text-xl mb-4 uppercase">✓ WE WORKED IT OUT</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <div><p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: GOLD_DK }}>CATEGORY</p><p className="text-xl font-bold text-black capitalize">{result.complaint_category}</p></div>
              <div><p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: GOLD_DK }}>COMPLAINT TO</p><p className="text-xl font-bold text-black">{result.responsible_org_type}</p></div>
              <div className="sm:col-span-2"><p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: GOLD_DK }}>COMPLAINT PATHWAY</p><p className="text-base font-bold text-black leading-6">{result.complaint_pathway}</p></div>
              <div className="sm:col-span-2"><p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: GOLD_DK }}>REGULATOR / OMBUDSMAN</p><p className="text-base font-bold text-black">{result.regulator}</p></div>
            </div>
          </div>

          {/* Generated letter */}
          <div className="rounded-2xl border-2 bg-white overflow-hidden" style={{ borderColor: GOLD }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${GOLD}` }}>
              <p className="font-black text-black text-xl uppercase">YOUR COMPLAINT LETTER</p>
              <button onClick={() => handleCopy(result.letter)} className="flex items-center gap-2 px-5 py-3 rounded-xl text-black font-black text-base uppercase" style={{ background: GOLD }}>
                {copied ? <><Check className="w-4 h-4" /> COPIED!</> : <><Copy className="w-4 h-4" /> COPY</>}
              </button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-base text-black leading-8 font-body">{result.letter}</pre>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to="/new-case" className="flex-1">
              <button className="w-full py-4 rounded-xl text-black font-black text-base uppercase tracking-widest" style={{ background: GOLD }}>
                ⚡ OPEN FULL CASE MANAGER
              </button>
            </Link>
            <button onClick={() => { setResult(null); setAnswers({}); }} className="flex-1 py-4 rounded-xl border-2 text-black font-black text-base uppercase bg-white" style={{ borderColor: GOLD }}>
              START AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Urgent Help Panel ─────────────────────────────────────────────────────────
function UrgentHelp({ onSelectCat }) {
  return (
    <div className="rounded-2xl border-2 overflow-hidden mb-8" style={{ borderColor: "#DC2626" }}>
      <div className="px-6 py-4 bg-red-600 flex items-center gap-3">
        <AlertTriangle className="w-7 h-7 text-white" />
        <h2 className="font-black text-white text-xl uppercase tracking-wide">🚨 URGENT — I NEED HELP TODAY</h2>
      </div>
      <div className="bg-white p-5">
        <p className="text-lg text-black font-bold mb-4">Tap your situation. We'll take you straight to the right letter.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {URGENT_ITEMS.map((u, i) => (
            <button
              key={i}
              onClick={() => onSelectCat(u.cat)}
              className="text-left px-5 py-4 rounded-xl border-2 bg-white font-black text-lg text-black uppercase tracking-wide transition-all hover:shadow-md"
              style={{ borderColor: GOLD, fontSize: "18px" }}>
              → {u.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Category Card (home grid) ────────────────────────────────────────────────
function CategoryCard({ cat, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(cat.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 8px 20px rgba(232,160,32,0.2)` }}
      className="text-left bg-white rounded-2xl border-2 overflow-hidden flex flex-col w-full transition-all"
      style={{ borderColor: GOLD }}>
      <div className="px-5 pt-5 pb-4 flex-1">
        <div className="text-4xl mb-3">{cat.emoji}</div>
        <h3 className="font-black text-black uppercase tracking-tight leading-tight mb-2" style={{ fontSize: "24px" }}>{cat.title}</h3>
        <p className="text-black/80 leading-6" style={{ fontSize: "18px" }}>{cat.desc}</p>
        <div className="mt-3 space-y-1">
          {cat.examples.slice(0, 3).map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-base text-black leading-6">
              <span className="font-black shrink-0" style={{ color: GOLD }}>✓</span>
              <span style={{ fontSize: "18px" }}>{e}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-5 h-0.5" style={{ background: GOLD }} />
      <div className="px-5 py-4">
        <div className="w-full py-3 rounded-xl text-black font-black uppercase tracking-widest text-center" style={{ background: GOLD, fontSize: "18px" }}>
          VIEW {cat.templates.length} LETTER{cat.templates.length !== 1 ? "S" : ""} →
        </div>
      </div>
    </motion.button>
  );
}

// ─── Category Detail View ──────────────────────────────────────────────────────
function CategoryDetail({ cat, onSelectTemplate, onBack }) {
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-base font-black px-4 py-3 rounded-xl border-2 bg-white text-black uppercase tracking-widest hover:opacity-80" style={{ borderColor: GOLD }}>
        <ArrowLeft className="w-4 h-4" /> BACK TO CATEGORIES
      </button>

      <div className="rounded-2xl border-2 bg-white px-6 py-6" style={{ borderColor: GOLD }}>
        <div className="flex items-start gap-4 mb-3">
          <span className="text-5xl shrink-0">{cat.emoji}</span>
          <div>
            <h2 className="font-black text-black uppercase tracking-tight" style={{ fontSize: "32px" }}>{cat.title}</h2>
            <p className="text-black/80 mt-1 leading-7" style={{ fontSize: "20px" }}>{cat.desc}</p>
          </div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: `2px solid ${GOLD}` }}>
          <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: GOLD_DK }}>ESCALATION: <span className="font-normal text-black">{cat.escalateTo}</span></p>
        </div>
      </div>

      <p className="font-black text-black uppercase tracking-widest" style={{ fontSize: "20px", color: GOLD_DK }}>CHOOSE YOUR LETTER:</p>

      <div className="grid md:grid-cols-2 gap-4">
        {cat.templates.map(tmpl => (
          <LetterCard key={tmpl.id} tmpl={tmpl} onSelect={onSelectTemplate} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TemplateLibrary() {
  const [view, setView]                     = useState("home");
  const [selectedCatId, setSelectedCatId]   = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const selectedCat = CATEGORIES.find(c => c.id === selectedCatId);

  const handleSelectCat = (id) => {
    setSelectedCatId(id);
    setView("category");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSelectedCatId(null);
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pb-16 min-h-screen" style={{ background: "#FFFDF7" }}>

      {/* Hero */}
      <div className="rounded-2xl bg-black px-6 py-7 mb-7">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-7 h-7" style={{ color: GOLD }} />
          <h1 className="font-black text-white uppercase tracking-tighter" style={{ fontSize: "32px" }}>
            COMPLAINT & DISPUTE LETTER BUILDER
          </h1>
        </div>
        <p className="text-white/80 leading-7" style={{ fontSize: "20px" }}>
          Choose your problem. We'll help you create the right complaint, request or escalation letter.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link to="/new-case">
            <button className="px-6 py-3 rounded-xl text-black font-black uppercase tracking-widest" style={{ background: GOLD, fontSize: "18px" }}>
              START A CASE →
            </button>
          </Link>
          <button
            onClick={() => setView("custom")}
            className="px-6 py-3 rounded-xl border-2 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
            style={{ borderColor: GOLD, fontSize: "18px" }}>
            NOT SURE? AI BUILDER
          </button>
        </div>
      </div>

      {/* HOME VIEW */}
      {view === "home" && (
        <>
          <UrgentHelp onSelectCat={handleSelectCat} />

          <p className="font-black text-black uppercase tracking-widest mb-5" style={{ fontSize: "24px" }}>
            WHAT IS YOUR PROBLEM?
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.id} cat={cat} onSelect={handleSelectCat} />
            ))}

            {/* Something Else */}
            <motion.button
              onClick={() => setView("custom")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, boxShadow: `0 8px 20px rgba(232,160,32,0.2)` }}
              className="text-left bg-black rounded-2xl border-2 overflow-hidden flex flex-col w-full"
              style={{ borderColor: GOLD }}>
              <div className="px-5 pt-5 pb-4 flex-1">
                <div className="text-4xl mb-3">🧩</div>
                <h3 className="font-black text-white uppercase tracking-tight leading-tight mb-2" style={{ fontSize: "24px" }}>
                  SOMETHING ELSE / NOT SURE
                </h3>
                <div className="space-y-1.5 mb-3">
                  {["Problem doesn't fit a category", "Unsure who is responsible", "Multiple organisations involved", "Need help explaining what happened"].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 leading-6" style={{ fontSize: "18px", color: GOLD_LT }}>
                      <span className="font-black shrink-0" style={{ color: GOLD }}>✓</span> {s}
                    </div>
                  ))}
                </div>
                <p className="leading-6" style={{ fontSize: "18px", color: "rgba(255,255,255,0.7)" }}>
                  Tell us what happened. AI will identify the category, responsible party and write your letter.
                </p>
              </div>
              <div className="mx-5 h-0.5" style={{ background: GOLD }} />
              <div className="px-5 py-4">
                <div className="w-full py-3 rounded-xl text-black font-black uppercase tracking-widest text-center" style={{ background: GOLD, fontSize: "18px" }}>
                  USE AI BUILDER →
                </div>
              </div>
            </motion.button>
          </div>
        </>
      )}

      {/* CATEGORY DETAIL */}
      {view === "category" && selectedCat && (
        <CategoryDetail cat={selectedCat} onSelectTemplate={setSelectedTemplate} onBack={handleBack} />
      )}

      {/* CUSTOM AI BUILDER */}
      {view === "custom" && (
        <CustomBuilder onBack={() => setView("home")} />
      )}

      {/* LETTER PREVIEW MODAL */}
      <AnimatePresence>
        {selectedTemplate && (
          <LetterPreview template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}