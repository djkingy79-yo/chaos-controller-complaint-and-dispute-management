import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookMarked, Plus, Trash2, Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const LETTER_TYPE_LABELS = {
  letter1: "1st Complaint",
  letter2: "2nd Complaint",
  letter3: "3rd Complaint",
  accept_offer: "Accept Offer",
  deny_offer: "Deny Offer",
  escalation: "Escalation Letter",
};

const CATEGORY_LABELS = {
  banking: "Banking",
  insurance: "Insurance",
  tenancy: "Tenancy",
  telco: "Telco",
  utilities: "Utilities",
  other: "Other",
  general: "General",
};

export default function LetterTemplateManager({ letterType, currentText, onApplyTemplate }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["letter-templates", letterType],
    queryFn: () => base44.entities.LetterTemplate.filter({ letter_type: letterType }),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LetterTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-templates", letterType] });
      toast.success("Template deleted");
    },
  });

  const handleSave = async () => {
    if (!templateName.trim()) { toast.error("Enter a template name"); return; }
    if (!currentText?.trim()) { toast.error("No letter content to save"); return; }
    setSaving(true);
    try {
      await base44.entities.LetterTemplate.create({
        name: templateName.trim(),
        letter_type: letterType,
        content: currentText,
      });
      queryClient.invalidateQueries({ queryKey: ["letter-templates", letterType] });
      toast.success("Template saved");
      setTemplateName("");
      setShowSaveForm(false);
    } catch (e) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs"
      >
        <BookMarked className="w-3.5 h-3.5" />
        Templates
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-xl shadow-xl z-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {LETTER_TYPE_LABELS[letterType]} Templates
            </span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save current as template */}
          {!showSaveForm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowSaveForm(true)}
              disabled={!currentText?.trim()}
            >
              <Plus className="w-3.5 h-3.5" /> Save Current Letter as Template
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Template name..."
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="text-xs h-8"
                autoFocus
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 text-xs gap-1">
                  <Check className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowSaveForm(false); setTemplateName(""); }} className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Saved templates list */}
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2 italic">No saved templates yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-2 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                    {t.category && (
                      <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[t.category] || t.category}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-primary hover:text-primary shrink-0"
                    onClick={() => { onApplyTemplate(t.content); setOpen(false); toast.success(`"${t.name}" applied`); }}
                  >
                    Use
                  </Button>
                  <button
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => deleteMutation.mutate(t.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}