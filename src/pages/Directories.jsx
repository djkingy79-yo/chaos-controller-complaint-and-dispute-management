import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Search, Building2, Scale, Home, Zap, Phone, Shield,
  Landmark, Mail, BookOpen, Globe, Star,
  ChevronDown, ChevronUp, MapPin, AlertCircle, Plus, Bolt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { escalationBodies, contactDirectory } from "@/lib/directoriesData";
import MyOrganisations from "@/components/directories/MyOrganisations";
import { Link } from "react-router-dom";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const GOLD = "#FFD000";
const GOLD_DIM = "#B8860B";

// ─── Filter data ─────────────────────────────────────────────────────────────
const STATE_FILTERS = ["All", "National", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const CATEGORY_FILTERS = [
  "All", "Banking", "Insurance", "Tenancy", "Energy", "Telco",
  "Consumer", "Government", "Legal", "Health", "Super", "Real Estate",
];

const CATEGORY_TAG_MAP = {
  Banking: ["Banking", "Bank", "Finance"],
  Insurance: ["Insurance", "Health"],
  Tenancy: ["Tenancy", "Bond", "Real Estate"],
  Energy: ["Energy", "Water"],
  Telco: ["Telco", "Internet", "Media"],
  Consumer: ["Consumer"],
  Government: ["Government", "Tax", "Employment", "Rights", "NDIS", "Disability", "Centrelink", "Visa", "Medicare"],
  Legal: ["Legal"],
  Health: ["Health", "Medicare"],
  Super: ["Super"],
  "Real Estate": ["Real Estate"],
};

function categoryMatches(tags, filterCat) {
  if (filterCat === "All") return true;
  const mapped = CATEGORY_TAG_MAP[filterCat] || [filterCat];
  return tags.some(t => mapped.some(m => t.toLowerCase().includes(m.toLowerCase())));
}

function stateMatches(tags, filterState) {
  if (filterState === "All") return true;
  return tags.some(t => t === filterState);
}

// ─── Category hub cards shown FIRST ─────────────────────────────────────────
const CATEGORY_HUBS = [
  {
    emoji: "🏦",
    title: "Banking & Finance",
    who: ["AFCA", "ASIC", "APRA"],
    for: ["Chargebacks & unauthorised transactions", "Unfair bank fees", "Insurance claim disputes", "Financial complaints & scams"],
    filter: "Banking",
  },
  {
    emoji: "🏠",
    title: "Housing & Tenancy",
    who: ["NCAT", "VCAT", "RTA"],
    for: ["Bond disputes", "Repair obligations", "Unlawful eviction", "Rent increase challenges"],
    filter: "Tenancy",
  },
  {
    emoji: "⚡",
    title: "Energy & Utilities",
    who: ["AER", "EWON", "EWOV"],
    for: ["Billing errors & overcharges", "Wrongful disconnection", "Meter disputes", "Service reliability issues"],
    filter: "Energy",
  },
  {
    emoji: "📱",
    title: "Telecommunications",
    who: ["TIO", "ACMA"],
    for: ["No phone/internet service", "Billing disputes", "Misleading contract terms", "Device repair refusals"],
    filter: "Telco",
  },
  {
    emoji: "🏛️",
    title: "Government & NDIS",
    who: ["Commonwealth Ombudsman", "NDIA", "ATO"],
    for: ["Centrelink payment disputes", "NDIS plan denials", "Tax assessment errors", "Visa and border issues"],
    filter: "Government",
  },
  {
    emoji: "⚖️",
    title: "Consumer Rights",
    who: ["ACCC", "Fair Trading", "Legal Aid"],
    for: ["Misleading or deceptive conduct", "Defective goods refusals", "Unfair contract terms", "Product safety breaches"],
    filter: "Consumer",
  },
];

// ─── When-to-contact logic ───────────────────────────────────────────────────
const WHEN_TO_CONTACT_MAP = {
  "AFCA": ["Complaint rejected or ignored after 30–45 days", "Unsatisfactory final response received", "Organisation is not engaging"],
  "TIO": ["Telco hasn't resolved complaint in 10 business days", "Final response you disagree with", "Service issues remain unresolved"],
  "AER": ["Energy retailer won't resolve your dispute", "Disconnected unfairly", "Billing errors left unaddressed"],
  "ACCC": ["Company engaging in misleading or deceptive conduct", "Product safety concerns", "Unfair contract terms"],
  "Ombudsman": ["Government agency failed to act fairly", "Decision appears wrong or unreasonable", "Timeframes have passed"],
  "Legal Aid": ["You need free legal advice", "Court proceedings are involved", "Cannot afford a private solicitor"],
};

function getWhenToContact(entry) {
  for (const [key, tips] of Object.entries(WHEN_TO_CONTACT_MAP)) {
    if (entry.name.includes(key)) return tips;
  }
  if (entry.tags.some(t => ["Banking", "Bank"].includes(t))) return ["Bank has not resolved complaint within 30–45 days", "Final response you disagree with", "Need to escalate beyond the bank"];
  if (entry.tags.some(t => t === "Telco")) return ["Telco hasn't resolved complaint in 10 days", "Unsatisfactory final response", "Service faults remain unresolved"];
  if (entry.tags.some(t => t === "Energy")) return ["Energy provider ignored your complaint", "Bill is incorrect and unresolved", "Facing unfair disconnection"];
  if (entry.tags.some(t => t === "Tenancy")) return ["Landlord not responding to repairs", "Bond dispute needs resolution", "Notice not resolved by agent"];
  if (entry.tags.some(t => t === "Insurance")) return ["Claim has been denied unfairly", "Insurer is not responding", "Received an unsatisfactory settlement offer"];
  if (entry.tags.some(t => t === "Government")) return ["Government agency failed to act", "Decision appears wrong or unreasonable", "Required timeframes have passed"];
  return ["Complaint not resolved after direct contact", "Final rejection received", "Escalation required"];
}

// ─── Components ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border font-semibold tracking-wide transition-all duration-150 ${
        active
          ? "bg-black border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/20"
          : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-yellow-500/50 hover:text-yellow-300"
      }`}
    >
      {label}
    </button>
  );
}

function CategoryHubCard({ hub, onSelectCategory }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="flex flex-col rounded-2xl border border-yellow-500/25 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #111111 0%, #0B0B0B 100%)", boxShadow: "0 4px 24px rgba(255,208,0,0.06)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-yellow-500/10">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{hub.emoji}</span>
          <h3 className="font-heading font-bold text-white text-base uppercase tracking-wide">{hub.title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {hub.who.map(w => (
            <span key={w} className="text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-400 font-semibold bg-yellow-500/5">{w}</span>
          ))}
        </div>
      </div>

      {/* For list */}
      <div className="px-5 py-4 flex-1">
        <p className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest mb-2">HANDLES</p>
        <ul className="space-y-1.5">
          {hub.for.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <span className="text-yellow-400 shrink-0 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onSelectCategory(hub.filter)}
          className="w-full py-2 rounded-lg border border-yellow-400 text-yellow-300 font-bold text-xs uppercase tracking-widest transition-all hover:bg-yellow-400 hover:text-black"
          style={{ background: "linear-gradient(90deg, #0B0B0B, #111)" }}
        >
          VIEW CONTACTS
        </button>
      </div>
    </motion.div>
  );
}

function AgencyCard({ entry, saved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);
  const whenToContact = getWhenToContact(entry);
  const stateTag = entry.tags.find(t => STATE_FILTERS.includes(t));
  const categoryTags = entry.tags.filter(t => !STATE_FILTERS.includes(t)).slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-yellow-500/20 overflow-hidden transition-all duration-200 hover:border-yellow-400/50 hover:shadow-lg"
      style={{ background: "linear-gradient(160deg, #111111 0%, #0B0B0B 100%)", boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
    >
      {/* Card Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-yellow-500/30" style={{ background: "rgba(255,208,0,0.07)" }}>
              <Building2 className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-white text-sm leading-snug">{entry.name}</h3>
              {stateTag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded border border-yellow-500/30 text-yellow-400 uppercase tracking-wide" style={{ background: "rgba(255,208,0,0.06)" }}>
                  <MapPin className="w-2.5 h-2.5" />
                  {stateTag}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleSave(entry.name)}
            className="shrink-0 text-zinc-600 hover:text-yellow-400 transition-colors mt-0.5"
            title={saved ? "Remove from saved" : "Save"}
          >
            {saved
              ? <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              : <Star className="w-4 h-4" />}
          </button>
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {categoryTags.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/20 text-yellow-500/80 font-semibold bg-yellow-500/5">{t}</span>
          ))}
        </div>
      </div>

      {/* What they do */}
      <div className="px-5 pb-3 flex-1">
        <p className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-1.5">WHAT THEY DO</p>
        <p className="text-xs text-zinc-400 leading-relaxed">{entry.desc}</p>
      </div>

      {/* Contact details */}
      <div className="px-5 pb-3 space-y-1.5">
        <p className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-1.5">CONTACT</p>
        {entry.phone && (
          <a href={`tel:${entry.phone}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-yellow-300 transition-colors group">
            <Phone className="w-3 h-3 text-yellow-500 shrink-0" />
            <span className="group-hover:underline">{entry.phone}</span>
          </a>
        )}
        {entry.email && !entry.email.startsWith("Not available") && (
          <a href={`mailto:${entry.email}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-yellow-300 transition-colors group">
            <Mail className="w-3 h-3 text-yellow-500 shrink-0" />
            <span className="truncate group-hover:underline">{entry.email}</span>
          </a>
        )}
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-yellow-300 transition-colors group">
            <Globe className="w-3 h-3 text-yellow-500 shrink-0" />
            <span className="truncate group-hover:underline">{new URL(entry.url).hostname.replace('www.', '')}</span>
          </a>
        )}
      </div>

      {/* When to contact — expandable */}
      <div className="border-t border-yellow-500/10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-zinc-500 hover:text-yellow-300 hover:bg-yellow-500/5 transition-all"
        >
          <span className="flex items-center gap-1.5 uppercase tracking-wide">
            <AlertCircle className="w-3 h-3" /> When to contact
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <ul className="px-5 pb-4 space-y-1.5">
                {whenToContact.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="text-yellow-400 shrink-0 mt-0.5 font-bold">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2 border-t border-yellow-500/10">
        {/* Primary: Create Case */}
        <Link to="/new-case" className="flex-1 min-w-[120px]">
          <button className="w-full py-2 rounded-lg border border-yellow-400 text-yellow-300 font-bold text-xs uppercase tracking-widest transition-all hover:bg-yellow-400 hover:text-black flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(90deg, #0B0B0B, #111)" }}>
            <Plus className="w-3 h-3" /> CREATE CASE
          </button>
        </Link>
        {/* Secondary actions */}
        <div className="flex gap-1.5 flex-wrap">
          {entry.url && (
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              <button className="h-8 px-3 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-semibold hover:border-yellow-500/50 hover:text-yellow-300 transition-all flex items-center gap-1 bg-zinc-900">
                <Globe className="w-3 h-3" /> Site
              </button>
            </a>
          )}
          {entry.phone && (
            <a href={`tel:${entry.phone}`}>
              <button className="h-8 px-3 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-semibold hover:border-yellow-500/50 hover:text-yellow-300 transition-all flex items-center gap-1 bg-zinc-900">
                <Phone className="w-3 h-3" /> Call
              </button>
            </a>
          )}
          {entry.email && !entry.email.startsWith("Not available") && (
            <a href={`mailto:${entry.email}`}>
              <button className="h-8 px-3 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-semibold hover:border-yellow-500/50 hover:text-yellow-300 transition-all flex items-center gap-1 bg-zinc-900">
                <Mail className="w-3 h-3" /> Email
              </button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DirectoryGrid({ data, search, stateFilter, categoryFilter, savedAgencies, onToggleSave }) {
  const filtered = useMemo(() => {
    return data.map(cat => ({
      ...cat,
      entries: cat.entries.filter(e => {
        const searchMatch = !search ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.desc.toLowerCase().includes(search.toLowerCase()) ||
          e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const stateMatch = stateMatches(e.tags, stateFilter);
        const catMatch = categoryMatches(e.tags, categoryFilter);
        return searchMatch && stateMatch && catMatch;
      }),
    })).filter(cat => cat.entries.length > 0);
  }, [data, search, stateFilter, categoryFilter]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400 font-semibold">No results found</p>
        <p className="text-sm text-zinc-600 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {filtered.map((cat) => (
        <div key={cat.category}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-yellow-500/10" />
            <h2 className="font-heading font-bold text-yellow-400 text-sm uppercase tracking-widest px-2">{cat.category}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 text-yellow-500/70 font-bold bg-yellow-500/5">{cat.entries.length}</span>
            <div className="h-px flex-1 bg-yellow-500/10" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.entries.map(entry => (
              <AgencyCard
                key={entry.name}
                entry={entry}
                saved={savedAgencies.has(entry.name)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Directories() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("escalation");
  const [stateFilter, setStateFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [savedAgencies, setSavedAgencies] = useState(new Set());
  const [showCategoryHubs, setShowCategoryHubs] = useState(true);

  const toggleSave = (name) => {
    setSavedAgencies(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleSelectCategory = (cat) => {
    setCategoryFilter(cat);
    setShowCategoryHubs(false);
    setActiveTab("escalation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savedData = useMemo(() => {
    const allEntries = [...escalationBodies, ...contactDirectory].flatMap(c => c.entries);
    const saved = allEntries.filter(e => savedAgencies.has(e.name));
    return saved.length > 0 ? [{ category: "Saved Agencies", icon: "Building2", color: "", entries: saved }] : [];
  }, [savedAgencies]);

  const tabs = [
    { id: "escalation", label: "Escalation Bodies" },
    { id: "contacts", label: "Contact Directory" },
    { id: "saved", label: `Saved${savedAgencies.size > 0 ? ` (${savedAgencies.size})` : ""}` },
    { id: "my-orgs", label: "My Organisations" },
  ];

  const isAgencyTab = activeTab === "escalation" || activeTab === "contacts";

  return (
    <div className="space-y-6 pb-16" style={{ background: "#050505", minHeight: "100vh" }}>

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-yellow-500/30 shadow-2xl" style={{ background: "#000", boxShadow: "0 0 40px rgba(255,208,0,0.08)" }}>
        <img
          src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg"
          alt="Chaos Controller — Escalation Directory"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* ── Hero Tagline ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-yellow-500/20 px-6 py-6" style={{ background: "linear-gradient(160deg, #111 0%, #0B0B0B 100%)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-400 text-xl">⚡</span>
          <h1 className="font-display font-black text-white text-2xl sm:text-3xl uppercase tracking-tight">TAKE BACK CONTROL</h1>
        </div>
        <p className="text-yellow-300/80 font-semibold text-sm mb-3">
          Find the organisation responsible. Know your rights. Escalate your complaint.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
          Search Australian regulators, ombudsman services, tribunals and complaint bodies.
          Find who handles your issue — then start building your case with Chaos Controller.
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-zinc-800" style={{ background: "#0B0B0B" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== "escalation" && tab.id !== "contacts") setShowCategoryHubs(false); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-150 ${
              activeTab === tab.id
                ? "border border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/20"
                : "text-zinc-500 hover:text-yellow-300"
            }`}
            style={activeTab === tab.id ? { background: "linear-gradient(90deg, #0B0B0B, #111)" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Category Hub Cards (shown first on escalation/contacts tabs) ── */}
      {isAgencyTab && showCategoryHubs && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-1">CHOOSE YOUR ISSUE TYPE</p>
              <h2 className="font-heading font-black text-white text-lg uppercase tracking-wide">What's your dispute?</h2>
            </div>
            <button
              onClick={() => setShowCategoryHubs(false)}
              className="text-xs text-zinc-500 hover:text-yellow-300 transition-colors border border-zinc-700 px-3 py-1.5 rounded-lg"
            >
              Browse all →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORY_HUBS.map(hub => (
              <CategoryHubCard key={hub.title} hub={hub} onSelectCategory={handleSelectCategory} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowCategoryHubs(false)}
              className="text-sm text-zinc-500 hover:text-yellow-300 transition-colors underline underline-offset-4"
            >
              Browse full directory without filtering
            </button>
          </div>
        </div>
      )}

      {/* ── Search + Filters (when browsing agencies) ─────────── */}
      {isAgencyTab && !showCategoryHubs && (
        <div className="space-y-3">
          {/* Back to categories */}
          <button
            onClick={() => { setShowCategoryHubs(true); setCategoryFilter("All"); setStateFilter("All"); setSearch(""); }}
            className="text-xs text-zinc-500 hover:text-yellow-300 transition-colors flex items-center gap-1.5"
          >
            ← Back to categories
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              placeholder="Search by name, provider, state or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
              style={{ background: "#0B0B0B" }}
            />
          </div>

          {/* State pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest shrink-0">STATE:</span>
            {STATE_FILTERS.map(s => (
              <FilterPill key={s} label={s} active={stateFilter === s} onClick={() => setStateFilter(s)} />
            ))}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest shrink-0">TYPE:</span>
            {CATEGORY_FILTERS.map(c => (
              <FilterPill key={c} label={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      {activeTab === "escalation" && !showCategoryHubs && (
        <DirectoryGrid
          data={escalationBodies}
          search={search}
          stateFilter={stateFilter}
          categoryFilter={categoryFilter}
          savedAgencies={savedAgencies}
          onToggleSave={toggleSave}
        />
      )}
      {activeTab === "contacts" && !showCategoryHubs && (
        <DirectoryGrid
          data={contactDirectory}
          search={search}
          stateFilter={stateFilter}
          categoryFilter={categoryFilter}
          savedAgencies={savedAgencies}
          onToggleSave={toggleSave}
        />
      )}

      {activeTab === "saved" && (
        savedData.length > 0 ? (
          <DirectoryGrid
            data={savedData}
            search=""
            stateFilter="All"
            categoryFilter="All"
            savedAgencies={savedAgencies}
            onToggleSave={toggleSave}
          />
        ) : (
          <div className="text-center py-16 rounded-2xl border border-zinc-800" style={{ background: "#0B0B0B" }}>
            <Star className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="font-bold text-white text-base">No saved agencies yet</p>
            <p className="text-sm text-zinc-500 mt-1">Click the ★ on any agency card to save it here.</p>
          </div>
        )
      )}

      {activeTab === "my-orgs" && <MyOrganisations />}

      {/* ── Footer disclaimer ──────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "#0B0B0B" }}>
        <p className="text-xs text-zinc-600 italic flex-1">
          <strong className="not-italic text-zinc-400">Disclaimer:</strong> Chaos Controller provides educational and document management assistance only. It does not provide legal advice. Always verify contact details on the provider's official website.
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/terms" className="text-xs text-zinc-600 hover:text-yellow-300 transition-colors flex items-center gap-1">
            <Scale className="w-3 h-3" /> Terms
          </Link>
          <Link to="/privacy" className="text-xs text-zinc-600 hover:text-yellow-300 transition-colors flex items-center gap-1">
            <Shield className="w-3 h-3" /> Privacy
          </Link>
          <Link to="/help" className="text-xs text-zinc-600 hover:text-yellow-300 transition-colors flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Help
          </Link>
        </div>
      </div>
    </div>
  );
}