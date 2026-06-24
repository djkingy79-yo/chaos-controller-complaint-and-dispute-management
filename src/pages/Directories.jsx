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

const ALL_STATES = ["All", "National", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const SERVICE_BADGE = {
  "Ombudsman":             "bg-amber-50 text-amber-800 border-amber-300",
  "Regulator":             "bg-blue-50 text-blue-800 border-blue-300",
  "Tribunal":              "bg-purple-50 text-purple-800 border-purple-300",
  "Legal Aid":             "bg-green-50 text-green-800 border-green-300",
  "Community Legal Centre":"bg-emerald-50 text-emerald-800 border-emerald-300",
  "Crisis Support":        "bg-red-50 text-red-800 border-red-300",
  "Referral Service":      "bg-slate-50 text-slate-700 border-slate-300",
  "Advocacy Service":      "bg-orange-50 text-orange-800 border-orange-300",
  "Financial Counselling": "bg-yellow-50 text-yellow-800 border-yellow-300",
  "Tenancy Advice":        "bg-teal-50 text-teal-800 border-teal-300",
  "Housing Support":       "bg-cyan-50 text-cyan-800 border-cyan-300",
  "Disability Support":    "bg-indigo-50 text-indigo-800 border-indigo-300",
  "Health Complaints":     "bg-pink-50 text-pink-800 border-pink-300",
  "Police Complaints":     "bg-red-50 text-red-900 border-red-400",
  "Human Rights":          "bg-orange-50 text-orange-900 border-orange-300",
  "Government Complaints": "bg-slate-50 text-slate-800 border-slate-300",
};
function badge(type) { return SERVICE_BADGE[type] || "bg-gray-50 text-gray-700 border-gray-300"; }

// ─── Category Hub Card ────────────────────────────────────────────────────────
function HubCard({ hub, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(hub.id)}
      whileHover={{ scale: 1.01, boxShadow: "0 8px 32px rgba(180,140,20,0.12)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-left rounded-2xl border border-[#C9A227]/40 bg-white overflow-hidden flex flex-col w-full transition-all hover:border-[#C9A227] hover:shadow-md"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
    >
      {/* Title */}
      <div className="px-5 pt-5 pb-4 border-b border-[#C9A227]/20 flex items-center gap-3">
        <span className="text-2xl leading-none">{hub.emoji}</span>
        <h3 className="font-black text-black text-sm uppercase tracking-widest leading-tight">{hub.title}</h3>
      </div>

      {/* What this covers */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">WHAT THIS COVERS</p>
        <p className="text-xs text-black leading-relaxed">{hub.covers}</p>
      </div>

      {/* Common disputes */}
      <div className="px-5 pb-3">
        <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">COMMON DISPUTES</p>
        <ul className="space-y-1">
          {hub.disputes.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-black">
              <span className="text-[#C9A227] shrink-0 font-black mt-px leading-none">✓</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Who can help */}
      <div className="px-5 pb-4 flex-1">
        <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-2">WHO CAN HELP</p>
        <div className="flex flex-wrap gap-1.5">
          {hub.who.map(w => (
            <span key={w} className="text-[10px] px-2 py-0.5 rounded border border-[#C9A227]/50 text-[#7A5F00] font-bold bg-amber-50">
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <div className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest text-center hover:bg-[#C9A227] transition-colors">
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
      className="flex flex-col rounded-2xl border border-[#C9A227]/30 bg-white overflow-hidden transition-all hover:border-[#C9A227] hover:shadow-md"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
    >
      {p.emergency && (
        <div className="px-4 py-1 text-[10px] font-black text-black uppercase tracking-widest bg-[#D4AF37]">
          🆘 EMERGENCY / 24-HOUR SERVICE
        </div>
      )}

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-black text-black text-sm leading-snug">{p.name}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${badge(p.serviceType)}`}>
                {p.serviceType}
              </span>
            </div>
            {p.acronym !== p.name && (
              <p className="text-[11px] text-[#2A2A2A] leading-tight">{p.fullName}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#B8860B]">
                <MapPin className="w-2.5 h-2.5" />
                {p.state === "National" ? "National" : p.state}
              </span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-[#7A5F00] font-semibold">{p.category}</span>
            </div>
          </div>
          <button onClick={() => onToggleSave(p.id)} className="shrink-0 text-gray-300 hover:text-[#C9A227] transition-colors">
            {saved
              ? <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
              : <Star className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-5 pb-3 flex-1">
        <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-1.5">WHAT THEY DO</p>
        <p className="text-xs text-black leading-relaxed">{p.whatTheyDo}</p>
      </div>

      {p.handles?.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1">
          {p.handles.map(h => (
            <span key={h} className="text-[10px] px-1.5 py-0.5 rounded border border-[#C9A227]/40 text-[#7A5F00] font-medium bg-amber-50">
              {h}
            </span>
          ))}
        </div>
      )}

      <div className="px-5 pb-3 space-y-1.5">
        <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-1.5">CONTACT</p>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-xs text-black hover:text-[#B8860B] transition-colors group">
            <Phone className="w-3 h-3 text-[#C9A227] shrink-0" />
            <span className="group-hover:underline">{p.phone}</span>
          </a>
        )}
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-black hover:text-[#B8860B] transition-colors group">
            <Globe className="w-3 h-3 text-[#C9A227] shrink-0" />
            <span className="truncate group-hover:underline">{new URL(p.website).hostname.replace('www.', '')}</span>
          </a>
        )}
      </div>

      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-[11px] font-bold text-[#2A2A2A] hover:text-[#B8860B] hover:bg-amber-50 transition-all uppercase tracking-wide"
        >
          <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-[#C9A227]" /> Use this when</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
              <ul className="px-5 pb-4 space-y-1.5">
                {(p.useThisWhen || []).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-black">
                    <span className="text-[#C9A227] shrink-0 font-bold mt-px">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2 border-t border-gray-100">
        <Link to="/new-case" className="flex-1 min-w-[110px]">
          <button className="w-full py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors">
            <Plus className="w-3 h-3" /> CREATE CASE
          </button>
        </Link>
        <div className="flex gap-1.5 flex-wrap">
          {p.website && (
            <a href={p.website} target="_blank" rel="noopener noreferrer">
              <button className="h-8 px-2.5 rounded-lg border border-[#C9A227]/50 text-black text-xs font-bold hover:border-[#C9A227] hover:bg-amber-50 transition-all flex items-center gap-1 bg-white">
                <Globe className="w-3 h-3 text-[#C9A227]" /> Site
              </button>
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`}>
              <button className="h-8 px-2.5 rounded-lg border border-[#C9A227]/50 text-black text-xs font-bold hover:border-[#C9A227] hover:bg-amber-50 transition-all flex items-center gap-1 bg-white">
                <Phone className="w-3 h-3 text-[#C9A227]" /> Call
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
          ? "border-[#C9A227] bg-[#D4AF37] text-black shadow-sm"
          : "border-gray-200 bg-white text-black hover:border-[#C9A227] hover:bg-amber-50"
      }`}>
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
    { id: "directory", label: "📋 Directory" },
    { id: "saved",     label: `⭐ Saved${savedIds.size > 0 ? ` (${savedIds.size})` : ""}` },
    { id: "my-orgs",   label: "🏢 My Organisations" },
  ];

  return (
    <div className="pb-16 min-h-screen bg-[#F8F6EF]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#C9A227]/30 bg-white px-6 py-7 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <h1 className="font-black text-black text-2xl sm:text-3xl uppercase tracking-tight">TAKE BACK CONTROL</h1>
        </div>
        <p className="text-[#B8860B] font-black text-sm mb-2 uppercase tracking-wide">
          Find the organisation responsible. Know your rights. Escalate your complaint.
        </p>
        <p className="text-black text-sm leading-relaxed">
          Australia-wide complaint, dispute, advocacy and referral directory — {providers.length}+ providers across every state and territory.
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-gray-200 bg-white mb-6 shadow-sm">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? "bg-[#D4AF37] text-black"
                : "text-black hover:bg-amber-50"
            }`}>
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
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-1">WHAT IS YOUR ISSUE?</p>
                  <h2 className="font-black text-black text-lg uppercase tracking-wide">Choose your dispute type</h2>
                </div>
                <button onClick={() => setShowBrowse(true)}
                  className="text-xs text-black font-bold hover:text-[#B8860B] transition-colors border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:border-[#C9A227] hover:bg-amber-50">
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
                  className="text-sm text-[#2A2A2A] hover:text-[#B8860B] transition-colors underline underline-offset-4 font-bold">
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
                  className="flex items-center gap-1.5 text-xs text-black font-bold hover:text-[#B8860B] transition-colors border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:border-[#C9A227] hover:bg-amber-50">
                  <ArrowLeft className="w-3 h-3" /> Back to categories
                </button>
                {hubConfig && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{hubConfig.emoji}</span>
                    <h2 className="font-black text-black text-base uppercase tracking-wide">{hubConfig.title}</h2>
                  </div>
                )}
                <span className="ml-auto text-[10px] font-bold text-[#B8860B] border border-[#C9A227]/30 bg-amber-50 px-2 py-1 rounded">
                  {filtered.length} providers
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, service, state..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest shrink-0">STATE:</span>
                {ALL_STATES.map(s => <Pill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(s)} />)}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-black text-black">No results found</p>
                  <p className="text-sm text-[#2A2A2A] mt-1">Try adjusting your search or filters.</p>
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
                        <div className="h-px flex-1 bg-[#C9A227]/25" />
                        <h3 className="font-black text-[#B8860B] text-xs uppercase tracking-widest px-2">{cat}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#C9A227]/30 text-[#7A5F00] bg-amber-50">
                          {catProviders.length}
                        </span>
                        <div className="h-px flex-1 bg-[#C9A227]/25" />
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
          <div className="text-center py-16 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-black text-black">No saved providers yet</p>
            <p className="text-sm text-[#2A2A2A] mt-1">Click the ★ on any card to save it here.</p>
          </div>
        )
      )}

      {/* ══ TAB: MY ORGANISATIONS ═════════════════════════════════════════ */}
      {activeTab === "my-orgs" && <MyOrganisations />}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <p className="text-xs text-[#2A2A2A] italic flex-1">
          <strong className="not-italic text-black">Disclaimer:</strong> Chaos Controller provides educational and document management assistance only — not legal advice. Always verify contact details on the provider's official website.
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/terms"   className="text-xs text-[#2A2A2A] hover:text-[#B8860B] transition-colors flex items-center gap-1 font-bold"><Scale className="w-3 h-3 text-[#C9A227]" /> Terms</Link>
          <Link to="/privacy" className="text-xs text-[#2A2A2A] hover:text-[#B8860B] transition-colors flex items-center gap-1 font-bold"><Shield className="w-3 h-3 text-[#C9A227]" /> Privacy</Link>
          <Link to="/help"    className="text-xs text-[#2A2A2A] hover:text-[#B8860B] transition-colors flex items-center gap-1 font-bold"><BookOpen className="w-3 h-3 text-[#C9A227]" /> Help</Link>
        </div>
      </div>
    </div>
  );
}