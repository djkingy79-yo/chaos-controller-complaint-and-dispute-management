import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Building2, Scale, Home, Zap, Phone, Shield, Landmark, Mail, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { escalationBodies, contactDirectory } from "@/lib/directoriesData";

const iconMap = { Landmark, Shield, Home, Phone, Zap, Scale, Building2 };

function DirectoryEntry({ entry }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm text-foreground leading-tight">{entry.name}</h3>
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0 mt-0.5">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{entry.desc}</p>
      <div className="mt-2.5 space-y-1">
        {entry.phone && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <Phone className="w-3 h-3 text-primary shrink-0" />
            <span className="font-medium">{entry.phone}</span>
          </div>
        )}
        {entry.email && entry.email !== "Not available – use online form" && entry.email !== "Not available – contact individual office" && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <Mail className="w-3 h-3 text-primary shrink-0" />
            <a href={`mailto:${entry.email}`} className="hover:text-primary truncate">{entry.email}</a>
          </div>
        )}
        {entry.email && (entry.email === "Not available – use online form" || entry.email === "Not available – contact individual office") && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
            <Mail className="w-3 h-3 shrink-0" />
            <span>{entry.email}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {entry.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs px-1.5 py-0">{t}</Badge>
        ))}
      </div>
    </div>
  );
}

function DirectorySection({ data, search }) {
  const filtered = data.map((cat) => ({
    ...cat,
    entries: cat.entries.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.desc.toLowerCase().includes(search.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.entries.length > 0);

  if (filtered.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-12">No results found for "{search}".</p>;
  }

  return (
    <div className="space-y-6">
      {filtered.map((cat, ci) => {
        const CatIcon = iconMap[cat.icon] || Building2;
        return (
          <motion.div key={cat.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.04 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${cat.color}`}>
                <CatIcon className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-semibold text-foreground">{cat.category}</h2>
              <Badge variant="secondary" className="text-xs">{cat.entries.length}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {cat.entries.map((entry) => (
                <DirectoryEntry key={entry.name} entry={entry} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function Directories() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("escalation");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Building2 className="w-7 h-7 text-primary" /> Escalation Directories
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Every body, every pathway, every contact — Australia-wide.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("escalation")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "escalation" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Escalation Bodies
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "contacts" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Contact Directory
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, provider, state, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {activeTab === "escalation" && (
        <DirectorySection data={escalationBodies} search={search} />
      )}
      {activeTab === "contacts" && (
        <DirectorySection data={contactDirectory} search={search} />
      )}

      {/* Footer Links */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="bg-secondary/40 rounded-xl border border-border p-4 text-xs text-muted-foreground italic">
            <strong className="not-italic text-foreground">Disclaimer:</strong> Chaos Controller provides educational, organisational and document management assistance only. It does not provide legal advice. The creator is not a lawyer or legal practitioner. Contact details may change — always verify current information on the provider's official website. Users should seek assistance from a qualified legal professional.
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Scale className="w-3 h-3" /> Terms
            </a>
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" /> Privacy
            </a>
            <a href="/help" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}