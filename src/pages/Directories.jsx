import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { providers, CATEGORY_HUBS } from "@/lib/providersData";
import MyOrganisations from "@/components/directories/MyOrganisations";
import { Link } from "react-router-dom";
import {
  Search, Phone, Mail, Globe, Plus, Star, ChevronDown, ChevronUp,
  AlertCircle, MapPin, Scale, Shield, BookOpen, ArrowLeft
} from "lucide-react";

// ─── Category → provider filter mapping ──────────────────────────────────────
const HUB_CATEGORY_MAP = {
  banking:      "Banking & Finance",
  tenancy:      "Tenancy & Housing",
  utilities:    "Utilities",
  telco:        "Telecommunications",
  legal:        "Legal Help",
  government:   "Government Complaints",
  health:       "Health Complaints",
  disability:   "Disability / NDIS",
  "human-rights": "Human Rights / Discrimination",
  dv:           "Domestic Violence / Safety",
  consumer:     "Consumer Rights",
  police:       "Police / AVO / Court",
};

const ALL_CATEGORIES = [
  "Banking & Finance","Tenancy & Housing","Utilities","Telecommunications",
  "Legal Help","Government Complaints","Health Complaints","Disability / NDIS",
  "Human Rights / Discrimination","Domestic Violence / Safety","Consumer Rights",
  "Police / AVO / Court","Housing / Homelessness",
];

const ALL_STATES = ["All","National","NSW","VIC","QLD","SA","WA","TAS","NT","ACT"];

const SERVICE_TYPE_COLORS = {
  "Ombudsman":            "border-yellow-500/40 text-yellow-300",
  "Regulator":            "border-blue-500/40 text-blue-300",
  "Tribunal":             "border-purple-400/40 text-purple-300",
  "Legal Aid":            "border-green-500/40 text-green-300",
  "Community Legal Centre":"border-green-400/40 text-green-300",
  "Crisis Support":       "border-red-400/40 text-red-300",
  "Referral Service":     "border-zinc-400/40 text-zinc-300",
  "Advocacy Service":     "border-orange-400/40 text-orange-300",
  "Financial Counselling":"border-yellow-400/40 text-yellow-200",
  "Tenancy Advice":       "border-green-400/40 text-green-200",
  "Housing Support":      "border-teal-400/40 text-teal-300",
  "Disability Support":   "border-indigo-400/40 text-indigo-300",
  "Health Complaints":    "border-pink-400/40 text-pink-300",
  "Police Complaints":    "border-red-500/40 text-red-300",
  "Human Rights":         "border-orange-300/40 text-orange-200",
  "Tribunal":             "border-purple-400/40 text-purple-300",
  "Government Complaints":"border-zinc-400/40 text-zinc-300",
};

function stBadge(type) {
  return SERVICE_TYPE_COLORS[type] || "border-zinc-600/40 text-zinc-300";
}

// ─── Category Hub Card ────────────────────────────────────────────────────────
function HubCard({ hub, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(hub.id)}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-left rounded-2xl border border-[#D4AF37]/30 overflow-hidden flex flex-col w-full transition-all hover:border-[#D4AF37]/70 hover:shadow-lg"
      style={{ background: "linear-gradient(160deg,#252525 0%,#151515 100%)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#D4AF37]/10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{hub.emoji}</span>
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-wide leading-tight">{hub.title}</h3>
            <p className="text-[11px] text-[#D4AF37]/70 mt-0.5">{hub.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hub.who.map(w => (
            <span key={w} className="text-[10px] px-1.5 py-0.5 rounded border border-[#D4AF37]/25 text-[#D4AF37] font-semibold" style={{ background: "rgba(212,175,55,0.06)" }}>{w}</span>
          ))}
        </div>
      </div>
      {/* Handles list */}
      <div className="px-5 py-3 flex-1">
        <p className="text-[10px] font-bold text-[#D4AF37]/60 uppercase tracking-widest mb-2">HANDLES</p>
        <ul className="space-y-1">
          {hub.for.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/80">
              <span className="text-[#D4AF37] shrink-0 font-bold mt-px">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* CTA */}
      <div className="px-5 pb-5 pt-3">
        <div className="w-full py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-black text-xs uppercase tracking-widest text-center transition-all hover:bg-[#D4AF37] hover:text-black"
          style={{ background: "linear-gradient(90deg,#0B0B0B,#111)" }}>
          VIEW CONTACTS →
        </div>
      </div>
    </motion.button>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({ p, saved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-[#D4AF37]/15 overflow-hidden transition-all hover:border-[#D4AF37]/50 hover:shadow-xl"
      style={{ background: "linear-gradient(160deg,#252525 0%,#151515 100%)", boxShadow: "0 2px 16px rgba(0,0,0,0.4)" }}
    >
      {/* Emergency badge */}
      {p.emergency && (
        <div className="px-4 py-1 text-[10px] font-black text-black uppercase tracking-widest" style={{ background: "#D4AF37" }}>
          🆘 EMERGENCY / 24-HOUR SERVICE
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-black text-white text-sm leading-snug">{p.name}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${stBadge(p.serviceType)}`} style={{ background: "rgba(255,255,255,0.04)" }}>
                {p.serviceType}
              </span>
            </div>
            {p.acronym !== p.name && <p className="text-[11px] text-[#FFF4D1]/60 leading-tight">{p.fullName}</p>}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37]/70">
                <MapPin className="w-2.5 h-2.5" />
                {p.state === "National" ? "National" : p.state}
              </span>
              <span className="text-[10px] text-white/30">·</span>
              <span className="text-[10px] text-[#D4AF37]/50 font-semibold">{p.category}</span>
            </div>
          </div>
          <button
            onClick={() => onToggleSave(p.id)}
            className="shrink-0 text-zinc-600 hover:text-[#D4AF37] transition-colors"
          >
            {saved
              ? <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
              : <Star className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* What they do */}
      <div className="px-5 pb-3 flex-1">
        <p className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-widest mb-1.5">WHAT THEY DO</p>
        <p className="text-xs text-[#FFF4D1]/80 leading-relaxed">{p.whatTheyDo}</p>
      </div>

      {/* Handles tags */}
      {p.handles?.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1">
          {p.handles.map(h => (
            <span key={h} className="text-[10px] px-1.5 py-0.5 rounded border border-[#D4AF37]/15 text-[#D4AF37]/60 font-medium"
              style={{ background: "rgba(212,175,55,0.05)" }}>
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Contact */}
      <div className="px-5 pb-3 space-y-1.5">
        <p className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-widest mb-1.5">CONTACT</p>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-xs text-[#FFF4D1]/80 hover:text-[#D4AF37] transition-colors group">
            <Phone className="w-3 h-3 text-[#D4AF37] shrink-0" />
            <span className="group-hover:underline">{p.phone}</span>
          </a>
        )}
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#FFF4D1]/80 hover:text-[#D4AF37] transition-colors group">
            <Globe className="w-3 h-3 text-[#D4AF37] shrink-0" />
            <span className="truncate group-hover:underline">{new URL(p.website).hostname.replace('www.','')}</span>
          </a>
        )}
      </div>

      {/* Use this when — expandable */}
      <div className="border-t border-[#D4AF37]/10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-[11px] font-bold text-white/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all uppercase tracking-wide"
        >
          <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Use this when</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden"
            >
              <ul className="px-5 pb-4 space-y-1.5">
                {(p.useThisWhen || []).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#FFF4D1]/75">
                    <span className="text-[#D4AF37] shrink-0 font-bold mt-px">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2 border-t border-[#D4AF37]/10">
        <Link to="/new-case" className="flex-1 min-w-[110px]">
          <button className="w-full py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all hover:bg-[#D4AF37] hover:text-black"
            style={{ background: "linear-gradient(90deg,#0B0B0B,#151515)" }}>
            <Plus className="w-3 h-3" /> CREATE CASE
          </button>
        </Link>
        <div className="flex gap-1.5 flex-wrap">
          {p.website && (
            <a href={p.website} target="_blank" rel="noopener noreferrer">
              <button className="h-8 px-2.5 rounded-lg border border-[#D4AF37]/25 text-[#FFF4D1]/70 text-xs font-bold hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-all flex items-center gap-1" style={{ background: "#1F1F1F" }}>
                <Globe className="w-3 h-3" /> Site
              </button>
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`}>
              <button className="h-8 px-2.5 rounded-lg border border-[#D4AF37]/25 text-[#FFF4D1]/70 text-xs font-bold hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-all flex items-center gap-1" style={{ background: "#1F1F1F" }}>
                <Phone className="w-3 h-3" /> Call
              </button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border font-bold tracking-wide transition-all duration-150 whitespace-nowrap ${
        active
          ? "border-[#D4AF37] text-[#D4AF37] shadow-md shadow-[#D4AF37]/20"
          : "border-[#2A2A2A] text-white/40 hover:border-[#D4AF37]/40 hover:text-white/70"
      }`}
      style={active ? { background: "linear-gradient(90deg,#111,#1A1A1A)" } : { background: "#1A1A1A" }}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Directories() {
  const [activeTab, setActiveTab] = useState("directory");
  const [selectedHub, setSelectedHub] = useState(null); // hub id or null = show all
  const [stateFilter, setStateFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());
  const [showBrowse, setShowBrowse] = useState(false); // false = show hub cards, true = show provider list

  const toggleSave = (id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

  // Filtered providers
  const filtered = useMemo(() => {
    return providers.filter(p => {
      const catMatch = selectedHub
        ? p.category === HUB_CATEGORY_MAP[selectedHub]
        : true;
      const stateMatch = stateFilter === "All" || p.state === stateFilter || p.state === "National";
      const searchMatch = !search || [p.name, p.fullName, p.description, p.whatTheyDo, ...(p.handles || []), ...(p.tags || [])].some(v => v?.toLowerCase().includes(search.toLowerCase()));
      return catMatch && stateMatch && searchMatch;
    });
  }, [selectedHub, stateFilter, search]);

  // Group by category for browse-all view
  const grouped = useMemo(() => {
    if (selectedHub) return null; // flat list when hub selected
    const map = {};
    filtered.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [filtered, selectedHub]);

  const savedProviders = useMemo(() => providers.filter(p => savedIds.has(p.id)), [savedIds]);

  const tabs = [
    { id: "directory", label: "📋 Directory" },
    { id: "saved", label: `⭐ Saved${savedIds.size > 0 ? ` (${savedIds.size})` : ""}` },
    { id: "my-orgs", label: "🏢 My Organisations" },
  ];

  const hubConfig = selectedHub ? CATEGORY_HUBS.find(h => h.id === selectedHub) : null;

  return (
    <div className="pb-16 min-h-screen" style={{ background: "linear-gradient(160deg,#171717 0%,#202020 40%,#111111 100%)" }}>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/30 shadow-2xl mb-6"
        style={{ boxShadow: "0 0 48px rgba(212,175,55,0.08)" }}>
        <img
          src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg"
          alt="Chaos Controller — Escalation Directory"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* ── Hero Tagline ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#D4AF37]/20 px-6 py-6 mb-6" style={{ background: "#1F1F1F" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚡</span>
          <h1 className="font-black text-white text-2xl sm:text-3xl uppercase tracking-tight">TAKE BACK CONTROL</h1>
        </div>
        <p className="text-[#D4AF37] font-bold text-sm mb-2">
          Find the organisation responsible. Know your rights. Escalate your complaint.
        </p>
        <p className="text-[#FFF4D1]/70 text-sm leading-relaxed">
          Australia-wide complaint, dispute, advocacy and referral directory — {providers.length} providers across every state and territory.
        </p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-[#2A2A2A] mb-6" style={{ background: "#1A1A1A" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? "border border-[#D4AF37] text-[#D4AF37] shadow-md shadow-[#D4AF37]/15"
                : "text-white/40 hover:text-white/70"
            }`}
            style={activeTab === tab.id ? { background: "linear-gradient(90deg,#0B0B0B,#151515)" } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: DIRECTORY
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "directory" && (
        <>
          {/* HUB CARDS — shown until user drills in */}
          {!showBrowse && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-widest mb-1">WHAT IS YOUR ISSUE?</p>
                  <h2 className="font-black text-white text-lg uppercase">Choose your dispute type</h2>
                </div>
                <button
                  onClick={() => setShowBrowse(true)}
                  className="text-xs text-white/40 hover:text-[#D4AF37] transition-colors border border-[#2A2A2A] px-3 py-1.5 rounded-lg"
                  style={{ background: "#1A1A1A" }}>
                  Browse all {providers.length} →
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORY_HUBS.map(hub => (
                  <HubCard key={hub.id} hub={hub} onSelect={handleSelectHub} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => setShowBrowse(true)}
                  className="text-sm text-white/40 hover:text-[#D4AF37] transition-colors underline underline-offset-4">
                  Browse full directory without filtering
                </button>
              </div>
            </>
          )}

          {/* PROVIDER LIST — shown after drill-in */}
          {showBrowse && (
            <>
              {/* Back + heading */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D4AF37] transition-colors border border-[#2A2A2A] px-3 py-1.5 rounded-lg"
                  style={{ background: "#1A1A1A" }}>
                  <ArrowLeft className="w-3 h-3" /> Back to categories
                </button>
                {hubConfig && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{hubConfig.emoji}</span>
                    <h2 className="font-black text-white text-base uppercase tracking-wide">{hubConfig.title}</h2>
                  </div>
                )}
                <span className="ml-auto text-[10px] font-bold text-[#D4AF37]/50 border border-[#D4AF37]/15 px-2 py-1 rounded"
                  style={{ background: "rgba(212,175,55,0.05)" }}>
                  {filtered.length} providers
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, service type, state, description..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  style={{ background: "#1F1F1F", borderColor: "#2A2A2A" }}
                />
              </div>

              {/* State filter */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-widest shrink-0">STATE:</span>
                {ALL_STATES.map(s => <Pill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(s)} />)}
              </div>

              {/* Category pills (when browsing all) */}
              {!selectedHub && (
                <div className="flex items-center gap-2 flex-wrap mb-6">
                  <span className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-widest shrink-0">TYPE:</span>
                  {ALL_CATEGORIES.map(c => (
                    <Pill key={c} label={c} active={false} onClick={() => handleSelectHub(Object.entries(HUB_CATEGORY_MAP).find(([,v]) => v===c)?.[0] || null)} />
                  ))}
                </div>
              )}

              {/* Results */}
              {filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-[#2A2A2A]" style={{ background: "#1F1F1F" }}>
                  <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="font-bold text-white">No results found</p>
                  <p className="text-sm text-white/40 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : selectedHub ? (
                /* Flat grid for hub-filtered results */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(p => (
                    <ProviderCard key={p.id} p={p} saved={savedIds.has(p.id)} onToggleSave={toggleSave} />
                  ))}
                </div>
              ) : (
                /* Grouped by category for browse-all */
                <div className="space-y-10">
                  {Object.entries(grouped).map(([cat, catProviders]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.12)" }} />
                        <h3 className="font-black text-[#D4AF37] text-xs uppercase tracking-widest px-2">{cat}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#D4AF37]/20 text-[#D4AF37]/60"
                          style={{ background: "rgba(212,175,55,0.05)" }}>
                          {catProviders.length}
                        </span>
                        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.12)" }} />
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catProviders.map(p => (
                          <ProviderCard key={p.id} p={p} saved={savedIds.has(p.id)} onToggleSave={toggleSave} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: SAVED
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "saved" && (
        savedProviders.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedProviders.map(p => (
              <ProviderCard key={p.id} p={p} saved={true} onToggleSave={toggleSave} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-[#2A2A2A]" style={{ background: "#1F1F1F" }}>
            <Star className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="font-bold text-white">No saved providers yet</p>
            <p className="text-sm text-white/40 mt-1">Click the ★ on any card to save it here.</p>
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: MY ORGANISATIONS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "my-orgs" && <MyOrganisations />}

      {/* ── Footer disclaimer ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#2A2A2A] p-4 mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "#1A1A1A" }}>
        <p className="text-xs text-white/35 italic flex-1">
          <strong className="not-italic text-white/55">Disclaimer:</strong> Chaos Controller provides educational and document management assistance only — not legal advice. Always verify contact details on the provider's official website.
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/terms" className="text-xs text-white/35 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
            <Scale className="w-3 h-3" /> Terms
          </Link>
          <Link to="/privacy" className="text-xs text-white/35 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
            <Shield className="w-3 h-3" /> Privacy
          </Link>
          <Link to="/help" className="text-xs text-white/35 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Help
          </Link>
        </div>
      </div>
    </div>
  );
}