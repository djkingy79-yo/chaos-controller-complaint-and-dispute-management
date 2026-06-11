import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Building2, Scale, Home, Zap, Phone, Shield, Landmark } from "lucide-react";
import { motion } from "framer-motion";

const directories = [
  {
    category: "Banking & Finance",
    icon: Landmark,
    color: "bg-primary/10 text-primary",
    entries: [
      { name: "Australian Financial Complaints Authority (AFCA)", desc: "Free dispute resolution for banking, insurance, super, credit and investments.", url: "https://www.afca.org.au", tags: ["Banking", "Insurance", "Super", "Credit"] },
      { name: "Australian Prudential Regulation Authority (APRA)", desc: "Regulates banks, insurance companies and superannuation funds.", url: "https://www.apra.gov.au", tags: ["Banking", "Insurance"] },
      { name: "Australian Securities & Investments Commission (ASIC)", desc: "Regulates financial services and markets.", url: "https://www.asic.gov.au", tags: ["Finance", "Investments"] },
    ],
  },
  {
    category: "Insurance",
    icon: Shield,
    color: "bg-accent/10 text-accent",
    entries: [
      { name: "AFCA – Insurance Disputes", desc: "Lodge complaints about home, car, travel and life insurance.", url: "https://www.afca.org.au/make-a-complaint/insurance", tags: ["Insurance", "AFCA"] },
      { name: "Insurance Council of Australia", desc: "Industry body for general insurance.", url: "https://insurancecouncil.com.au", tags: ["Insurance"] },
    ],
  },
  {
    category: "Tenancy & Housing",
    icon: Home,
    color: "bg-success/10 text-success",
    entries: [
      { name: "NSW Civil and Administrative Tribunal (NCAT)", desc: "Resolves tenancy disputes in NSW including rent, repairs and bond.", url: "https://www.ncat.nsw.gov.au", tags: ["Tenancy", "NSW"] },
      { name: "Victorian Civil and Administrative Tribunal (VCAT)", desc: "Residential tenancy disputes in Victoria.", url: "https://www.vcat.vic.gov.au", tags: ["Tenancy", "VIC"] },
      { name: "NSW Fair Trading – Tenancy", desc: "Rental bonds, repairs and landlord obligations.", url: "https://www.fairtrading.nsw.gov.au/housing-and-property/renting", tags: ["Tenancy", "NSW", "Fair Trading"] },
      { name: "Tenants' Union of NSW", desc: "Free advice and advocacy for renters.", url: "https://www.tenants.org.au", tags: ["Tenancy", "NSW"] },
    ],
  },
  {
    category: "Telecommunications",
    icon: Phone,
    color: "bg-warning/10 text-warning",
    entries: [
      { name: "Telecommunications Industry Ombudsman (TIO)", desc: "Free, independent complaints service for phone and internet disputes.", url: "https://www.tio.com.au", tags: ["Telco", "Internet"] },
      { name: "Australian Communications and Media Authority (ACMA)", desc: "Regulates communications and media industries.", url: "https://www.acma.gov.au", tags: ["Telco", "Media"] },
    ],
  },
  {
    category: "Utilities & Energy",
    icon: Zap,
    color: "bg-chart-4/10 text-chart-4",
    entries: [
      { name: "Energy and Water Ombudsman NSW (EWON)", desc: "Free independent dispute resolution for energy and water customers in NSW.", url: "https://www.ewon.com.au", tags: ["Energy", "Water", "NSW"] },
      { name: "Energy and Water Ombudsman Victoria (EWOV)", desc: "Electricity, gas and water complaints in Victoria.", url: "https://www.ewov.com.au", tags: ["Energy", "Water", "VIC"] },
      { name: "Australian Energy Regulator (AER)", desc: "Protects consumers of electricity and gas.", url: "https://www.aer.gov.au", tags: ["Energy", "National"] },
    ],
  },
  {
    category: "Consumer & Fair Trading",
    icon: Scale,
    color: "bg-destructive/10 text-destructive",
    entries: [
      { name: "NSW Fair Trading", desc: "Consumer protection, product safety, and business conduct.", url: "https://www.fairtrading.nsw.gov.au", tags: ["Consumer", "NSW"] },
      { name: "Consumer Affairs Victoria", desc: "Consumer rights, complaints and scam prevention.", url: "https://www.consumer.vic.gov.au", tags: ["Consumer", "VIC"] },
      { name: "ACCC – Australian Competition and Consumer Commission", desc: "National consumer watchdog. Handles misleading conduct and unconscionable behaviour.", url: "https://www.accc.gov.au", tags: ["Consumer", "National"] },
    ],
  },
];

export default function Directories() {
  const [search, setSearch] = useState("");

  const filtered = directories.map((cat) => ({
    ...cat,
    entries: cat.entries.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.desc.toLowerCase().includes(search.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.entries.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Building2 className="w-7 h-7 text-primary" /> Escalation Directories
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Know where to escalate. Every body, every pathway.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, category, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {filtered.map((cat, ci) => {
          const CatIcon = cat.icon;
          return (
            <motion.div key={cat.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${cat.color}`}>
                  <CatIcon className="w-4 h-4" />
                </div>
                <h2 className="font-heading font-semibold text-foreground">{cat.category}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {cat.entries.map((entry) => (
                  <a
                    key={entry.name}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all group block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors leading-tight">{entry.name}</h3>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{entry.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {entry.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="bg-secondary/40 rounded-xl border border-border p-4 text-xs text-muted-foreground italic">
        <strong className="not-italic text-foreground">Disclaimer:</strong> Chaos Controller provides educational, organisational and document management assistance only. It does not provide legal advice. The creator is not a lawyer or legal practitioner. Users should seek assistance from a qualified legal professional.
      </div>
    </div>
  );
}