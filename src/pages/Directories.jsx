import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { providers, CATEGORY_HUBS } from "@/lib/providersData";
import MyOrganisations from "@/components/directories/MyOrganisations";
import { Link } from "react-router-dom";
import {
  Search, Phone, Globe, Plus, Star, ChevronDown, ChevronUp,
  AlertCircle, MapPin, ArrowLeft, Scale, Shield, BookOpen, Zap
} from "lucide-react";

// ─── Brand colours (Chaos Controller gold) ───────────────────────────────────
const GOLD   = "#E8A020";
const GOLD_DK = "#D4930A";
const GOLD_LT = "#FEF3D0";

const HUB_CATEGORY_MAP = {
  banking:        "Banking & Finance",
  tenancy:        "Tenancy & Housing",
  utilities:      "Utilities",
  telco:          "Telecommunications",
  legal:          "Legal Help",
  government:     "Government Complaints",
  health:         "Health Complaints",
  disability:     "Disability / NDIS",
  "human-rights": "Human Rights / Discrimination",
  dv:             "Domestic Violence / Safety",
  consumer:       "Consumer Rights",
  police:         "Police / AVO / Court",
  employment:     "Employment",
  privacy:        "Privacy / Information Access",
};

// Short blurbs for category cards (compact, not essays)
const HUB_SHORT = {
  banking:        "Banks, insurance, super, credit, hardship, chargebacks",
  tenancy:        "Rental disputes, bonds, repairs, evictions, housing",
  utilities:      "Electricity, gas, water, billing, disconnections",
  telco:          "Mobile, internet, NBN, billing, contracts, speeds",
  legal:          "Free legal advice, court help, referrals nationwide",
  government:     "Centrelink, ATO, councils, government agencies",
  health:         "Doctors, hospitals, Medicare, health practitioners",
  disability:     "NDIS plans, providers, access, advocacy, carers",
  "human-rights": "Discrimination, harassment, race, sex, disability, age",
  dv:             "Family violence, safety, protection orders, crisis support",
  consumer:       "Defective products, refunds, misleading ads, builders",
  police:         "Police misconduct, AVOs, court preparation, victims",
  employment:     "Underpayment, unfair dismissal, workplace bullying",
  privacy:        "Privacy breaches, data misuse, FOI requests, records",
};

// Top 3 disputes per hub (compact)
const HUB_TOP_DISPUTES = {
  banking:        ["Frozen or closed account", "Chargeback refused", "Insurance claim denied"],
  tenancy:        ["Bond withheld", "Repairs ignored", "Unlawful eviction"],
  utilities:      ["Incorrect energy bill", "Wrongful disconnection", "Refused payment plan"],
  telco:          ["Billed for service not received", "No service or outage", "Contract dispute"],
  legal:          ["Need free legal advice", "Facing court or tribunal", "AVO or protection order"],
  government:     ["Centrelink payment stopped", "ATO decision wrong", "Agency not responding"],
  health:         ["Unsafe medical care", "Hospital complaint", "Medicare billing error"],
  disability:     ["NDIS access denied", "Plan funding cut", "Provider misconduct"],
  "human-rights": ["Workplace discrimination", "Sexual harassment", "Racial vilification"],
  dv:             ["Need safety planning", "AVO or DVO help", "Emergency accommodation"],
  consumer:       ["Product faulty, no refund", "Misleading advertising", "Builder not completing work"],
  police:         ["Excessive force", "Unlawful arrest", "AVO served — need help"],
  employment:     ["Underpaid wages", "Unfair dismissal", "Workplace bullying"],
  privacy:        ["Data shared without consent", "FOI request refused", "Data breach"],
};

const ALL_STATES = ["All", "National", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const SERVICE_BADGE = {
  "Ombudsman":             `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Regulator":             `bg-white text-black border-[#E8A020]`,
  "Tribunal":              `bg-white text-black border-[#E8A020]`,
  "Legal Aid":             `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Community Legal Centre":`bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Crisis Support":        `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Referral Service":      `bg-white text-black border-[#E8A020]`,
  "Advocacy Service":      `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Financial Counselling": `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Tenancy Advice":        `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Housing Support":       `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Disability Support":    `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Health Complaints":     `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Police Complaints":     `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Human Rights":          `bg-[#FEF3D0] text-black border-[#E8A020]`,
  "Government Complaints": `bg-white text-black border-[#E8A020]`,
  "Court Support":         `bg-white text-black border-[#E8A020]`,
};
function badge(type) { return SERVICE_BADGE[type] || "bg-white text-black border-[#E8A020]"; }

// ─── Compact Category Card ────────────────────────────────────────────────────
function HubCard({ hub, onSelect }) {
  const topDisputes = HUB_TOP_DISPUTES[hub.id] || [];
  const shortDesc   = HUB_SHORT[hub.id] || hub.covers?.substring(0, 80);

  return (
    <motion.button
      onClick={() => onSelect(hub.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 8px 24px rgba(232,160,32,0.2)` }}
      className="text-left bg-white rounded-2xl border-2 overflow-hidden flex flex-col w-full transition-all"
      style={{ borderColor: GOLD }}
    >
      {/* Icon + Title */}
      <div className="px-5 pt-5 pb-4">
        <div className="text-3xl mb-2">{hub.emoji}</div>
        <h3 className="font-black text-black text-xl md:text-2xl uppercase tracking-tight leading-tight">
          {hub.title}
        </h3>
        <p className="text-base text-black mt-1.5 leading-6">{shortDesc}</p>
      </div>

      {/* Gold divider */}
      <div className="mx-5 h-0.5" style={{ background: GOLD }} />

      {/* Top disputes */}
      <div className="px-5 pt-3 pb-3 flex-1">
        <ul className="space-y-1.5">
          {topDisputes.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-black leading-6">
              <span className="font-black shrink-0" style={{ color: GOLD }}>✓</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Who helps — compact pills */}
      <div className="px-5 pb-3">
        <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: GOLD_DK }}>WHO HELPS</p>
        <p className="text-sm text-black font-semibold leading-5">
          {hub.who.slice(0, 4).join(" • ")}
          {hub.who.length > 4 && <span className="text-black/50"> +{hub.who.length - 4} more</span>}
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <div
          className="w-full py-3 rounded-xl text-black font-black text-base uppercase tracking-widest text-center transition-opacity hover:opacity-85"
          style={{ background: GOLD }}>
          VIEW HELP OPTIONS →
        </div>
      </div>
    </motion.button>
  );
}

// ─── Category Detail Header (shown after clicking) ────────────────────────────
function HubDetail({ hub }) {
  return (
    <div className="rounded-2xl border-2 bg-white p-6 mb-6" style={{ borderColor: GOLD }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{hub.emoji}</span>
        <div>
          <h2 className="font-black text-black text-2xl md:text-3xl uppercase tracking-tight">{hub.title}</h2>
          <p className="text-base text-black mt-0.5">{hub.covers}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <div>
          <p className="text-base font-black uppercase tracking-widest mb-3" style={{ color: GOLD_DK }}>COMMON DISPUTES</p>
          <ul className="space-y-2">
            {hub.disputes.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-black leading-6">
                <span className="font-black shrink-0" style={{ color: GOLD }}>✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-base font-black uppercase tracking-widest mb-3" style={{ color: GOLD_DK }}>WHO CAN HELP</p>
          <div className="flex flex-wrap gap-2">
            {hub.who.map(w => (
              <span key={w} className="text-sm font-bold px-3 py-1 rounded-full border-2 text-black"
                style={{ background: GOLD_LT, borderColor: GOLD }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({ p, saved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all"
      style={{ borderColor: GOLD }}>

      {p.emergency && (
        <div className="px-4 py-2 text-sm font-black text-black uppercase tracking-widest text-center"
          style={{ background: GOLD }}>
          🆘 EMERGENCY / 24-HOUR SERVICE
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-black text-black text-xl md:text-2xl leading-tight">{p.name}</h3>
            {p.fullName !== p.name && (
              <p className="text-sm text-black/70 mt-0.5 leading-snug">{p.fullName}</p>
            )}
          </div>
          <button onClick={() => onToggleSave(p.id)} className="shrink-0 ml-2 mt-0.5">
            <Star className="w-6 h-6" style={{ fill: saved ? GOLD : "none", color: saved ? GOLD : "#ccc" }} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full border-2 ${badge(p.serviceType)}`}>
            {p.serviceType}
          </span>
          <span className="text-sm font-bold px-3 py-1 rounded-full border-2 text-black"
            style={{ background: GOLD_LT, borderColor: GOLD }}>
            <MapPin className="w-3 h-3 inline mr-1" style={{ color: GOLD_DK }} />
            {p.state}
          </span>
        </div>
      </div>

      {/* What they do */}
      <div className="px-5 pb-4 flex-1">
        <p className="text-base text-black leading-7">{p.whatTheyDo}</p>
      </div>

      {/* Handles */}
      {p.handles?.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: GOLD_DK }}>HANDLES</p>
          <div className="flex flex-wrap gap-1.5">
            {p.handles.slice(0, 5).map(h => (
              <span key={h} className="text-sm font-semibold px-2.5 py-1 rounded-lg border text-black"
                style={{ background: GOLD_LT, borderColor: GOLD }}>
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="px-5 pb-4 space-y-2" style={{ borderTop: `1.5px solid ${GOLD}` }}>
        <div className="pt-3" />
        {p.phone && (
          <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-base text-black font-bold hover:underline">
            <Phone className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            {p.phone}
          </a>
        )}
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-base text-black font-bold hover:underline truncate">
            <Globe className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            {p.website.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        )}
      </div>

      {/* Use this when — collapsible */}
      {p.useThisWhen?.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition-colors hover:opacity-80"
            style={{ background: GOLD_LT, borderTop: `1.5px solid ${GOLD}` }}>
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: GOLD_DK }} />
              USE THIS WHEN
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <ul className="px-5 py-4 space-y-2 bg-white">
                  {p.useThisWhen.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-black leading-6">
                      <span className="font-black shrink-0" style={{ color: GOLD }}>✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Action buttons */}
      <div className="px-5 pb-5 pt-4 flex gap-2 flex-wrap" style={{ borderTop: `1.5px solid ${GOLD}` }}>
        <Link to="/new-case" className="flex-1">
          <button className="w-full py-3 rounded-xl text-black font-black text-base uppercase tracking-widest flex items-center justify-center gap-1.5 transition-opacity hover:opacity-85"
            style={{ background: GOLD }}>
            <Plus className="w-4 h-4" /> CREATE CASE
          </button>
        </Link>
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer">
            <button className="py-3 px-4 rounded-xl border-2 text-black text-base font-black uppercase tracking-widest bg-white flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              style={{ borderColor: GOLD }}>
              <Globe className="w-4 h-4" style={{ color: GOLD }} /> SITE
            </button>
          </a>
        )}
        {p.phone && (
          <a href={`tel:${p.phone}`}>
            <button className="py-3 px-4 rounded-xl border-2 text-black text-base font-black uppercase tracking-widest bg-white flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              style={{ borderColor: GOLD }}>
              <Phone className="w-4 h-4" style={{ color: GOLD }} /> CALL
            </button>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── State filter pill ────────────────────────────────────────────────────────
function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="text-sm font-black px-4 py-2 rounded-full border-2 tracking-wide transition-all whitespace-nowrap"
      style={active
        ? { background: "#000", borderColor: "#000", color: GOLD }
        : { background: "#fff", borderColor: GOLD, color: "#000" }}>
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Directories() {
  const [activeTab, setActiveTab]     = useState("directory");
  const [selectedHub, setSelectedHub] = useState(null);
  const [stateFilter, setStateFilter] = useState("All");
  const [search, setSearch]           = useState("");
  const [savedIds, setSavedIds]       = useState(new Set());
  const [showBrowse, setShowBrowse]   = useState(false);

  const toggleSave = (id) => setSavedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSelectHub = (hubId) => {
    setSelectedHub(hubId);
    setShowBrowse(true);
    setStateFilter("All");
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setShowBrowse(false);
    setSelectedHub(null);
    setSearch("");
  };

  const filtered = useMemo(() => {
    return providers.filter(p => {
      const catMatch    = selectedHub ? p.category === HUB_CATEGORY_MAP[selectedHub] : true;
      const stateMatch  = stateFilter === "All" || p.state === stateFilter || p.state === "National";
      const searchMatch = !search || [p.name, p.fullName, p.description, p.whatTheyDo, ...(p.handles || []), ...(p.tags || [])]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()));
      return catMatch && stateMatch && searchMatch;
    });
  }, [selectedHub, stateFilter, search]);

  const grouped = useMemo(() => {
    if (selectedHub) return null;
    const map = {};
    filtered.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [filtered, selectedHub]);

  const savedProviders = useMemo(() => providers.filter(p => savedIds.has(p.id)), [savedIds]);
  const hubConfig = selectedHub ? CATEGORY_HUBS.find(h => h.id === selectedHub) : null;

  const tabs = [
    { id: "directory", label: "Directory" },
    { id: "saved",     label: `Saved${savedIds.size > 0 ? ` (${savedIds.size})` : ""}` },
    { id: "my-orgs",   label: "My Organisations" },
  ];

  return (
    <div className="pb-16 min-h-screen" style={{ background: "#FFFDF7" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-black px-6 py-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-6 h-6" style={{ color: GOLD }} />
            <h1 className="font-black text-white text-2xl md:text-3xl uppercase tracking-tight">TAKE BACK CONTROL</h1>
          </div>
          <p className="text-base text-white/80 leading-6">
            Find who handles your complaint. Build your case. Escalate properly.
          </p>
        </div>
        <Link to="/new-case" className="shrink-0">
          <button className="px-6 py-3 rounded-xl text-black font-black text-base uppercase tracking-widest transition-opacity hover:opacity-85"
            style={{ background: GOLD }}>
            START A CASE →
          </button>
        </Link>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowBrowse(false); setSelectedHub(null); }}
            className="flex-1 py-3 rounded-xl border-2 text-base font-black uppercase tracking-widest transition-all"
            style={activeTab === tab.id
              ? { background: "#000", borderColor: "#000", color: GOLD }
              : { background: "#fff", borderColor: GOLD, color: "#000" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: DIRECTORY ════════════════════════════════════════════════ */}
      {activeTab === "directory" && (
        <>
          {/* CATEGORY HUB GRID */}
          {!showBrowse && (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-black text-black text-xl md:text-2xl uppercase tracking-tight">
                  What's your issue?
                </h2>
                <button onClick={() => setShowBrowse(true)}
                  className="text-sm font-black px-4 py-2 rounded-xl border-2 bg-white text-black uppercase tracking-widest hover:opacity-80 transition-opacity"
                  style={{ borderColor: GOLD }}>
                  Browse all {providers.length} →
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORY_HUBS.map(hub => (
                  <HubCard key={hub.id} hub={hub} onSelect={handleSelectHub} />
                ))}
              </div>
            </>
          )}

          {/* PROVIDER BROWSE VIEW */}
          {showBrowse && (
            <>
              {/* Back + breadcrumb */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button onClick={handleBack}
                  className="flex items-center gap-2 text-base font-black px-4 py-2.5 rounded-xl border-2 bg-white text-black uppercase tracking-widest hover:opacity-80 transition-opacity"
                  style={{ borderColor: GOLD }}>
                  <ArrowLeft className="w-4 h-4" /> CATEGORIES
                </button>
                {hubConfig && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{hubConfig.emoji}</span>
                    <span className="font-black text-black text-xl uppercase tracking-tight">{hubConfig.title}</span>
                  </div>
                )}
                <span className="ml-auto text-sm font-black px-3 py-1.5 rounded-lg border-2"
                  style={{ color: GOLD_DK, borderColor: GOLD, background: GOLD_LT }}>
                  {filtered.length} providers
                </span>
              </div>

              {/* Hub detail block (full explanation) */}
              {hubConfig && <HubDetail hub={hubConfig} />}

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full pl-12 pr-5 py-4 rounded-xl border-2 bg-white text-lg text-black placeholder-black/40 focus:outline-none"
                  style={{ borderColor: GOLD }} />
              </div>

              {/* State filter pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-sm font-black uppercase tracking-widest self-center shrink-0" style={{ color: GOLD_DK }}>STATE:</span>
                {ALL_STATES.map(s => <Pill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(s)} />)}
              </div>

              {/* Results */}
              {filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 bg-white" style={{ borderColor: GOLD }}>
                  <Search className="w-10 h-10 mx-auto mb-3 text-black/30" />
                  <p className="font-black text-black text-xl">No results found</p>
                  <p className="text-base text-black/60 mt-1">Try adjusting your search or filters.</p>
                </div>
              ) : selectedHub ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(p => <ProviderCard key={p.id} p={p} saved={savedIds.has(p.id)} onToggleSave={toggleSave} />)}
                </div>
              ) : (
                <div className="space-y-10">
                  {Object.entries(grouped).map(([cat, catProviders]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-0.5 flex-1" style={{ background: GOLD }} />
                        <h3 className="font-black text-black text-lg uppercase tracking-wide">{cat}</h3>
                        <span className="text-sm font-black px-2.5 py-1 rounded-lg border-2"
                          style={{ color: GOLD_DK, borderColor: GOLD, background: GOLD_LT }}>
                          {catProviders.length}
                        </span>
                        <div className="h-0.5 flex-1" style={{ background: GOLD }} />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catProviders.map(p => <ProviderCard key={p.id} p={p} saved={savedIds.has(p.id)} onToggleSave={toggleSave} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══ TAB: SAVED ════════════════════════════════════════════════════ */}
      {activeTab === "saved" && (
        savedProviders.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedProviders.map(p => <ProviderCard key={p.id} p={p} saved={true} onToggleSave={toggleSave} />)}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border-2 bg-white" style={{ borderColor: GOLD }}>
            <Star className="w-10 h-10 mx-auto mb-3 text-black/30" />
            <p className="font-black text-black text-xl">No saved providers yet</p>
            <p className="text-base text-black/60 mt-1">Tap ★ on any card to save it here.</p>
          </div>
        )
      )}

      {/* ══ TAB: MY ORGANISATIONS ═════════════════════════════════════════ */}
      {activeTab === "my-orgs" && <MyOrganisations />}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 shadow-sm"
        style={{ borderColor: GOLD }}>
        <p className="text-sm text-black/70 italic flex-1">
          <strong className="not-italic font-black text-black">Disclaimer:</strong> Chaos Controller provides educational and document management assistance only — not legal advice. Always verify contact details on the provider's official website.
        </p>
        <div className="flex items-center gap-5 shrink-0">
          <Link to="/terms"   className="text-sm text-black font-black hover:underline flex items-center gap-1"><Scale className="w-4 h-4" style={{ color: GOLD }} /> Terms</Link>
          <Link to="/privacy" className="text-sm text-black font-black hover:underline flex items-center gap-1"><Shield className="w-4 h-4" style={{ color: GOLD }} /> Privacy</Link>
          <Link to="/help"    className="text-sm text-black font-black hover:underline flex items-center gap-1"><BookOpen className="w-4 h-4" style={{ color: GOLD }} /> Help</Link>
        </div>
      </div>
    </div>
  );
}