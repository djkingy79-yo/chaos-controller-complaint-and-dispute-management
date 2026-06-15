import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Search, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OrgPicker({ category, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["organisations"],
    queryFn: () => base44.entities.Organisation.list("-created_date"),
  });

  const filtered = orgs.filter((o) => {
    const matchesCategory = !category || !o.category || o.category === category;
    const matchesSearch = !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.category?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) return <p className="text-xs text-muted-foreground py-2">Loading saved organisations...</p>;

  if (orgs.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground">
        No saved organisations yet — add them in the Directories page.
        <button onClick={onClose} className="block mt-1 mx-auto text-primary hover:underline">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="border border-primary/20 bg-secondary/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" /> Select from saved organisations
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-7 h-8 text-xs"
        />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No matches found.</p>
        )}
        {filtered.map((org) => (
          <button
            key={org.id}
            onClick={() => onSelect(org)}
            className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
              {org.complaints_email && <p className="text-xs text-muted-foreground truncate">{org.complaints_email}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {org.category && <Badge variant="outline" className="text-xs capitalize hidden sm:block">{org.category}</Badge>}
              <Check className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}