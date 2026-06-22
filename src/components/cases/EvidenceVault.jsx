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
  Trash2, ExternalLink, Plus, ScanLine, Camera, Tag, FileDigit,
  HardDrive, Search, Printer, Download,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import DocumentScanResult from "./DocumentScanResult";
import DocumentScanner from "./DocumentScanner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription } from "@/lib/subscription";
import { useQuery } from "@tanstack/react-query";
import { generateChaosDocumentPDF, downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";
import { detectIndustry, detectIndustryDebug } from "@/lib/industryClassifier";

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
Analyse this document (${fileType}: "${fileName}") and extract ALL relevant information to fully set up the case.

Extract the following:
- complainant_name: Full name of the person making the complaint / account holder
- complainant_address: Full postal address of the complainant
- complainant_email: Email address of the complainant
- complainant_phone: Phone number of the complainant
- account_numbers: Array of any account, reference, loan, claim or membership numbers found
- policy_numbers: Array of any policy, claim, or membership numbers
- merchant_name: Name of the company, bank, landlord, telco, insurer, etc. involved
- dates_mentioned: Array of key dates found (format as "DD MMM YYYY - context")
- key_amounts: Array of dollar amounts with context e.g. "$1,200 - Disputed charge"
- document_summary: 2-3 sentence plain English summary of what this document is and what it shows
- issue_summary: 1-2 sentence summary of the core dispute or issue described in the document
- desired_outcome: What a reasonable person in this situation would want as a resolution (1 sentence)
- timeline_events: Array of {date: "YYYY-MM-DD", description: "what happened", event_type: "incident|complaint|response|evidence|deadline|action_required"}
- checklist_items: Array of {label: "action item description", category: "complaint|evidence|response|deadline|document|escalation"} — things the person needs to do to resolve this dispute
- deadlines: Array of {title: "deadline description", deadline_date: "YYYY-MM-DD", deadline_type: "response_due|submission|escalation_window|review_period|other", notes: "why this deadline matters"} — any time-sensitive actions or legal deadlines

Be thorough. If a response deadline is mentioned (e.g. "respond within 21 days"), calculate the deadline from the document date.
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
      issue_summary: { type: "string" },
      desired_outcome: { type: "string" },
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
      checklist_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            category: { type: "string" },
          },
        },
      },
      deadlines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            deadline_date: { type: "string" },
            deadline_type: { type: "string" },
            notes: { type: "string" },
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
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ file_type: "other", description: "", event_date: "", tags: [] });
  const [filterTag, setFilterTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  // Get subscription for file limit checking
  const { data: payments = [] } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const subscription = getActiveSubscription(user, payments);
  const PLAN_FILE_LIMITS = { Starter: 25, Pro: 100, Command: 1000 };
  const fileLimit = subscription ? PLAN_FILE_LIMITS[subscription.plan_name] || 25 : 25;
  const currentFileCount = evidence.length;
  const canUpload = currentFileCount < fileLimit;

  const TAGS = ["Bank Statement", "Email Chain", "Photo", "Contract", "Lease", "Invoice", "Receipt", "Correspondence", "Notice", "Report", "ID Document", "Other"];

  const toggleTag = (tag) => {
    setNewEvidence((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const [pendingScan, setPendingScan] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
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
      
      // Extract full text for searchability (async, non-blocking)
      // Small delay to ensure record is fully committed before function access
      setTimeout(() => {
        base44.functions.invoke('extractTextFromEvidence', { evidenceId: created.id })
          .then((result) => {
            if (result.data?.success && result.data?.text) {
              base44.entities.Evidence.update(created.id, { 
                extracted_text: result.data.text,
                text_extracted_date: new Date().toISOString()
              });
            }
          })
          .catch(err => {
            // Ignore 404s - record might not be ready yet
            if (err.status !== 404) {
              console.error('Text extraction failed:', err);
            }
          });
      }, 500);
      
      await base44.entities.Evidence.update(created.id, { 
        extracted_data: extracted, 
        scan_status: "complete" 
      });
      await autoApplyExtracted(extracted, created.id);
      setScanResult({ evidenceId: created.id, data: extracted });
      
      // Backup to Google Drive in category-organized folder
      try {
        await base44.functions.invoke('backupEvidenceToDrive', { evidenceId: created.id });
      } catch (error) {
        console.error('Drive backup failed:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ["evidence", caseId] });
      setScanning(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evidence", caseId] }),
  });

  const uploadAndProcess = async (files) => {
    if (!canUpload) {
      toast({
        title: "File Limit Reached",
        description: `Your ${subscription?.plan_name || 'Starter'} plan allows ${fileLimit} files per case. Upgrade to Pro for 100 files or Command for 1000 files.`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    setUploading(true);
    
    for (const file of files) {
      let fileUrl = null;
      let fileName = file.name;
      let fileType = newEvidence.file_type;
      
      // Check if file is an image that should be converted to PDF
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const isImage = imageExtensions.includes(fileExtension);
      
      if (isImage) {
        try {
          setConverting(true);
          // Upload original image first
          const { file_url: originalUrl } = await base44.integrations.Core.UploadFile({ file });
          
          // Convert to searchable PDF
          const result = await base44.functions.invoke('convertImageToSearchablePDF', {
            fileUrl: originalUrl,
            fileName: file.name
          });
          
          if (result.data?.success && result.data?.converted && result.data?.pdfUrl) {
            fileUrl = result.data.pdfUrl;
            fileName = result.data.pdfFileName;
            fileType = 'other'; // PDF type
            
            toast({
              title: "Image Converted to PDF",
              description: `${file.name} was automatically converted to a searchable PDF`,
              duration: 4000,
            });
          } else {
            // Fallback to original image if conversion fails
            fileUrl = originalUrl;
          }
          setConverting(false);
        } catch (error) {
          console.error('PDF conversion failed:', error);
          setConverting(false);
          // Fallback to original upload
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          fileUrl = file_url;
        }
      } else {
        // Non-image file, upload normally
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrl = file_url;
      }
      
      createMutation.mutate({
        case_id: caseId,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        description: newEvidence.description,
        event_date: newEvidence.event_date || undefined,
        tags: newEvidence.tags.length > 0 ? newEvidence.tags : undefined,
        scan_status: "pending",
      });
    }
    
    setUploading(false);
    setShowUpload(false);
    setNewEvidence({ file_type: "other", description: "", event_date: "", tags: [] });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await uploadAndProcess(files);
  };

  const handleScanCapture = async (file) => {
    await uploadAndProcess([file]);
  };

  const autoApplyExtracted = async (extracted, evidenceId) => {
    const caseUpdates = {};
    if (extracted.merchant_name && !caseItem?.organisation_name)
      caseUpdates.organisation_name = extracted.merchant_name;

    // Auto-classify industry from merchant name or document text
    if (!caseItem?.category || caseItem.category === 'other') {
      const debugResult = detectIndustryDebug({
        organisation_name: extracted.merchant_name || '',
        respondent: extracted.merchant_name || '',
        issue: extracted.issue_summary || '',
        description: extracted.document_summary || '',
        issue_details: extracted.extracted_text?.slice(0, 500) || '',
      });
      console.log('[EvidenceVault] OCR industry detection:', debugResult);
      if (debugResult.category && debugResult.category !== 'other' && debugResult.category !== caseItem?.category) {
        caseUpdates.category = debugResult.category;
      }
    }

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
    if (extracted.issue_summary && !caseItem?.issue_summary)
      caseUpdates.issue_summary = extracted.issue_summary;
    if (extracted.desired_outcome && !caseItem?.desired_outcome)
      caseUpdates.desired_outcome = extracted.desired_outcome;
    if (!caseItem?.incident_date && extracted.timeline_events?.length) {
      const dates = extracted.timeline_events.map((e) => e.date).filter(Boolean).sort();
      if (dates[0]) caseUpdates.incident_date = dates[0];
    }
    if (Object.keys(caseUpdates).length > 0) {
      await base44.entities.Case.update(caseId, caseUpdates);
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    }

    if (extracted.timeline_events?.length > 0) {
      for (const ev of extracted.timeline_events) {
        if (!ev.description) continue;
        await base44.entities.TimelineEvent.create({
          case_id: caseId,
          title: ev.description.slice(0, 80),
          description: ev.description,
          event_date: ev.date || undefined,
          event_type: ev.event_type || "incident",
          is_action_required: ev.event_type === "action_required",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
    }

    if (extracted.checklist_items?.length > 0) {
      for (const item of extracted.checklist_items) {
        if (!item.label) continue;
        await base44.entities.ChecklistItem.create({
          case_id: caseId,
          label: item.label,
          category: item.category || "complaint",
          status: "missing",
          requires_proof: true,
        });
      }
    }

    if (extracted.deadlines?.length > 0) {
      for (const dl of extracted.deadlines) {
        if (!dl.title) continue;
        await base44.entities.Deadline.create({
          case_id: caseId,
          title: dl.title,
          deadline_date: dl.deadline_date || undefined,
          deadline_type: dl.deadline_type || "other",
          notes: dl.notes || "",
          status: "pending",
          responsibility: "user",
        });
      }
    }

    setAppliedIds((prev) => new Set([...prev, evidenceId]));
  };

  const allTags = [...new Set(evidence.flatMap((ev) => ev.tags || []))];
  
  // Filter by tag and search query
  let filtered = filterTag ? evidence.filter((ev) => ev.tags?.includes(filterTag)) : evidence;
  
  // Full-text search across file names, descriptions, and extracted text
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((ev) => {
      const fileNameMatch = ev.file_name?.toLowerCase().includes(query);
      const descriptionMatch = ev.description?.toLowerCase().includes(query);
      const textMatch = ev.extracted_text?.toLowerCase().includes(query);
      const summaryMatch = ev.extracted_data?.document_summary?.toLowerCase().includes(query);
      return fileNameMatch || descriptionMatch || textMatch || summaryMatch;
    });
  }
  
  const sorted = [...filtered].sort((a, b) => {
    if (a.event_date && b.event_date) return new Date(a.event_date) - new Date(b.event_date);
    return new Date(a.created_date) - new Date(b.created_date);
  });

  const buildEvidenceBlob = async () => {
    if (!sorted || sorted.length === 0) throw new Error('No evidence files to export.');
    const body = sorted.map((ev, i) => {
      const cfg = typeConfig[ev.file_type] || typeConfig.other;
      const dateStr = ev.event_date ? format(new Date(ev.event_date), "d MMMM yyyy") : "—";
      const desc = ev.description || ev.extracted_data?.document_summary || "—";
      return `${i + 1}. ${ev.file_name || 'Unknown'}\nType: ${cfg.label} | Date: ${dateStr}\n${desc}`;
    }).join("\n\n");
    const blob = await generateChaosDocumentPDF({
      documentType: 'general',
      title: 'Evidence Index',
      body: `EVIDENCE VAULT (${sorted.length} files)\n\n${body}`,
      includeHeader: true,
      includeFooter: true,
    });
    if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
    return blob;
  };

  const handlePrintEvidence = async () => {
    pdfDiagStart({ tab: 'Evidence', action: 'Download PDF', caseId, hasCase: !!caseItem, hasData: sorted.length > 0 });
    if (!sorted.length) { pdfDiagMissingData({ tab: 'Evidence', action: 'Download PDF', dataName: 'evidence files' }); return; }
    try {
      const blob = await buildEvidenceBlob();
      pdfDiagBlobCreated({ tab: 'Evidence', action: 'Download PDF', blob });
      downloadPDFBlob(blob, `Evidence_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      pdfDiagSuccess({ tab: 'Evidence', action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Evidence', action: 'Download PDF', error });
    }
  };

  const handlePrintEvidencePrint = async () => {
    pdfDiagStart({ tab: 'Evidence', action: 'Print PDF', caseId, hasCase: !!caseItem, hasData: sorted.length > 0 });
    if (!sorted.length) { pdfDiagMissingData({ tab: 'Evidence', action: 'Print PDF', dataName: 'evidence files' }); return; }
    try {
      const blob = await buildEvidenceBlob();
      pdfDiagBlobCreated({ tab: 'Evidence', action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, `Evidence_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      if (!opened) { toast.warning('Print blocked — downloading instead.'); downloadPDFBlob(blob, `Evidence_${format(new Date(), 'yyyy-MM-dd')}.pdf`); }
      pdfDiagSuccess({ tab: 'Evidence', action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Evidence', action: 'Print PDF', error });
    }
  };

  return (
    <div className="space-y-4">
      <DocumentScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onCapture={handleScanCapture}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground">Evidence Vault</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handlePrintEvidence}>
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handlePrintEvidencePrint}>
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowScanner(true)} disabled={!canUpload}>
              <Camera className="w-3.5 h-3.5" /> Scan Doc
            </Button>

            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs" disabled={!canUpload}>
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
                    <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            newEvidence.tags.includes(tag)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
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

        {/* File limit indicator */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-primary font-bold">Files: {currentFileCount} / {fileLimit}</span>
            <span className="text-muted-foreground">{subscription?.plan_name || 'Starter'} Plan</span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-1.5 mt-2">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min((currentFileCount / fileLimit) * 100, 100)}%` }} />
          </div>
          {!canUpload && (
            <p className="text-destructive text-xs font-bold mt-1">⚠️ File limit reached. Upgrade to upload more.</p>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search across all documents (file names, content, summaries)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Filter by tag:</span>
            <button
              onClick={() => setFilterTag(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterTag === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filterTag === tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {(scanning || converting) && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-sm text-primary">
            {converting ? (
              <>
                <FileDigit className="w-4 h-4 animate-pulse shrink-0" />
                <span className="font-medium">Converting image to searchable PDF...</span>
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4 animate-pulse shrink-0" />
                <span className="font-medium">AI is analysing your document...</span>
              </>
            )}
          </div>
          <p className="text-xs text-primary/70 pl-6">
            {converting 
              ? 'Creating professional PDF · Embedding image · Optimising for quality'
              : 'Extracting details · Building timeline · Generating checklist · Setting deadlines — all automatic'}
          </p>
        </div>
      )}

      {scanResult && !scanning && (
        <DocumentScanResult
          extracted={scanResult.data}
          confirmed={true}
          onConfirm={null}
        />
      )}

      {filtered.length === 0 && !scanning ? (
        <div className="bg-secondary/30 rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">
            {searchQuery 
              ? `No matches for "${searchQuery}"`
              : filterTag 
                ? `No documents tagged "${filterTag}"`
                : "DROP THE EVIDENCE"
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {searchQuery
              ? "Try a different search term or clear the search filter."
              : filterTag
                ? "Try selecting a different tag or upload new evidence."
                : "Leases, bank statements, emails, letters, photos."
            }
          </p>
          {!filterTag && !searchQuery && (
            <p className="text-xs text-muted-foreground mt-0.5">
              AI scans every document and builds your timeline automatically.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Search Results Banner */}
          {searchQuery && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Search className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Found <strong>{filtered.length}</strong> document{filtered.length !== 1 ? 's' : ''} matching "<strong>{searchQuery}</strong>"
                  {filtered.length > 0 && ` — searching file names, descriptions, and full document content`}
                </span>
              </div>
            </div>
          )}

          {/* Category Info Banner */}
          {!searchQuery && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-primary">
                <HardDrive className="w-3.5 h-3.5" />
                <span className="font-medium">Files are automatically organized in Google Drive by category: <strong>{caseItem?.category || 'other'}</strong></span>
              </div>
            </div>
          )}
          
          {filtered.map((ev) => {
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
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                      {ev.extracted_text && (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" /> Searchable
                        </span>
                      )}
                      {ev.drive_backup_url && (
                        <a href={ev.drive_backup_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                          <HardDrive className="w-2.5 h-2.5" /> Backup
                        </a>
                      )}
                    </div>
                    {ev.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ev.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewFile({ url: ev.file_url, name: ev.file_name, type: ev.file_type })}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`Delete "${ev.file_name}"? This cannot be undone.`)) {
                          deleteMutation.mutate(ev.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
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

      {/* Document Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Preview — {previewFile?.name}
            </DialogTitle>
            <DialogDescription>
              Review the document layout and formatting before printing
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden bg-secondary/30 rounded-lg border border-border">
            {previewFile?.url && (
              <iframe
                src={previewFile.url}
                className="w-full h-full rounded-lg"
                title="Document Preview"
                style={{ minHeight: '600px' }}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              Close
            </Button>
            <a href={previewFile?.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}