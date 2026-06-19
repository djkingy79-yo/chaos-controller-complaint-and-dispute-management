import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Copy, Check, Search, FileText, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { templates, templateCategories } from "@/lib/templateData";

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copied, setCopied] = useState(false);

  const filtered = templates.filter(t => {
    const matchCat = selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedTemplate.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const catColor = (cat) => templateCategories.find(c => c.id === cat)?.color || "#FFD700";
  const catLabel = (cat) => templateCategories.find(c => c.id === cat)?.label || cat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Letter Template Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{templates.length} professional templates — select, copy and customise</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Browse */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {templateCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#FFD700] text-black border-[#FFD700]"
                      : "bg-card border-border text-foreground hover:border-[#FFD700]/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Template List */}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {filtered.map((t, idx) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTemplate?.id === t.id
                    ? "border-[#FFD700] bg-[#FFD700]/5"
                    : "border-border bg-card hover:border-[#FFD700]/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${catColor(t.category)}20` }}>
                    <FileText className="w-4 h-4" style={{ color: catColor(t.category) }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground leading-tight">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</p>
                    <Badge className="mt-2 text-xs px-2 py-0.5" style={{ backgroundColor: `${catColor(t.category)}25`, color: catColor(t.category), border: `1px solid ${catColor(t.category)}40` }}>
                      {catLabel(t.category)}
                    </Badge>
                  </div>
                </div>
              </motion.button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No templates found.</p>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <motion.div
              key={selectedTemplate.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Template Header */}
              <div className="p-5 border-b border-border flex items-center justify-between gap-4"
                style={{ borderLeft: `4px solid ${catColor(selectedTemplate.category)}` }}>
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">{selectedTemplate.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
                </div>
                <Button
                  onClick={handleCopy}
                  className="shrink-0 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold gap-2"
                >
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Letter</>}
                </Button>
              </div>

              {/* Instructions */}
              <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">How to use:</span> Copy this template, paste it into your word processor or email, then replace all <span className="font-bold text-[#FFD700]">[bracketed fields]</span> with your specific details before sending.
                </p>
              </div>

              {/* Letter Body */}
              <div className="p-5 max-h-[70vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-body text-sm text-foreground leading-relaxed bg-background border border-border rounded-lg p-5">
                  {selectedTemplate.body}
                </pre>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center border-2 border-dashed border-border rounded-xl p-8">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-bold text-foreground mb-2">Select a Template</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose from {templates.length} templates covering banking, insurance, tenancy, employment, legal, statutory declarations, and government disputes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}