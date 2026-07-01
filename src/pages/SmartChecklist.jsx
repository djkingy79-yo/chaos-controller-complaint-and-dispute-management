import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, XCircle, Lock, Plus, Upload, Trash2, ClipboardList, Download, Printer } from "lucide-react";
import { downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import ReportDocument from "@/components/reports/ReportDocument";
import { renderDocToBlob } from "@/lib/renderDocToBlob";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusConfig = {
  complete: { label: "Complete", icon: CheckCircle2, className: "text-success", badge: "bg-success/15 text-success" },
  needs_review: { label: "Needs Review", icon: AlertTriangle, className: "text-warning", badge: "bg-warning/15 text-warning" },
  missing: { label: "Missing", icon: XCircle, className: "text-destructive", badge: "bg-destructive/15 text-destructive" },
  locked: { label: "Locked", icon: Lock, className: "text-muted-foreground", badge: "bg-secondary text-secondary-foreground" },
};

const categoryLabels = {
  complaint: "Complaint", evidence: "Evidence", response: "Response",
  deadline: "Deadline", escalation: "Escalation", document: "Document",
};

const defaultItems = [
  { label: "First complaint letter sent", category: "complaint", requires_proof: true },
  { label: "Evidence uploaded and categorised", category: "evidence", requires_proof: true },
  { label: "Provider response received", category: "response", requires_proof: true },
  { label: "Response deadline tracked", category: "deadline", requires_proof: false },
  { label: "Ready for escalation", category: "escalation", requires_proof: false },
];

async function buildChecklistBlob(items, caseName) {
  const bullets = items.map((item) => {
    const tick = item.status === 'complete' ? '[x]' : '[ ]';
    return `${tick} ${item.label} — ${item.category} — ${item.status.replace('_', ' ').toUpperCase()}`;
  });

  const blob = await renderDocToBlob(
    <ReportDocument
      title="Smart Checklist"
      subtitle={caseName}
      generatedLabel={`Generated ${format(new Date(), 'd MMMM yyyy')}`}
      sections={[{ heading: `Checklist (${items.length} items)`, bullets }]}
    />
  );
  if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
  return blob;
}

async function downloadChecklistPDF(items, caseName) {
  const blob = await buildChecklistBlob(items, caseName);
  downloadPDFBlob(blob, `Checklist_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  if (blob._warnings?.length) toast.warning('PDF generated but branding image failed to load.');
  else toast.success('Checklist PDF downloaded');
}

async function printChecklistPDF(items, caseName) {
  const blob = await buildChecklistBlob(items, caseName);
  if (blob._warnings?.length) toast.warning('PDF generated but branding image failed to load.');
  const opened = openPDFForPrint(blob, `Checklist_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  if (!opened) {
    toast.warning('Print preview was blocked. PDF downloaded instead.');
    downloadPDFBlob(blob, `Checklist_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
}

export default function SmartChecklist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedCase, setSelectedCase] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", category: "evidence", requires_proof: true });
  const [uploading, setUploading] = useState(null);

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["checklist", selectedCase],
    queryFn: () => selectedCase ? base44.entities.ChecklistItem.filter({ case_id: selectedCase }) : [],
    enabled: !!selectedCase,
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.ChecklistItem.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklist", selectedCase] }); setOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistItem.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", selectedCase] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", selectedCase] }),
  });

  const handleSeedChecklist = async () => {
    for (const item of defaultItems) {
      await base44.entities.ChecklistItem.create({ ...item, case_id: selectedCase, status: "missing" });
    }
    qc.invalidateQueries({ queryKey: ["checklist", selectedCase] });
  };

  const handleProofUpload = async (item, file) => {
    setUploading(item.id);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateMutation.mutateAsync({ id: item.id, data: { proof_url: file_url, status: "complete" } });
    setUploading(null);
  };

  const complete = items.filter(i => i.status === "complete").length;
  const progress = items.length > 0 ? Math.round((complete / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-primary" /> Smart Checklist
          </h1>
          <p className="text-muted-foreground text-sm mt-1">No proof = No tick. Every item must be evidenced.</p>
        </div>
        <div className="flex gap-2">
          {selectedCase && items.length === 0 && (
            <Button variant="outline" onClick={handleSeedChecklist}>Generate Default Checklist</Button>
          )}
          {selectedCase && items.length > 0 && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => downloadChecklistPDF(items, cases.find(c=>c.id===selectedCase)?.title || 'Case').catch(e => alert('PDF failed: ' + e.message))}>
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => printChecklistPDF(items, cases.find(c=>c.id===selectedCase)?.title || 'Case').catch(e => toast.error('Print PDF failed: ' + e.message))}>
                <Printer className="w-4 h-4" /> Print PDF
              </Button>
            </>
          )}
          {selectedCase && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Checklist Item</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Item Label</Label>
                    <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="What needs to be done?" className="mt-1" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => createMutation.mutate({ ...form, case_id: selectedCase, status: "missing" })} disabled={!form.label}>Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Case selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <Label className="text-sm font-medium">Select Case</Label>
        <Select value={selectedCase} onValueChange={setSelectedCase}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="Choose a case to view checklist..." /></SelectTrigger>
          <SelectContent>
            {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedCase && (
        <>
          {/* Progress */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{progress}% ({complete}/{items.length})</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Items by category */}
          {items.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No checklist items yet. Generate a default checklist or add items manually.</p>
              <Button onClick={handleSeedChecklist}>Generate Default Checklist</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => {
                const cfg = statusConfig[item.status] || statusConfig.missing;
                const Icon = cfg.icon;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                    <Icon className={`w-5 h-5 shrink-0 ${cfg.className}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${item.status === "complete" ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
                        <Badge className={`${cfg.badge} border-0 text-xs`}>{cfg.label}</Badge>
                        <Badge variant="outline" className="text-xs">{categoryLabels[item.category]}</Badge>
                        {item.requires_proof && !item.proof_url && (
                          <span className="text-xs text-destructive font-medium">Proof required</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status cycle */}
                      <Select value={item.status} onValueChange={(v) => updateMutation.mutate({ id: item.id, data: { status: v } })}>
                        <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {/* Proof upload */}
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleProofUpload(item, e.target.files[0])} />
                        <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                          <span>{uploading === item.id ? <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}</span>
                        </Button>
                      </label>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}