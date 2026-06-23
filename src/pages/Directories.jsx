import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Search, Building2, Scale, Home, Zap, Phone, Shield,
  Landmark, Mail, BookOpen, Car, Heart, Globe, Star,
  ChevronDown, ChevronUp, MapPin, AlertCircle, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { escalationBodies, contactDirectory } from "@/lib/directoriesData";
import MyOrganisations from "@/components/directories/MyOrganisations";
import { Link } from "react-router-dom";

const iconMap = { Landmark, Shield, Home, Phone, Zap, Scale, Building2, Car, Heart };

const STATE_FILTERS = ["All", "National", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

const CATEGORY_FILTERS = [
  "All", "Banking", "Insurance", "Tenancy", "Energy", "Telco",
  "Consumer", "Government", "Legal", "Health", "Super", "Real Estate", "Other"
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

const STATE_COLORS = {
  National: "bg-primary/10 text-primary border-primary/30",
  NSW: "bg-blue-500/10 text-blue-700 border-blue-400/30",
  VIC: "bg-purple-500/10 text-purple-700 border-purple-400/30",
  QLD: "bg-yellow-500/10 text-yellow-700 border-yellow-400/30",
  SA: "bg-red-500/10 text-red-700 border-red-400/30",
  WA: "bg-orange-500/10 text-orange-700 border-orange-400/30",
  TAS: "bg-teal-500/10 text-teal-700 border-teal-400/30",
  NT: "bg-amber-500/10 text-amber-700 border-amber-400/30",
  ACT: "bg-indigo-500/10 text-indigo-700 border-indigo-400/30",
};

const CATEGORY_COLORS = {
  Banking: "bg-primary/10 text-primary border-primary/30",
  Finance: "bg-primary/10 text-primary border-primary/30",
  Bank: "bg-primary/10 text-primary border-primary/30",
  Insurance: "bg-purple-500/10 text-purple-700 border-purple-400/30",
  Health: "bg-red-500/10 text-red-700 border-red-400/30",
  Energy: "bg-yellow-500/10 text-yellow-700 border-yellow-400/30",
  Water: "bg-teal-500/10 text-teal-700 border-teal-400/30",
  Telco: "bg-orange-500/10 text-orange-700 border-orange-400/30",
  Internet: "bg-orange-500/10 text-orange-700 border-orange-400/30",
  Tenancy: "bg-green-500/10 text-green-700 border-green-400/30",
  Consumer: "bg-destructive/10 text-destructive border-destructive/30",
  Government: "bg-muted text-muted-foreground border-border",
  Legal: "bg-accent/10 text-accent border-accent/30",
  Super: "bg-primary/10 text-primary border-primary/30",
};

function getTagColor(tag) {
  for (const [key, cls] of Object.entries(CATEGORY_COLORS)) {
    if (tag.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  for (const [state, cls] of Object.entries(STATE_COLORS)) {
    if (tag === state) return cls;
  }
  return "bg-secondary text-secondary-foreground border-border";
}

const WHEN_TO_CONTACT_MAP = {
  "AFCA": ["Your bank, insurer or super fund hasn't resolved your complaint in 30–45 days", "You received an unsatisfactory final response", "The organisation is not engaging with your complaint"],
  "TIO": ["Your telco hasn't resolved your complaint in 10 business days", "You have been given a final response you disagree with", "Service issues are ongoing without resolution"],
  "AER": ["Your energy retailer won't resolve your dispute", "You've been disconnected unfairly", "Billing errors remain unaddressed"],
  "ACCC": ["A company is engaging in misleading or deceptive conduct", "Product safety concerns", "Unfair contract terms"],
  "Ombudsman": ["Government agency has failed to act fairly", "Decision appears to be wrong or unreasonable", "No response within required timeframes"],
  "Legal Aid": ["You need free legal advice", "Court proceedings are involved", "You cannot afford a private solicitor"],
};

function getWhenToContact(entry) {
  for (const [key, tips] of Object.entries(WHEN_TO_CONTACT_MAP)) {
    if (entry.name.includes(key)) return tips;
  }
  if (entry.tags.some(t => ["Banking", "Bank"].includes(t))) return ["Your bank has not resolved your complaint within 30–45 days", "You received a final response you disagree with", "You want to escalate beyond the bank"];
  if (entry.tags.some(t => t === "Telco")) return ["Telco hasn't resolved complaint in 10 days", "You received a final unsatisfactory response", "Service faults remain unresolved"];
  if (entry.tags.some(t => t === "Energy")) return ["Energy provider ignored your complaint", "Bill is incorrect and unresolved", "You face unfair disconnection"];
  if (entry.tags.some(t => t === "Tenancy")) return ["Landlord is not responding to repairs", "Bond dispute needs resolution", "Notice has not been resolved by agent"];
  if (entry.tags.some(t => t === "Insurance")) return ["Claim has been denied unfairly", "Insurer is not responding", "You received an unsatisfactory settlement offer"];
  if (entry.tags.some(t => t === "Government")) return ["Government agency failed to act on your matter", "Decision appears wrong or unreasonable", "Required timeframes have passed"];
  return ["Complaint not resolved after direct contact", "You received a final rejection", "Escalation required"];
}

function AgencyCard({ entry, saved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);
  const whenToContact = getWhenToContact(entry);
  const stateTag = entry.tags.find(t => STATE_FILTERS.includes(t));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-yellow-500/40 hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-foreground text-sm leading-tight">{entry.name}</h3>
            {stateTag && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded border ${STATE_COLORS[stateTag] || "bg-secondary text-secondary-foreground border-border"}`}>
                <MapPin className="w-2.5 h-2.5" />
                {stateTag}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onToggleSave(entry.name)}
          className="shrink-0 text-muted-foreground hover:text-yellow-500 transition-colors mt-0.5"
          title={saved ? "Remove from saved" : "Save agency"}
        >
          {saved ? <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> : <Star className="w-4 h-4" />}
        </button>
      </div>

      {/* Tags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1">
        {entry.tags.filter(t => !STATE_FILTERS.includes(t)).slice(0, 3).map(t => (
          <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getTagColor(t)}`}>{t}</span>
        ))}
      </div>

      {/* About */}
      <div className="px-5 pb-4 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">About</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{entry.desc}</p>
      </div>

      {/* Contact Details */}
      <div className="px-5 pb-4 space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contact</p>
        {entry.phone && (
          <a href={`tel:${entry.phone}`} className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors group">
            <Phone className="w-3 h-3 text-yellow-600 shrink-0" />
            <span className="font-medium group-hover:underline">{entry.phone}</span>
          </a>
        )}
        {entry.email && !entry.email.startsWith("Not available") && (
          <a href={`mailto:${entry.email}`} className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors group">
            <Mail className="w-3 h-3 text-yellow-600 shrink-0" />
            <span className="truncate group-hover:underline">{entry.email}</span>
          </a>
        )}
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors group">
            <Globe className="w-3 h-3 text-yellow-600 shrink-0" />
            <span className="truncate group-hover:underline">{new URL(entry.url).hostname.replace('www.', '')}</span>
          </a>
        )}
      </div>

      {/* Expandable: When to Contact */}
      <div className="border-t border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all"
        >
          <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> When to contact</span>
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
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/75">
                    <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2 border-t border-border">
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500/60">
              <Globe className="w-3 h-3" /> Visit Website
            </Button>
          </a>
        )}
        {entry.phone && (
          <a href={`tel:${entry.phone}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <Phone className="w-3 h-3" /> Call
            </Button>
          </a>
        )}
        {entry.email && !entry.email.startsWith("Not available") && (
          <a href={`mailto:${entry.email}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <Mail className="w-3 h-3" /> Email
            </Button>
          </a>
        )}
        <Link to="/new-case">
          <Button size="sm" className="h-7 text-xs gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">
            <Plus className="w-3 h-3" /> Create Case
          </Button>
        </Link>
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
        <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No results found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filtered.map((cat) => {
        const CatIcon = iconMap[cat.icon] || Building2;
        return (
          <div key={cat.category}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`p-2 rounded-xl ${cat.color}`}>
                <CatIcon className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-foreground text-base">{cat.category}</h2>
              <Badge variant="secondary" className="text-xs font-medium">{cat.entries.length}</Badge>
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
        );
      })}
    </div>
  );
}

export default function Directories() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("escalation");
  const [stateFilter, setStateFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [savedAgencies, setSavedAgencies] = useState(new Set());

  const toggleSave = (name) => {
    setSavedAgencies(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const savedData = useMemo(() => {
    const allEntries = [...escalationBodies, ...contactDirectory].flatMap(c => c.entries);
    const saved = allEntries.filter(e => savedAgencies.has(e.name));
    return saved.length > 0 ? [{ category: "Saved Agencies", icon: "Building2", color: "bg-yellow-500/10 text-yellow-600", entries: saved }] : [];
  }, [savedAgencies]);

  const tabs = [
    { id: "escalation", label: "Escalation Bodies" },
    { id: "contacts", label: "Contact Directory" },
    { id: "saved", label: `Saved${savedAgencies.size > 0 ? ` (${savedAgencies.size})` : ""}` },
    { id: "my-orgs", label: "My Organisations" },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* Hero Banner */}
      <div className="overflow-hidden rounded-2xl border border-yellow-500/30 shadow-lg bg-black">
        <img
          src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg"
          alt="Chaos Controller — Escalation Directory"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Building2 className="w-7 h-7 text-yellow-500" /> Escalation Directories
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Every body, every pathway, every contact — Australia-wide.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-secondary/50 rounded-xl p-1 w-full sm:w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-card shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      {activeTab !== "my-orgs" && activeTab !== "saved" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, provider, state, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground shrink-0">State:</span>
            {STATE_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStateFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                  stateFilter === s
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "border-border text-muted-foreground hover:border-yellow-500/50 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Category:</span>
            {CATEGORY_FILTERS.map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                  categoryFilter === c
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "border-border text-muted-foreground hover:border-yellow-500/50 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "escalation" && (
        <DirectoryGrid
          data={escalationBodies}
          search={search}
          stateFilter={stateFilter}
          categoryFilter={categoryFilter}
          savedAgencies={savedAgencies}
          onToggleSave={toggleSave}
        />
      )}
      {activeTab === "contacts" && (
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
          <div className="text-center py-16">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No saved agencies yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click the ★ on any agency card to save it here.</p>
          </div>
        )
      )}
      {activeTab === "my-orgs" && <MyOrganisations search={search} />}

      {/* Footer */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="bg-secondary/40 rounded-xl border border-border p-4 text-xs text-muted-foreground italic flex-1">
            <strong className="not-italic text-foreground">Disclaimer:</strong> Chaos Controller provides educational, organisational and document management assistance only. It does not provide legal advice. Contact details may change — always verify current information on the provider's official website.
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Scale className="w-3 h-3" /> Terms
            </Link>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" /> Privacy
            </Link>
            <Link to="/help" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}