import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { providers, CATEGORY_HUBS } from "@/lib/providersData";
import MyOrganisations from "@/components/directories/MyOrganisations";
import { Link } from "react-router-dom";
import {
  Search, Phone, Globe, Plus, Star, ChevronDown, ChevronUp,
  AlertCircle, MapPin, Scale, Shield, BookOpen, ArrowLeft
} from "lucide-react";

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

const ALL_STATES = ["All","National","NSW","VIC","QLD","SA","WA","TAS","NT","ACT"];

const SERVICE_BADGE = {
  "Ombudsman":             "border-yellow-500/40 text-yellow-300",
  "Regulator":             "border-blue-500/40 text-blue-300",
  "Tribunal":              "border-purple-400/40 text-purple-300",
  "Legal Aid":             "border-green-500/40 text-green-300",
  "Community Legal Centre":"border-green-400/40 text-green-300",
  "Crisis Support":        "border-red-400/40 text-red-300",
  "Referral Service":      "border-[#D4AF37]/30 text-[#D4AF37]",
  "Advocacy Service":      "border-orange-400/40 text-orange-300",
  "Financial Counselling": "border-yellow-400/40 text-yellow-200",
  "Tenancy Advice":        "border-green-400/40 text-green-200",
  "Housing Support":       "border-teal-400/40 text-teal-300",
  "Disability Support":    "border-indigo-400/40 text-indigo-300",
  "Health Complaints":     "border-pink-400/40 text-pink-300",
  "Police Complaints":     "border-red-500/40 text-red-300",
  "Human Rights":          "border-orange-300/40 text-orange-200",
  "Government Complaints": "border-[#D4AF37]/25 text-[#D4AF37]/80",
};
function badge(type) { return SERVICE_BADGE[type] || "border-white/15 text-white/60"; }

// ─── Category Hub Card — full industry explanation ────────────────────────────
function HubCard({ hub, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(hub.id)}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-left rounded-2xl border border-[#D4AF37]/25 overflow-hidden flex flex-col w-full transition-all hover:border-[#D4AF37]/60 hover:shadow-xl"
      style={{ background: "linear-gradient(160deg,#232323 0%,#141414 100%)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
    >
      {/* Title row */}
      <div className="px-5 pt-5 pb-4 border-b border-[#D4AF37]/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{hub.emoji}</span>
          <h3 className="font-black text-white text-sm uppercase tracking-widest leading-tight">{hub.title}</h3>
        </div>
      </div>

      {/* What this covers */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">WHAT THIS COVERS</p>
        <p className="text-xs text-white leading-relaxed">{hub.covers}</p>
      </div>

      {/* Common disputes */}
      <div className="px-5 pb-3">
        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">COMMON DISPUTES</p>
        <ul className="space-y-1">
          {hub.disputes.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white">
              <span className="text-[#D4AF37] shrink-0 font-black mt-px leading-none">✓</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Who can help */}
      <div className="px-5 pb-4 flex-1">
        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">WHO CAN HELP</p>
        <div className="flex flex-wrap gap-1.5">
          {hub.who.map(w => (
            <span key={w} className="text-[10px] px-2 py-0.5 rounded border border-[#D4AF37]/30 text-[#D4AF37] font-bold"
              style={{ background: "rgba(212,175,55,0.07)" }}>{w}</span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <div className="w-full py-2.5 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-black text-xs uppercase tracking-widest text-center transition-all hover:bg-[#D4AF37] hover:text-black"
          style={{ background: "linear-gradient(90deg,#0B0B0B,#111)" }}>
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-[#D4AF37]/15 overflow-hidden transition-all hover:border-[#D4AF37]/50 hover:shadow-xl"
      style={{ background: "linear-gradient(160deg,#252525 0%,#151515 100%)", boxShadow: "0 2px 16px rgba(0,0,0,0.4)" }}
    >
      {p.emergency && (
        <div className="px-4 py-1 text-[10px] font-black text-black uppercase tracking-widest" style={{ background: "#D4AF37" }}>
          🆘 EMERGENCY / 24-HOUR SERVICE
        </div>
      )}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-black text-white text-sm leading-snug">{p.name}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${badge(p.serviceType)}`}
                style={{ background: "rgba(255,255,255,0.04)" }}>
                {p.serviceType}
              </span>
            </div>
            {p.acronym !== p.name && <p className="text-[11px] text-[#FFF4D1]/70 leading-tight">{p.fullName}</p>}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37]/80">
                <MapPin className="w-2.5 h-2.5" />
                {p.state === "National" ? "National" : p.state}
              </span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-[#D4AF37]/60 font-semibold">{p.category}</span>
            </div>
          </div>
          <button onClick={() => onToggleSave(p.id)} className="shrink-0 text-white/20 hover:text-[#D4AF37] transition-colors">
            {saved ? <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" /> : <Star className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-5 pb-3 flex-1">
        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1.5">WHAT THEY DO</p>
        <p className="text-xs text-white leading-relaxed">{p.whatTheyDo}</p>
      </div>

      {p.handles?.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1">
          {p.handles.map(h => (
            <span key={h} className="text-[10px] px-1.5 py-0.5 rounded border border-[#D4AF37]/15 text-[#D4AF37]/70 font-medium"
              style={{ background: "rgba(212,175,55,0.05)" }}>{h}</span>
          ))}
        </div>
      )}

      <div className="px-5 pb-3 space-y-1.5">
        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1.5">CONTACT</p>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-xs text-white hover:text-[#D4AF37] transition-colors group">
            <Phone className="w-3 h-3 text-[#D4AF37] shrink-0" />
            <span className="group-hover:underline">{p.phone}</span>
          </a>
        )}
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white hover:text-[#D4AF37] transition-colors group">
            <Globe className="w-3 h-3 text-[#D4AF37] shrink-0" />
            <span className="truncate group-hover:underline">{new URL(p.website).hostname.replace('www.','')}</span>
          </a>
        )}
      </div>

      <div className="border-t border-[#D4AF37]/10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-[11px] font-bold text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all uppercase tracking-wide"
        >
          <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Use this when</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
              <ul className="px-5 pb-4 space-y-1.5">
                {(p.useThisWhen || []).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white">
                    <span className="text-[#D4AF37] shrink-0 font-bold mt-px">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
              <button className="h-8 px-2.5 rounded-lg border border-[#D4AF37]/25 text-white text-xs font-bold hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-all flex items-center gap-1"
                style={{ background: "#1F1F1F" }}>
                <Globe className="w-3 h-3" /> Site
              </button>
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`}>
              <button className="h-8 px-2.5 rounded-lg border border-[#D4AF37]/25 text-white text-xs font-bold hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-all flex items-center gap-1"
                style={{ background: "#1F1F1F" }}>
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
          : "border-[#2A2A2A] text-white hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
      }`}
      style={active ? { background: "linear-gradient(90deg,#111,#1A1A1A)" } : { background: "#1A1A1A" }}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Directories() {
  const [activeTab, setActiveTab]   = useState("directory");
  const [selectedHub, setSelectedHub] = useState(null);
  const [stateFilter, setStateFilter] = useState("All");
  const [search, setSearch]         = useState("");
  const [savedIds, setSavedIds]     = useState(new Set());
  const [showBrowse, setShowBrowse] = useState(false);

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
      const catMatch = selectedHub ? p.category === HUB_CATEGORY_MAP[selectedHub] : true;
      const stateMatch = stateFilter === "All" || p.state === stateFilter || p.state === "National";
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
    { id: "directory", label: "📋 Directory" },
    { id: "saved",     label: `⭐ Saved${savedIds.size > 0 ? ` (${savedIds.size})` : ""}` },
    { id: "my-orgs",   label: "🏢 My Organisations" },
  ];

  return (
    <div className="pb-16 min-h-screen" style={{ background: "linear-gradient(160deg,#171717 0%,#202020 40%,#111111 100%)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#D4AF37]/20 px-6 py-7 mb-6" style={{ background: "#1F1F1F" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <h1 className="font-black text-white text-2xl sm:text-3xl uppercase tracking-tight">TAKE BACK CONTROL</h1>
        </div>
        <p className="text-[#D4AF37] font-bold text-sm mb-2">
          Find the organisation responsible. Know your rights. Escalate your complaint.
        </p>
        <p className="text-white text-sm leading-relaxed">
          Australia-wide complaint, dispute, advocacy and referral directory — {providers.length}+ providers across every state and territory.
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-[#2A2A2A] mb-6" style={{ background: "#1A1A1A" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? "border border-[#D4AF37] text-[#D4AF37]"
                : "text-white hover:text-[#D4AF37]"
            }`}
            style={activeTab === tab.id ? { background: "linear-gradient(90deg,#0B0B0B,#151515)" } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: DIRECTORY ════════════════════════════════════════════════ */}
      {activeTab === "directory" && (
        <>
          {/* HUB CATEGORY CARDS */}
          {!showBrowse && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">WHAT IS YOUR ISSUE?</p>
                  <h2 className="font-black text-white text-lg uppercase tracking-wide">Choose your dispute type</h2>
                </div>
                <button onClick={() => setShowBrowse(true)}
                  className="text-xs text-white hover:text-[#D4AF37] transition-colors border border-[#2A2A2A] px-3 py-1.5 rounded-lg"
                  style={{ background: "#1A1A1A" }}>
                  Browse all {providers.length} →
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {CATEGORY_HUBS.map(hub => (
                  <HubCard key={hub.id} hub={hub} onSelect={handleSelectHub} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => setShowBrowse(true)}
                  className="text-sm text-white hover:text-[#D4AF37] transition-colors underline underline-offset-4">
                  Browse full directory without filtering
                </button>
              </div>
            </>
          )}

          {/* PROVIDER LIST */}
          {showBrowse && (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs text-white hover:text-[#D4AF37] transition-colors border border-[#2A2A2A] px-3 py-1.5 rounded-lg"
                  style={{ background: "#1A1A1A" }}>
                  <ArrowLeft className="w-3 h-3" /> Back to categories
                </button>
                {hubConfig && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{hubConfig.emoji}</span>
                    <h2 className="font-black text-white text-base uppercase tracking-wide">{hubConfig.title}</h2>
                  </div>
                )}
                <span className="ml-auto text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-1 rounded"
                  style={{ background: "rgba(212,175,55,0.06)" }}>
                  {filtered.length} providers
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, service, state..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  style={{ background: "#1F1F1F", borderColor: "#2A2A2A" }}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest shrink-0">STATE:</span>
                {ALL_STATES.map(s => <Pill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(s)} />)}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-[#2A2A2A]" style={{ background: "#1F1F1F" }}>
                  <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="font-bold text-white">No results found</p>
                  <p className="text-sm text-white mt-1">Try adjusting your search or filters.</p>
                </div>
              ) : selectedHub ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(p => <ProviderCard key={p.id} p={p} saved={savedIds.has(p.id)} onToggleSave={toggleSave} />)}
                </div>
              ) : (
                <div className="space-y-10">
                  {Object.entries(grouped).map(([cat, catProviders]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.15)" }} />
                        <h3 className="font-black text-[#D4AF37] text-xs uppercase tracking-widest px-2">{cat}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#D4AF37]/20 text-[#D4AF37]"
                          style={{ background: "rgba(212,175,55,0.06)" }}>{catProviders.length}</span>
                        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.15)" }} />
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedProviders.map(p => <ProviderCard key={p.id} p={p} saved={true} onToggleSave={toggleSave} />)}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-[#2A2A2A]" style={{ background: "#1F1F1F" }}>
            <Star className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="font-bold text-white">No saved providers yet</p>
            <p className="text-sm text-white mt-1">Click the ★ on any card to save it here.</p>
          </div>
        )
      )}

      {/* ══ TAB: MY ORGANISATIONS ═════════════════════════════════════════ */}
      {activeTab === "my-orgs" && <MyOrganisations />}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#2A2A2A] p-4 mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "#1A1A1A" }}>
        <p className="text-xs text-white italic flex-1">
          <strong className="not-italic text-[#D4AF37]">Disclaimer:</strong> Chaos Controller provides educational and document management assistance only — not legal advice. Always verify contact details on the provider's official website.
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/terms"   className="text-xs text-white hover:text-[#D4AF37] transition-colors flex items-center gap-1"><Scale className="w-3 h-3" /> Terms</Link>
          <Link to="/privacy" className="text-xs text-white hover:text-[#D4AF37] transition-colors flex items-center gap-1"><Shield className="w-3 h-3" /> Privacy</Link>
          <Link to="/help"    className="text-xs text-white hover:text-[#D4AF37] transition-colors flex items-center gap-1"><BookOpen className="w-3 h-3" /> Help</Link>
        </div>
      </div>
    </div>
  );
}