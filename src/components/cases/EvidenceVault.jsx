import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Image, Mail, FileCheck, Loader2,
  Trash2, ExternalLink, Plus, ScanLine, Camera,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DocumentScanResult from "./DocumentScanResult";
import DocumentScanner from "./DocumentScanner";

const typeConfig = {
  email:         { icon: Mail,      label: "Email",           color: "bg-primary/10 text-primary" },
  photo:         { icon: Image,     label: "Photo",           color: "bg-accent/10 text-accent" },
  contract:      { icon: FileCheck, label: "Contract",        color: "bg-warning/10 text-warning" },
  statement:     { icon: FileText,  label: "Statement",       color: "bg-success/10 text-success" },
  bank_statement:{ icon: FileText,  label: "Bank Statement",  color: "bg-success/10 text-success" },
  lease:         { icon: FileCheck, label: "Lease",           color: "bg-warning/10 text-warning" },
  notice:        { icon: FileText,  label: "Notice",          color: "bg-destructive/10 text-destructive" },
  receipt:       { icon: FileText,  label: "Receipt",         color: "bg-secondary text-secondary-foreground" },
  report:        { icon: FileText,  label: "Report",          color: "bg-muted text-muted-foreground" },
  invoice:       { icon: FileText,  label: "Invoice",         color: "bg-warning/10 text-warning" },
  correspondence:{ icon: Mail,      label: "Correspondence",  color: "bg-primary/10 text-primary" },
  id_document:   { icon: FileCheck, label: "ID Document",     color: "bg-accent/10 text-accent" },
  other:         { icon: FileText,  label: "Other",           color: "bg-muted text-muted-foreground" },
};

async function scanDocument(fileUrl, fileName, fileType) {
  const prompt = `You are an AI document analysis assistant for an Australian consumer advocacy platform. Use Australian English spelling in all responses.
Analyse this document (${fileType}: "${fileName}") and extract all relevant information.

Extract the following if present:
- complainant_name: Full name of the person making the complaint / the account holder
- complainant_address: Full postal address of the complainant
- complainant_email: Email address of the complainant
- complainant_phone: Phone number of the complainant
- account_numbers: Array of any account numbers, reference numbers, loan numbers, card numbers (last 4 digits ok)
- policy_numbers: Array of any policy, claim, or membership numbers
- merchant_name: Name of the company, bank, landlord, telco, insurer, etc. being complained about
- dates_mentioned: Array of key dates found (format as "DD MMM YYYY - context" e.g. "15 Jan 2024 - Transaction date")
- key_amounts: Array of dollar amounts with context e.g. "$1,200 - Disputed charge"
- document_summary: 1-2 sentence plain English summary of what this document is and what it shows
- timeline_events: Array of objects {date: "YYYY-MM-DD", description: "what happened", event_type: "incident|complaint|response|evidence|deadline"}

Be thorough. Extract all dates, all account numbers, all amounts. If something is not present, omit the field.
Return as JSON only.`;

  const schema = {
    type: "object",
    properties: {
      complainant_name: { type: "string" },
      complainant_address: { type: "string" },
      complainant_email: { type: "string" },
      complainant_phone: { type: "string" },
      account_numbers: { type: "array", items: { type: "string" } },
      policy_numbers: { type: "array", items: { type: "string" } },
      merchant_name: { type: "string" },
      dates_mentioned: { type: "array", items: { type: "string" } },
      key_amounts: { type: "array", items: { type: "string" } },
      document_summary: { type: "string" },
      timeline_events: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            description: { type: "string" },
            event_type: { type: "string" },
          },
        },
      },
    },
  };

  return await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: [fileUrl],
    response_json_schema: schema,
  });
}

export default function EvidenceVault({ caseId, evidence, caseItem }) {
  const [showUpload, setShowUpload] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ file_type: "other", description: "", event_date: "" });
  const [pendingScan, setPendingScan] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create(data),
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ["evidence", caseId] });
      setPendingScan({ evidenceId: created.id });
      setScanResult(null);
      setScanning(true);
      const extracted = await scanDocument(created.file_url, created.file_name, created.file_type);
      setScanResult({ evidenceId: created.id, data: extracted });
      await base44.entities.Evidence.update(created.id, { extracted_data: extracted, scan_status: "complete" });
      queryClient.invalidateQueries({ queryKey: ["evidence", caseId] });
      setScanning(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evidence", caseId] }),
  });

  const uploadAndProcess = async (files) => {
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      createMutation.mutate({
        case_id: caseId,
        file_url,
        file_name: file.name,
        file_type: newEvidence.file_type,
        description: newEvidence.description,
        event_date: newEvidence.event_date || undefined,
        scan_status: "pending",
      });
    }
    setUploading(false);
    setShowUpload(false);
    setNewEvidence({ file_type: "other", description: "", event_date: "" });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await uploadAndProcess(files);
  };

  const handleScanCapture = async (file) => {
    await uploadAndProcess(file, "photo");
  };

  const applyExtractedData = async (extracted) => {
    const caseUpdates = {};
    // Only fill fields that are currently blank on the case
    if (extracted.merchant_name && !caseItem?.organisation_name)
      caseUpdates.organisation_name = extracted.merchant_name;
    if (extracted.complainant_name && !caseItem?.complainant_name)
      caseUpdates.complainant_name = extracted.complainant_name;
    if (extracted.complainant_address && !caseItem?.complainant_address)
      caseUpdates.complainant_address = extracted.complainant_address;
    if (extracted.complainant_email && !caseItem?.complainant_email)
      caseUpdates.complainant_email = extracted.complainant_email;
    if (extracted.complainant_phone && !caseItem?.complainant_phone)
      caseUpdates.complainant_phone = extracted.complainant_phone;
    if (extracted.account_numbers?.length && !caseItem?.account_number)
      caseUpdates.account_number = extracted.account_numbers[0];
    // Use the earliest timeline event date as the incident date if not set
    if (!caseItem?.incident_date && extracted.timeline_events?.length) {
      const dates = extracted.timeline_events
        .map((e) => e.date)
        .filter(Boolean)
        .sort();
      if (dates[0]) caseUpdates.incident_date = dates[0];
    }
    if (Object.keys(caseUpdates).length > 0) {
      await base44.entities.Case.update(caseId, caseUpdates);
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    }
    if (extracted.timeline_events?.length > 0) {
      for (const ev of extracted.timeline_events) {
        if (!ev.date || !ev.description) continue;
        await base44.entities.TimelineEvent.create({
          case_id: caseId,
          title: ev.description.slice(0, 80),
          description: ev.description,
          event_date: ev.date,
          event_type: ev.event_type || "incident",
          is_action_required: false,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
    }
    setAppliedIds((prev) => new Set([...prev, scanResult?.evidenceId]));
  };

  const sorted = [...evidence].sort((a, b) => {
    if (a.event_date && b.event_date) return new Date(a.event_date) - new Date(b.event_date);
    return new Date(a.created_date) - new Date(b.created_date);
  });

  return (
    <div className="space-y-4">
      <DocumentScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onCapture={handleScanCapture}
      />

      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Evidence Vault</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowScanner(true)}>
            <Camera className="w-3.5 h-3.5" /> Scan Doc
          </Button>

          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Drop the Evidence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <ScanLine className="w-3.5 h-3.5 text-primary inline mr-1.5" />
                  AI will automatically scan your document and extract key details — names, account numbers, dates, amounts — and build your case timeline.
                </p>
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={newEvidence.file_type} onValueChange={(v) => setNewEvidence({ ...newEvidence, file_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newEvidence.description}
                    onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                    placeholder="e.g. Email from bank rejecting claim"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Date (optional)</Label>
                  <Input
                    type="date"
                    value={newEvidence.event_date}
                    onChange={(e) => setNewEvidence({ ...newEvidence, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <input ref={fileRef} type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.csv,.eml" onChange={handleUpload} />
                  <Button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || createMutation.isPending}
                    className="w-full gap-2"
                  >
                    {uploading || createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? "Uploading..." : createMutation.isPending ? "Saving..." : "Choose Files & Upload"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">Select multiple files at once</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {scanning && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary">
          <ScanLine className="w-4 h-4 animate-pulse" />
          <span className="font-medium">AI is scanning your document...</span>
          <span className="text-xs text-primary/70">Extracting names, dates, account numbers &amp; building timeline</span>
        </div>
      )}

      {scanResult && !scanning && (
        <DocumentScanResult
          extracted={scanResult.data}
          confirmed={appliedIds.has(scanResult.evidenceId)}
          onConfirm={() => applyExtractedData(scanResult.data)}
        />
      )}

      {sorted.length === 0 && !scanning ? (
        <div className="bg-secondary/30 rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">DROP THE EVIDENCE</p>
          <p className="text-xs text-muted-foreground">Leases, bank statements, emails, letters, photos.</p>
          <p className="text-xs text-muted-foreground mt-0.5">AI scans every document and builds your timeline automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((ev) => {
            const cfg = typeConfig[ev.file_type] || typeConfig.other;
            const TypeIcon = cfg.icon;
            const isScanning = pendingScan?.evidenceId === ev.id && scanning;
            const thisScanResult = scanResult?.evidenceId === ev.id ? scanResult.data : ev.extracted_data;

            return (
              <div key={ev.id} className="bg-card border border-border rounded-lg p-3 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 group">
                  <div className={`p-2 rounded-lg ${cfg.color}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
                      {ev.event_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(ev.event_date), "d MMM yyyy")}
                        </span>
                      )}
                      {isScanning && (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Scanning...
                        </span>
                      )}
                      {ev.scan_status === "complete" && (
                        <span className="text-[10px] text-success flex items-center gap-1">
                          <ScanLine className="w-2.5 h-2.5" /> Scanned
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate(ev.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {thisScanResult && ev.scan_status === "complete" && scanResult?.evidenceId !== ev.id && (
                  <DocumentScanResult
                    extracted={thisScanResult}
                    confirmed={true}
                    onConfirm={null}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}