import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { providers, CATEGORY_HUBS } from "@/lib/providersData";
import MyOrganisations from "@/components/directories/MyOrganisations";
import { Link } from "react-router-dom";
import {
  Search, Phone, Globe, Plus, Star, ChevronDown, ChevronUp,
  AlertCircle, MapPin, Scale, Shield, BookOpen, ArrowLeft
} from "lucide-react";

// ─── Brand palette — extracted from Chaos Controller logo ────────────────────
// The golden yellow from "CONTROLLER" text in the logo
const BRAND    = "#E8A020";   // primary brand gold-yellow
const BRAND_DK = "#C4830A";   // darker variant for hover / borders
const BRAND_LT = "#FEF3D0";   // very light tint for backgrounds

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
  "Disability Support":    `bg-[#FEF3D0] text-black border-[#E8A020]`,
};
function badge(type) { return SERVICE_BADGE[type] || "bg-white text-black border-[#E8A020]"; }

// ─── Category Hub Card ────────────────────────────────────────────────────────
function HubCard({ hub, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(hub.id)}
      whileHover={{ scale: 1.01, boxShadow: `0 8px 32px rgba(232,160,32,0.18)` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-left rounded-2xl border-2 bg-white overflow-hidden flex flex-col w-full transition-all"
      style={{ borderColor: "#E8A020", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
    >
      {/* Title row */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-4" style={{ borderBottom: "2px solid #E8A020" }}>
        <span className="text-4xl leading-none">{hub.emoji}</span>
        <h3 className="font-black text-black text-2xl md:text-3xl uppercase tracking-tight leading-tight">{hub.title}</h3>
      </div>

      {/* WHAT THIS COVERS */}
      <div className="px-6 pt-5 pb-4">
        <p className="text-lg font-black uppercase tracking-widest mb-3" style={{ color: "#C4830A" }}>WHAT THIS COVERS</p>
        <p className="text-lg text-black leading-8">{hub.covers}</p>
      </div>

      {/* COMMON DISPUTES */}
      <div className="px-6 pb-4">
        <p className="text-lg font-black uppercase tracking-widest mb-3" style={{ color: "#C4830A" }}>COMMON DISPUTES</p>
        <ul className="space-y-2">
          {hub.disputes.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-lg text-black leading-7">
              <span className="font-black mt-0.5 shrink-0" style={{ color: "#E8A020" }}>✓</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* WHO CAN HELP */}
      <div className="px-6 pb-5 flex-1">
        <p className="text-lg font-black uppercase tracking-widest mb-3" style={{ color: "#C4830A" }}>WHO CAN HELP</p>
        <div className="flex flex-wrap gap-2">
          {hub.who.map(w => (
            <span key={w}
              className="text-base font-extrabold px-3 py-1 rounded-full border-2 text-black"
              style={{ background: "#FEF3D0", borderColor: "#E8A020" }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <div className="px-6 pb-6">
        <div
          className="w-full py-4 rounded-xl text-black font-black text-lg uppercase tracking-widest text-center transition-opacity hover:opacity-90"
          style={{ background: "#E8A020" }}>
          VIEW {hub.title} CONTACTS →
        </div>
      </div>
    </motion.button>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({ p, saved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex flex-col rounded-2xl border-2 bg-white overflow-hidden transition-all hover:shadow-lg"
      style={{ borderColor: "#E8A020", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {p.emergency && (
        <div className="px-5 py-2 text-base font-black text-black uppercase tracking-widest"
          style={{ background: "#E8A020" }}>
          🆘 EMERGENCY / 24-HOUR SERVICE
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-black text-2xl md:text-3xl leading-tight mb-2">{p.name}</h3>
            {p.fullName !== p.name && (
              <p className="text-lg text-black leading-snug mb-3">{p.fullName}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-base font-extrabold px-3 py-1 rounded-full border-2 ${badge(p.serviceType)}`}>
                {p.serviceType}
              </span>
              <span className="flex items-center gap-1.5 text-lg font-black" style={{ color: "#C4830A" }}>
                <MapPin className="w-4 h-4" />
                {p.state}
              </span>
            </div>
          </div>
          <button onClick={() => onToggleSave(p.id)} className="shrink-0 transition-colors mt-1">
            <Star className="w-7 h-7" style={{ fill: saved ? "#E8A020" : "none", color: saved ? "#E8A020" : "#ccc" }} />
          </button>
        </div>
      </div>

      {/* What they do */}
      <div className="px-6 pb-4 flex-1">
        <p className="text-lg font-black uppercase tracking-widest mb-2" style={{ color: "#C4830A" }}>WHAT THEY DO</p>
        <p className="text-lg text-black leading-8">{p.whatTheyDo}</p>
      </div>

      {/* Handles chips */}
      {p.handles?.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {p.handles.map(h => (
            <span key={h}
              className="text-base font-bold px-3 py-1 rounded-full border-2 text-black"
              style={{ background: "#FEF3D0", borderColor: "#E8A020" }}>
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Contact */}
      <div className="px-6 pb-4 space-y-2">
        <p className="text-lg font-black uppercase tracking-widest mb-2" style={{ color: "#C4830A" }}>CONTACT</p>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="flex items-center gap-3 text-lg text-black font-bold hover:underline">
            <Phone className="w-5 h-5 shrink-0" style={{ color: "#E8A020" }} />
            <span>{p.phone}</span>
          </a>
        )}
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-lg text-black font-bold hover:underline">
            <Globe className="w-5 h-5 shrink-0" style={{ color: "#E8A020" }} />
            <span className="truncate">{p.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
          </a>
        )}
      </div>

      {/* Use this when — collapsible */}
      {p.useThisWhen?.length > 0 && (
        <div style={{ borderTop: "2px solid #E8A020" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-6 py-4 text-lg font-black text-black uppercase tracking-widest hover:bg-[#FEF3D0] transition-colors"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: "#E8A020" }} />
              USE THIS WHEN
            </span>
            {expanded
              ? <ChevronUp className="w-5 h-5" />
              : <ChevronDown className="w-5 h-5" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <ul className="px-6 pb-5 space-y-2">
                  {p.useThisWhen.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-lg text-black leading-7">
                      <span className="font-black mt-0.5 shrink-0" style={{ color: "#E8A020" }}>✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-6 pb-6 pt-4 flex flex-wrap gap-3" style={{ borderTop: "2px solid #E8A020" }}>
        <Link to="/new-case" className="flex-1 min-w-[140px]">
          <button
            className="w-full py-4 rounded-xl text-black font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "#E8A020" }}>
            <Plus className="w-5 h-5" /> CREATE CASE
          </button>
        </Link>
        <div className="flex gap-2 flex-wrap">
          {p.website && (
            <a href={p.website} target="_blank" rel="noopener noreferrer">
              <button
                className="h-14 px-5 rounded-xl border-2 text-black text-lg font-black uppercase tracking-widest bg-white flex items-center gap-2 transition-colors hover:bg-[#FEF3D0]"
                style={{ borderColor: "#E8A020" }}>
                <Globe className="w-5 h-5" style={{ color: "#E8A020" }} /> SITE
              </button>
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`}>
              <button
                className="h-14 px-5 rounded-xl border-2 text-black text-lg font-black uppercase tracking-widest bg-white flex items-center gap-2 transition-colors hover:bg-[#FEF3D0]"
                style={{ borderColor: "#E8A020" }}>
                <Phone className="w-5 h-5" style={{ color: "#E8A020" }} /> CALL
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── State filter pill ────────────────────────────────────────────────────────
function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-lg font-black px-5 py-2.5 rounded-full border-2 tracking-wide transition-all whitespace-nowrap"
      style={active
        ? { background: "#E8A020", borderColor: "#E8A020", color: "#000" }
        : { background: "#fff", borderColor: "#ccc", color: "#000" }}
    >
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
    { id: "directory", label: "📋 DIRECTORY" },
    { id: "saved",     label: `⭐ SAVED${savedIds.size > 0 ? ` (${savedIds.size})` : ""}` },
    { id: "my-orgs",   label: "🏢 MY ORGANISATIONS" },
  ];

  return (
    <div className="pb-20 min-h-screen" style={{ background: "#FFFDF7" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl bg-white px-7 py-8 mb-8 shadow-md border-2"
        style={{ borderColor: "#E8A020" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">⚡</span>
          <h1 className="font-black text-black text-4xl md:text-5xl uppercase tracking-tighter">TAKE BACK CONTROL</h1>
        </div>
        <p className="font-black text-xl md:text-2xl uppercase tracking-wide mb-3" style={{ color: "#C4830A" }}>
          Find the organisation responsible. Know your rights. Escalate your complaint.
        </p>
        <p className="text-black text-xl md:text-2xl leading-9">
          Australia-wide complaint, dispute, advocacy and referral directory — {providers.length}+ providers across every state and territory.
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 px-6 py-5 rounded-xl text-xl font-black uppercase tracking-widest border-2 transition-all"
            style={activeTab === tab.id
              ? { background: "#E8A020", borderColor: "#E8A020", color: "#000" }
              : { background: "#fff", borderColor: "#E8A020", color: "#000" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: DIRECTORY ════════════════════════════════════════════════ */}
      {activeTab === "directory" && (
        <>
          {/* CATEGORY HUB CARDS */}
          {!showBrowse && (
            <>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <p className="text-lg font-black uppercase tracking-widest mb-1" style={{ color: "#C4830A" }}>WHAT IS YOUR ISSUE?</p>
                  <h2 className="font-black text-black text-3xl md:text-4xl uppercase tracking-tight">Choose your dispute type</h2>
                </div>
                <button
                  onClick={() => setShowBrowse(true)}
                  className="text-lg font-black text-black border-2 bg-white px-5 py-3 rounded-xl hover:bg-[#FEF3D0] transition-colors"
                  style={{ borderColor: "#E8A020" }}>
                  Browse all {providers.length} →
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CATEGORY_HUBS.map(hub => (
                  <HubCard key={hub.id} hub={hub} onSelect={handleSelectHub} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowBrowse(true)}
                  className="text-xl text-black font-black hover:underline"
                  style={{ color: "#C4830A" }}>
                  Browse full directory without filtering →
                </button>
              </div>
            </>
          )}

          {/* PROVIDER LIST */}
          {showBrowse && (
            <>
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-xl text-black font-black border-2 bg-white px-5 py-3 rounded-xl hover:bg-[#FEF3D0] transition-colors"
                  style={{ borderColor: "#E8A020" }}>
                  <ArrowLeft className="w-5 h-5" /> BACK
                </button>
                {hubConfig && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{hubConfig.emoji}</span>
                    <h2 className="font-black text-black text-2xl md:text-3xl uppercase tracking-tight">{hubConfig.title}</h2>
                  </div>
                )}
                <span
                  className="ml-auto text-lg font-black border-2 px-4 py-2 rounded-xl"
                  style={{ color: "#C4830A", borderColor: "#E8A020", background: "#FEF3D0" }}>
                  {filtered.length} providers
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-black/40" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, service, state..."
                  className="w-full pl-14 pr-6 py-5 rounded-xl border-2 bg-white text-xl text-black placeholder-black/40 focus:outline-none transition-colors"
                  style={{ borderColor: "#E8A020" }}
                />
              </div>

              {/* State pills */}
              <div className="flex items-center gap-3 flex-wrap mb-8">
                <span className="text-lg font-black uppercase tracking-widest shrink-0" style={{ color: "#C4830A" }}>STATE:</span>
                {ALL_STATES.map(s => <Pill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(s)} />)}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border-2 bg-white shadow-sm" style={{ borderColor: "#E8A020" }}>
                  <Search className="w-12 h-12 mx-auto mb-4 text-black/30" />
                  <p className="font-black text-black text-2xl">No results found</p>
                  <p className="text-xl text-black mt-2">Try adjusting your search or filters.</p>
                </div>
              ) : selectedHub ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map(p => <ProviderCard key={p.id} p={p} saved={savedIds.has(p.id)} onToggleSave={toggleSave} />)}
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.entries(grouped).map(([cat, catProviders]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-4 mb-5">
                        <div className="h-0.5 flex-1" style={{ background: "#E8A020" }} />
                        <h3 className="font-black text-black text-2xl uppercase tracking-wide px-2">{cat}</h3>
                        <span
                          className="text-lg font-black px-3 py-1 rounded-lg border-2"
                          style={{ color: "#C4830A", borderColor: "#E8A020", background: "#FEF3D0" }}>
                          {catProviders.length}
                        </span>
                        <div className="h-0.5 flex-1" style={{ background: "#E8A020" }} />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProviders.map(p => <ProviderCard key={p.id} p={p} saved={true} onToggleSave={toggleSave} />)}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border-2 bg-white shadow-sm" style={{ borderColor: "#E8A020" }}>
            <Star className="w-12 h-12 mx-auto mb-4 text-black/30" />
            <p className="font-black text-black text-2xl">No saved providers yet</p>
            <p className="text-xl text-black mt-2">Click the ★ on any card to save it here.</p>
          </div>
        )
      )}

      {/* ══ TAB: MY ORGANISATIONS ═════════════════════════════════════════ */}
      {activeTab === "my-orgs" && <MyOrganisations />}

      {/* ── Footer disclaimer ─────────────────────────────────────────────── */}
      <div
        className="rounded-xl bg-white p-6 mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-2 shadow-sm"
        style={{ borderColor: "#E8A020" }}>
        <p className="text-lg text-black italic flex-1">
          <strong className="not-italic font-black">Disclaimer:</strong> Chaos Controller provides educational and document management assistance only — not legal advice. Always verify contact details on the provider's official website.
        </p>
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/terms"   className="text-lg text-black font-black hover:underline flex items-center gap-1.5"><Scale className="w-5 h-5" style={{ color: "#E8A020" }} /> Terms</Link>
          <Link to="/privacy" className="text-lg text-black font-black hover:underline flex items-center gap-1.5"><Shield className="w-5 h-5" style={{ color: "#E8A020" }} /> Privacy</Link>
          <Link to="/help"    className="text-lg text-black font-black hover:underline flex items-center gap-1.5"><BookOpen className="w-5 h-5" style={{ color: "#E8A020" }} /> Help</Link>
        </div>
      </div>
    </div>
  );
}