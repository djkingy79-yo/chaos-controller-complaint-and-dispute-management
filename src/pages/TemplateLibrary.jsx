import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowLeft, Zap, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { templates } from "@/lib/templateData";
import { base44 } from "@/api/base44Client";

// ─── Brand colours ────────────────────────────────────────────────────────────
const GOLD    = "#E8A020";
const GOLD_DK = "#D4930A";
const GOLD_LT = "#FEF3D0";

// ─── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "banking",
    emoji: "🏦",
    title: "Banking & Money Problems",
    desc: "Problems with banks, credit cards, loans, payments, frozen accounts, financial hardship, debt or scams.",
    templates: [
      { id: "bank-scam",     title: "Scam / Fraud Reimbursement",    when: "Bank failed to protect you from a scam." },
      { id: "bank-transfer", title: "Failed or Delayed Transfer",     when: "Money you sent didn't arrive." },
      { id: "bank-fees",     title: "Unauthorised Fee Dispute",       when: "Charged a fee you didn't agree to." },
      { id: "bank-hardship", title: "Financial Hardship Request",     when: "Can't keep up with loan or card repayments." },
      { id: "bank-credit",   title: "Credit Decision Dispute",        when: "Credit application rejected or limit cut." },
    ],
  },
  {
    id: "insurance",
    emoji: "🛡",
    title: "Insurance Claim Problems",
    desc: "Insurance companies delaying, rejecting or underpaying your claim.",
    templates: [
      { id: "insurance-rejection",  title: "Rejected Claim Dispute",       when: "Insurer said no to your claim." },
      { id: "insurance-delay",      title: "Delayed Claim Complaint",       when: "Claim lodged but nothing is happening." },
      { id: "insurance-total-loss", title: "Dispute Total Loss Valuation",  when: "Insurer's payout offer is too low." },
    ],
  },
  {
    id: "tenancy",
    emoji: "🏠",
    title: "Renting / Housing / Property",
    desc: "Problems with landlords, agents, rentals, bonds, repairs, social housing and homelessness risk.",
    templates: [
      { id: "tenancy-bond",          title: "Bond Dispute",               when: "Landlord is keeping your bond money." },
      { id: "tenancy-repairs",       title: "Repairs Not Completed",       when: "Landlord is ignoring urgent repairs." },
      { id: "tenancy-notice-dispute",title: "Eviction Notice Response",    when: "You got a notice to vacate." },
      { id: "tenancy-entry",         title: "Unlawful Entry by Landlord",  when: "Landlord entered without proper notice." },
    ],
  },
  {
    id: "telco",
    emoji: "📱",
    title: "Phone & Internet",
    desc: "Mobile, internet, NBN, billing and provider disputes.",
    templates: [
      { id: "telco-billing", title: "Incorrect Bill Complaint",     when: "Charged for something you shouldn't be." },
      { id: "telco-service", title: "Service Failure Complaint",    when: "Service isn't working as promised." },
    ],
  },
  {
    id: "utilities",
    emoji: "⚡",
    title: "Electricity / Gas / Water",
    desc: "Utility bills, disconnections, meter problems and hardship.",
    templates: [
      { id: "utilities-billing",       title: "High Bill Complaint",           when: "Energy bill is way higher than normal." },
      { id: "utilities-disconnection", title: "Wrongful Disconnection Notice", when: "Power/gas being cut off unfairly." },
    ],
  },
  {
    id: "government",
    emoji: "🏛",
    title: "Government Problems",
    desc: "Problems with Centrelink, ATO, councils, departments and government decisions.",
    templates: [
      { id: "centrelink-dispute", title: "Centrelink Complaint",           when: "Payment stopped, reduced or debt raised." },
      { id: "council-complaint",  title: "Council / Local Gov Complaint",  when: "Council fine, decision or inaction." },
      { id: "tax-dispute",        title: "ATO Tax Assessment Objection",   when: "Disagree with ATO's tax decision." },
      { id: "medicare-dispute",   title: "Medicare / Services Australia",  when: "Medicare billing or decision issue." },
      { id: "ndis-plan-dispute",  title: "NDIS Plan Review Request",       when: "NDIS plan or funding decision is wrong." },
    ],
  },
  {
    id: "legal",
    emoji: "⚖",
    title: "Legal / Court / Documents",
    desc: "Statutory declarations, affidavits, privacy requests and legal templates.",
    templates: [
      { id: "general-demand",    title: "Letter of Demand",                      when: "Formally demanding someone pay or act." },
      { id: "authority-to-act",  title: "Authority to Act / Third Party",         when: "Allowing someone to act for you." },
      { id: "stat-dec",          title: "Statutory Declaration",                  when: "Need to declare facts officially." },
      { id: "affidavit-template",title: "Affidavit (Tribunal Use)",               when: "Preparing evidence for tribunal." },
      { id: "privacy-access",    title: "Privacy — Access to Your Information",   when: "Organisation holding your personal data." },
      { id: "privacy-correction",title: "Privacy — Correct Wrong Information",    when: "Organisation has incorrect data on you." },
      { id: "credit-report-dispute", title: "Credit Report Error Dispute",        when: "Incorrect listing on your credit file." },
    ],
  },
  {
    id: "employment",
    emoji: "👷",
    title: "Workplace / Employment",
    desc: "Problems at work involving pay, unfair treatment or dismissal.",
    templates: [
      { id: "underpayment",       title: "Unpaid Wages Demand",                  when: "Not paid correctly or at all." },
      { id: "unfair-dismissal",   title: "Unfair Dismissal",                     when: "Lost your job unfairly." },
      { id: "workplace-bullying", title: "Bullying / Harassment Complaint",      when: "Being treated badly at work." },
      { id: "redundancy-dispute", title: "Dispute Genuine Redundancy",           when: "Redundancy doesn't seem real." },
    ],
  },
  {
    id: "consumer",
    emoji: "🛒",
    title: "Consumer Problems",
    desc: "Businesses, products, refunds, vehicles, repairs and services.",
    templates: [
      { id: "general-complaint",  title: "General Consumer Complaint",   when: "Business let you down in any way." },
      { id: "general-escalation", title: "Escalation to Ombudsman",      when: "Company ignored your first complaint." },
    ],
  },
];

const URGENT = [
  { label: "My account is frozen",            cat: "banking"    },
  { label: "I have no money access",          cat: "banking"    },
  { label: "My power is being disconnected",  cat: "utilities"  },
  { label: "I might lose my home",            cat: "tenancy"    },
  { label: "My government payment stopped",   cat: "government" },
  { label: "My insurance claim was denied",   cat: "insurance"  },
  { label: "I was unfairly fired",            cat: "employment" },
  { label: "I can't pay my loan",             cat: "banking"    },
];

const CUSTOM_QUESTIONS = [
  { key: "who",      label: "Who is the complaint about?",          placeholder: "e.g. Commonwealth Bank, my landlord, Telstra..." },
  { key: "what",     label: "What happened?",                        placeholder: "Describe what went wrong..." },
  { key: "when",     label: "When did it happen?",                   placeholder: "e.g. March 2024, last week..." },
  { key: "tried",    label: "What have you already tried?",          placeholder: "e.g. Called customer service, sent an email..." },
  { key: "impact",   label: "How has this affected you?",            placeholder: "e.g. Lost money, stress, can't pay bills..." },
  { key: "outcome",  label: "What outcome do you want?",             placeholder: "e.g. Full refund, reconnect service, formal apology..." },
  { key: "evidence", label: "What evidence do you have?",            placeholder: "e.g. Emails, receipts, photos, records..." },
];

// ─── Template Card (inside category view) ─────────────────────────────────────
function TemplateCard({ t, tmpl, onSelect }) {
  const fullTemplate = templates.find(x => x.id === tmpl.id);
  return (
    <button
      onClick={() => fullTemplate && onSelect(fullTemplate)}
      className="w-full text-left p-5 rounded-2xl border-2 bg-white hover:shadow-md transition-all"
      style={{ borderColor: GOLD }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-black text-black text-xl leading-tight mb-2">{tmpl.title}</p>
          <p className="text-base text-black/70 leading-6">
            <span className="font-black" style={{ color: GOLD_DK }}>USE WHEN: </span>
            {tmpl.when}
          </p>
        </div>
        <div
          className="shrink-0 px-4 py-2 rounded-xl text-black font-black text-sm uppercase tracking-widest mt-1"
          style={{ background: GOLD }}>
          USE →
        </div>
      </div>
    </button>
  );
}

// ─── Letter Preview Modal ──────────────────────────────────────────────────────
function LetterPreview({ template, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
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
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-black font-black text-base uppercase tracking-widest transition-opacity hover:opacity-85"
              style={{ background: GOLD }}
            >
              {copied ? <><Check className="w-4 h-4" /> COPIED!</> : <><Copy className="w-4 h-4" /> COPY</>}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border-2 text-black font-black text-base uppercase tracking-widest bg-white transition-colors hover:bg-black/5"
              style={{ borderColor: GOLD }}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4" style={{ background: GOLD_LT, borderBottom: `2px solid ${GOLD}` }}>
          <p className="text-base text-black font-bold">
            📋 Copy this letter, open your email or Word document, paste it in, then replace everything in <span className="font-black" style={{ color: GOLD_DK }}>[square brackets]</span> with your own details.
          </p>
        </div>

        {/* Letter body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <pre className="whitespace-pre-wrap text-base text-black leading-8 font-body bg-white">
            {template.body}
          </pre>
        </div>

        {/* CTA */}
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-3" style={{ borderTop: `2px solid ${GOLD}` }}>
          <Link to="/new-case" className="flex-1">
            <button
              className="w-full py-4 rounded-xl text-black font-black text-base uppercase tracking-widest transition-opacity hover:opacity-85"
              style={{ background: GOLD }}>
              ⚡ CREATE A CASE WITH THIS LETTER
            </button>
          </Link>
          <button
            onClick={handleCopy}
            className="flex-1 py-4 rounded-xl border-2 text-black font-black text-base uppercase tracking-widest bg-white hover:bg-black/5 transition-colors"
            style={{ borderColor: GOLD }}>
            {copied ? "✓ COPIED!" : "COPY LETTER TEXT"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Custom Builder ────────────────────────────────────────────────────────────
function CustomBuilder({ onBack }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setAnswers(prev => ({ ...prev, [k]: v }));
  const filled = CUSTOM_QUESTIONS.filter(q => answers[q.key]?.trim()).length;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = `You are an expert Australian consumer advocate. Based on the following information from someone who needs help, determine:
1. The complaint category (banking/insurance/tenancy/telco/utilities/government/legal/employment/consumer)
2. The most likely responsible organisation type
3. The correct complaint pathway and regulator/ombudsman
4. Create a full formal complaint letter (Australian style, professional, firm, plain English)

User's situation:
- Who is the complaint about: ${answers.who || "Not specified"}
- What happened: ${answers.what || "Not specified"}
- When: ${answers.when || "Not specified"}
- What they've tried: ${answers.tried || "Nothing yet"}
- Impact: ${answers.impact || "Not specified"}
- Desired outcome: ${answers.outcome || "Fair resolution"}
- Evidence available: ${answers.evidence || "Not specified"}

Return a JSON with:
- category: string
- responsible_org_type: string
- complaint_pathway: string
- regulator: string
- letter: string (the complete formal letter, plain text, no markdown)`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
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

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-base font-black px-4 py-3 rounded-xl border-2 bg-white text-black uppercase tracking-widest hover:opacity-80 transition-opacity"
        style={{ borderColor: GOLD }}>
        <ArrowLeft className="w-4 h-4" /> BACK
      </button>

      <div className="rounded-2xl border-2 bg-black px-6 py-6" style={{ borderColor: GOLD }}>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-7 h-7" style={{ color: GOLD }} />
          <h2 className="font-black text-white text-2xl uppercase">NOT SURE WHAT TO DO?</h2>
        </div>
        <p className="text-white text-lg leading-7">Tell us what happened. Our AI will work out the right letter and pathway for you.</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          {CUSTOM_QUESTIONS.map(q => (
            <div key={q.key} className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: GOLD }}>
              <label className="block font-black text-black text-lg mb-2">{q.label}</label>
              <textarea
                rows={3}
                value={answers[q.key] || ""}
                onChange={e => set(q.key, e.target.value)}
                placeholder={q.placeholder}
                className="w-full rounded-xl border-2 bg-white text-black text-lg leading-7 p-4 resize-none focus:outline-none placeholder-black/40"
                style={{ borderColor: answers[q.key] ? GOLD : "#e5e7eb" }}
              />
            </div>
          ))}

          <button
            onClick={handleGenerate}
            disabled={filled < 3 || loading}
            className="w-full py-5 rounded-2xl text-black font-black text-xl uppercase tracking-widest transition-opacity disabled:opacity-40"
            style={{ background: GOLD }}>
            {loading ? "⏳ BUILDING YOUR LETTER..." : `⚡ BUILD MY COMPLAINT LETTER (${filled}/${CUSTOM_QUESTIONS.length} answered)`}
          </button>
          {filled < 3 && (
            <p className="text-center text-base text-black/50 font-bold">Answer at least 3 questions to generate.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* AI Analysis */}
          <div className="rounded-2xl border-2 p-6" style={{ borderColor: GOLD, background: GOLD_LT }}>
            <p className="font-black text-black text-xl mb-4 uppercase">✓ WE WORKED IT OUT</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><p className="text-sm font-black uppercase" style={{ color: GOLD_DK }}>CATEGORY</p><p className="text-lg font-bold text-black capitalize">{result.category}</p></div>
              <div><p className="text-sm font-black uppercase" style={{ color: GOLD_DK }}>WHO TO COMPLAIN TO</p><p className="text-lg font-bold text-black">{result.responsible_org_type}</p></div>
              <div><p className="text-sm font-black uppercase" style={{ color: GOLD_DK }}>COMPLAINT PATHWAY</p><p className="text-lg font-bold text-black">{result.complaint_pathway}</p></div>
              <div><p className="text-sm font-black uppercase" style={{ color: GOLD_DK }}>REGULATOR / OMBUDSMAN</p><p className="text-lg font-bold text-black">{result.regulator}</p></div>
            </div>
          </div>

          {/* Generated Letter */}
          <div className="rounded-2xl border-2 bg-white overflow-hidden" style={{ borderColor: GOLD }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${GOLD}` }}>
              <p className="font-black text-black text-xl uppercase">YOUR COMPLAINT LETTER</p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.letter); }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-black font-black text-base uppercase tracking-widest"
                style={{ background: GOLD }}>
                <Copy className="w-4 h-4" /> COPY
              </button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-base text-black leading-8 font-body">{result.letter}</pre>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to="/new-case" className="flex-1">
              <button className="w-full py-4 rounded-xl text-black font-black text-base uppercase tracking-widest" style={{ background: GOLD }}>
                ⚡ CREATE A CASE
              </button>
            </Link>
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-4 rounded-xl border-2 text-black font-black text-base uppercase tracking-widest bg-white"
              style={{ borderColor: GOLD }}>
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
        <h2 className="font-black text-white text-xl uppercase tracking-widest">🚨 URGENT HELP — I NEED HELP TODAY</h2>
      </div>
      <div className="bg-white p-5">
        <p className="text-lg text-black mb-4 font-bold">Tap your situation and we'll take you straight to the right letter.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {URGENT.map((u, i) => (
            <button
              key={i}
              onClick={() => onSelectCat(u.cat)}
              className="text-left px-5 py-4 rounded-xl border-2 bg-white font-black text-lg text-black uppercase tracking-wide transition-all hover:shadow-md"
              style={{ borderColor: GOLD }}>
              → {u.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Category Hub Card ─────────────────────────────────────────────────────────
function CategoryCard({ cat, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(cat.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 8px 20px rgba(232,160,32,0.2)` }}
      className="text-left bg-white rounded-2xl border-2 overflow-hidden flex flex-col w-full transition-all"
      style={{ borderColor: GOLD }}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="text-4xl mb-3">{cat.emoji}</div>
        <h3 className="font-black text-black text-xl md:text-2xl uppercase tracking-tight leading-tight mb-2">{cat.title}</h3>
        <p className="text-base text-black/80 leading-6">{cat.desc}</p>
      </div>
      <div className="mx-5 h-0.5 mb-4" style={{ background: GOLD }} />
      <div className="px-5 pb-5 mt-auto">
        <div
          className="w-full py-3 rounded-xl text-black font-black text-base uppercase tracking-widest text-center transition-opacity hover:opacity-85"
          style={{ background: GOLD }}>
          VIEW {cat.templates.length} LETTERS →
        </div>
      </div>
    </motion.button>
  );
}

// ─── Category detail view ──────────────────────────────────────────────────────
function CategoryDetail({ cat, onSelectTemplate, onBack }) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-base font-black px-4 py-3 rounded-xl border-2 bg-white text-black uppercase tracking-widest hover:opacity-80 transition-opacity"
        style={{ borderColor: GOLD }}>
        <ArrowLeft className="w-4 h-4" /> BACK
      </button>

      <div className="rounded-2xl border-2 bg-white px-6 py-6" style={{ borderColor: GOLD }}>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{cat.emoji}</span>
          <div>
            <h2 className="font-black text-black text-2xl md:text-3xl uppercase tracking-tight">{cat.title}</h2>
            <p className="text-lg text-black/80 mt-1">{cat.desc}</p>
          </div>
        </div>
      </div>

      <p className="font-black text-black text-xl uppercase tracking-widest" style={{ color: GOLD_DK }}>
        CHOOSE YOUR LETTER:
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {cat.templates.map(tmpl => (
          <TemplateCard key={tmpl.id} tmpl={tmpl} onSelect={onSelectTemplate} />
        ))}
      </div>

      <div
        className="rounded-2xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ borderColor: GOLD, background: GOLD_LT }}>
        <div className="flex-1">
          <p className="font-black text-black text-lg">Don't see the right letter?</p>
          <p className="text-base text-black/70">Use our AI builder to create a custom complaint from scratch.</p>
        </div>
        <Link to="#custom" className="shrink-0">
          <button
            className="px-6 py-3 rounded-xl text-black font-black text-base uppercase tracking-widest border-2 bg-white"
            style={{ borderColor: GOLD }}>
            AI BUILDER →
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TemplateLibrary() {
  const [view, setView]                     = useState("home"); // home | category | custom
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

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-black px-6 py-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-7 h-7" style={{ color: GOLD }} />
          <h1 className="font-black text-white text-2xl md:text-3xl uppercase tracking-tighter">
            COMPLAINT & DISPUTE LETTER BUILDER
          </h1>
        </div>
        <p className="text-lg text-white/80 leading-7">
          Choose your problem. We'll help you create the right complaint, request or escalation letter.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link to="/new-case">
            <button className="px-6 py-3 rounded-xl text-black font-black text-base uppercase tracking-widest transition-opacity hover:opacity-85"
              style={{ background: GOLD }}>
              START A CASE →
            </button>
          </Link>
          <button
            onClick={() => setView("custom")}
            className="px-6 py-3 rounded-xl border-2 text-white font-black text-base uppercase tracking-widest hover:bg-white/10 transition-colors"
            style={{ borderColor: GOLD }}>
            NOT SURE? AI BUILDER
          </button>
        </div>
      </div>

      {/* ── HOME: category grid ────────────────────────────────────────── */}
      {view === "home" && (
        <>
          <UrgentHelp onSelectCat={handleSelectCat} />

          <p className="font-black text-black text-xl md:text-2xl uppercase tracking-widest mb-5">
            WHAT IS YOUR PROBLEM?
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.id} cat={cat} onSelect={handleSelectCat} />
            ))}

            {/* Something Else card */}
            <motion.button
              onClick={() => setView("custom")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, boxShadow: `0 8px 20px rgba(232,160,32,0.2)` }}
              className="text-left bg-black rounded-2xl border-2 overflow-hidden flex flex-col w-full transition-all"
              style={{ borderColor: GOLD }}
            >
              <div className="px-5 pt-5 pb-4 flex-1">
                <div className="text-4xl mb-3">🧩</div>
                <h3 className="font-black text-white text-xl md:text-2xl uppercase tracking-tight leading-tight mb-2">
                  SOMETHING ELSE / NOT SURE
                </h3>
                <p className="text-base leading-6" style={{ color: GOLD_LT }}>
                  Not sure where your problem belongs? Tell us what happened and our AI will work it out.
                </p>
              </div>
              <div className="mx-5 h-0.5 mb-4" style={{ background: GOLD }} />
              <div className="px-5 pb-5">
                <div
                  className="w-full py-3 rounded-xl text-black font-black text-base uppercase tracking-widest text-center"
                  style={{ background: GOLD }}>
                  USE AI BUILDER →
                </div>
              </div>
            </motion.button>
          </div>
        </>
      )}

      {/* ── CATEGORY DETAIL ────────────────────────────────────────────── */}
      {view === "category" && selectedCat && (
        <CategoryDetail
          cat={selectedCat}
          onSelectTemplate={setSelectedTemplate}
          onBack={handleBack}
        />
      )}

      {/* ── CUSTOM AI BUILDER ──────────────────────────────────────────── */}
      {view === "custom" && (
        <CustomBuilder onBack={() => setView("home")} />
      )}

      {/* ── Letter Preview Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTemplate && (
          <LetterPreview
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}