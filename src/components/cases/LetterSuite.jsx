import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, RefreshCw, Pencil, Check, Loader2, Download, Printer, FileText, Lock, Mail, CheckCircle2, XCircle, Trash2, CalendarClock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LetterTemplateManager from "./LetterTemplateManager";
import LetterEmailDialog from "./LetterEmailDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { captureLetterDocumentPDF, downloadPDFBlob, openPDFForPrint, PRINT_BLOCKED_MESSAGE } from "@/lib/pdfGenerator";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription, hasPlanAccess } from "@/lib/subscription";
import { Link } from "react-router-dom";
import LetterHeader, { buildLetterHeaderData } from "@/components/cases/LetterHeader.jsx";
import LetterDocument, { LetterPreviewWrapper } from "@/components/letters/LetterDocument.jsx";
import MarkSentDialog from "@/components/cases/MarkSentDialog.jsx";
import { markLetterSent } from "@/lib/letterTracking";
import { LETTER_SENT_FIELD_MAP, getLetterReSubject } from "@/lib/disputeStageLogic";
import { buildClientContext, buildPrompt } from "@/lib/letterPromptBuilder";
import { getComplaintPathway, getEscalationBodyLabel } from "@/lib/authorityRouting";

// minPlan: "Starter" | "Pro" | "Command"
const LETTER_TYPES = [
  { key: "letter1", label: "1st Complaint", field: "first_complaint_letter", description: "Initial formal complaint to the organisation", minPlan: "Starter" },
  { key: "letter2", label: "2nd Complaint", field: "second_complaint_letter", description: "Follow-up when no response or unsatisfactory response", minPlan: "Pro" },
  { key: "letter3", label: "3rd Complaint", field: "third_complaint_letter", description: "Final demand before external escalation", minPlan: "Pro" },
  { key: "accept_offer", label: "Accept Offer", field: "accept_offer_letter", description: "Formally accept a settlement offer", minPlan: "Pro" },
  { key: "deny_offer", label: "Deny Offer", field: "deny_offer_letter", description: "Reject an unsatisfactory offer and state reasons", minPlan: "Pro" },
  { key: "escalation", label: "Escalation Letter", field: "escalation_letter", description: "Formal complaint to the assigned external escalation body", minPlan: "Command" },
];

const GENERATE_PHASES = [
  "Preparing case facts…",
  "Reviewing evidence…",
  "Drafting letter…",
  "Saving letter…",
  "Almost done…",
];

const HARD_TIMEOUT_MS = 130000; // 130 seconds — backend AI responses are regularly taking 87–107s in production

function LetterEditor({ letterType, caseItem, evidence }) {
  const queryClient = useQueryClient();
  const field = letterType.field;
  const [text, setText] = useState(caseItem[field] || "");
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState(GENERATE_PHASES[0]);
  const [generateError, setGenerateError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [emailOpen, setEmailOpen] = useState(false);
  const [markSentOpen, setMarkSentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timedOutRef = React.useRef(false);
  const abortControllerRef = React.useRef(null);
  const letterDocRef = React.useRef(null);

  // Elapsed timer — ticks every second while generating
  useEffect(() => {
    if (!generating) { setElapsedSeconds(0); return; }
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [generating]);

  // Sync text from caseItem when the field or caseItem updates (fixes all-tabs-same-letter bug)
  // Also clears the timeout sentinel if the backend saved the letter while we were waiting
  useEffect(() => {
    const newText = caseItem[field] || "";
    setText(newText);
    if (newText && generateError === "__timeout__") {
      setGenerateError(null);
      toast.success(`${letterType.label} generated`);
    }
  }, [caseItem.id, field, caseItem[field]]);

  // Load last send log for this letter for status badge
  const { data: emailLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['emailLogs', caseItem?.id, letterType?.key],
    queryFn: () => base44.entities.EmailLog.filter({ case_id: caseItem?.id, letter_type: letterType?.key }),
    enabled: !!caseItem?.id,
  });
  const lastLog = emailLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  // Stamp complaint sent timestamp and progress stage when a letter is emailed
  const handleLetterSent = async () => {
    await markLetterSent(caseItem, letterType.key, {
      sentDate: new Date().toISOString(),
      method: "email",
      recipientEmail: caseItem.organisation_complaints_email || "",
      manuallyMarkedSent: false,
    });
    queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
    queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.id] });
  };

  const handleApplyTemplate = async (content) => {
    setText(content);
    try {
      await updateMutation.mutateAsync({ [field]: content });
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
    } catch {
      toast.error("Failed to save template. Please try again.");
    }
    setEditing(false);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Null out only this letter's field — all other case data untouched
      await base44.entities.Case.update(caseItem.id, { [field]: null });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      toast.success(`${letterType.label} deleted`);
    } catch (e) {
      toast.error("Failed to delete letter: " + e.message);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleGenerate = async () => {
    if (generating) return; // Block duplicate clicks
    console.log(`[LetterGen] START — letter: ${letterType.key}, case: ${caseItem.id}`);

    // Reset timeout ref — must happen before any awaits
    timedOutRef.current = false;

    // Abort any previous in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setGenerating(true);
    setGenerateError(null);

    // Phase ticker — cycles through all 5 phases across 60s window (~12s each)
    let phaseIndex = 0;
    setGenerateStatus(GENERATE_PHASES[0]);
    const phaseTicker = setInterval(() => {
      phaseIndex = Math.min(phaseIndex + 1, GENERATE_PHASES.length - 1);
      setGenerateStatus(GENERATE_PHASES[phaseIndex]);
    }, 24000); // 24s per phase × 5 phases = 120s coverage window

    // Hard timeout — backend saves to DB directly, so on timeout we just refresh the case
    // rather than showing an error (the letter may already be saved by the backend)
    const hardTimeout = setTimeout(async () => {
      timedOutRef.current = true;
      clearInterval(phaseTicker);
      setGenerating(false);
      setGenerateStatus("");
      console.warn(`[LetterGen] TIMEOUT — exceeded ${HARD_TIMEOUT_MS / 1000}s, letter: ${letterType.key} — refreshing case in case backend saved`);
      // Refresh the case — if the backend completed and saved, the letter will appear
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      // Show a soft notice rather than an error — not a failure, just slow
      setGenerateError("__timeout__");
    }, HARD_TIMEOUT_MS);

    try {
      const client = buildClientContext(caseItem, evidence);
      const today = format(new Date(), "d MMMM yyyy");
      const prompt = buildPrompt(letterType.key, caseItem, client, today, evidence);

      console.log(`[LetterGen] Payload — caseId: ${caseItem.id}, letter: ${letterType.key}, promptBytes: ${new Blob([prompt]).size}, evidenceCount: ${(evidence||[]).length}`);
      console.log(`[LetterGen] Backend request sent — ${letterType.key} @ ${new Date().toISOString()}`);

      const aiStart = Date.now();
      const response = await base44.functions.invoke('generateLetter', { prompt, caseId: caseItem.id, letterType: letterType.key });
      const aiMs = Date.now() - aiStart;

      // Discard if timeout already fired — backend saved it, the query refresh will pick it up
      if (timedOutRef.current) {
        console.warn(`[LetterGen] Late response arrived after timeout (${aiMs}ms) — backend saved, query refresh will render it`);
        queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
        return;
      }

      // Backend reported another request is already generating — stay in loading state
      if (response.data?.existing) {
        console.log(`[LetterGen] Already generating on backend — waiting`);
        setGenerateStatus("Already generating on server — please wait…");
        // Keep spinner running; the case query refresh on timeout will surface the result
        return;
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      const result = response.data?.result;
      console.log(`[LetterGen] Response — length: ${result?.length ?? 0}, aiMs: ${response.data?.aiMs ?? '?'}, totalMs: ${aiMs}`);

      if (!result || !result.trim()) {
        throw new Error("AI returned empty content. Please try again.");
      }

      // Backend already saved to DB — update local state and invalidate
      setText(result);
      // Regenerated content is fresh against the current pathway — clear any stale flag for this letter
      if (caseItem.stale_letters?.includes(letterType.key)) {
        await base44.entities.Case.update(caseItem.id, {
          stale_letters: caseItem.stale_letters.filter((k) => k !== letterType.key),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      setGenerateError(null);
      toast.success(`${letterType.label} generated`);
      console.log(`[LetterGen] DONE — ${letterType.key}`);
    } catch (e) {
      // Swallow AbortError and any error that fires after timeout
      if (timedOutRef.current || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;

      const httpStatus = e.response?.status;
      const serverMsg = e.response?.data?.error || e.response?.data?.message;
      console.error(`[LetterGen] ERROR —`, { message: e.message, httpStatus, serverMsg });

      // Show friendly message — never expose provider/server error details to users
      const isTransient = httpStatus === 502 || httpStatus === 503 || httpStatus === 504 ||
        e.message?.includes('502') || e.message?.includes('503') || e.message?.includes('timeout') ||
        e.message?.includes('network') || e.message?.includes('ECONNRESET');
      const displayError = (serverMsg && !serverMsg.match(/502|503|504|upstream|provider|network/i))
        ? serverMsg
        : isTransient
          ? 'AI service was temporarily unavailable. Your case is safe. Please retry.'
          : 'Letter generation failed. Your case is safe. Please retry.';
      setGenerateError(displayError);
    } finally {
      // Only clean up spinner if timeout hasn't already done it
      if (!timedOutRef.current) {
        clearInterval(phaseTicker);
        clearTimeout(hardTimeout);
        setGenerating(false);
        setGenerateStatus("");
      }
    }
  };

  const letterFilename = `${String(letterType.label).replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  const handleDownloadPDF = async () => {
    pdfDiagStart({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!text });
    if (!text || !text.trim()) { pdfDiagMissingData({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', dataName: 'letter content (generate letter first)' }); return; }
    if (!letterDocRef.current) { pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', error: new Error('Letter preview not mounted') }); return; }
    try {
      const blob = await captureLetterDocumentPDF(letterDocRef.current, { caseId: caseItem?.id });
      pdfDiagBlobCreated({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', blob });
      downloadPDFBlob(blob, letterFilename);
      pdfDiagSuccess({ tab: `Letter: ${letterType.label}`, action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', error });
    }
  };

  const handlePrintPDF = async () => {
    pdfDiagStart({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!text });
    if (!text || !text.trim()) { pdfDiagMissingData({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', dataName: 'letter content (generate letter first)' }); return; }
    if (!letterDocRef.current) { pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', error: new Error('Letter preview not mounted') }); return; }
    try {
      const blob = await captureLetterDocumentPDF(letterDocRef.current, { caseId: caseItem?.id });
      pdfDiagBlobCreated({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, letterFilename);
      if (!opened) { toast.error(PRINT_BLOCKED_MESSAGE); downloadPDFBlob(blob, letterFilename); }
      pdfDiagSuccess({ tab: `Letter: ${letterType.label}`, action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', error });
    }
  };

  const hasPlaceholders = /\[Your Name\]|\[Your Address\]|\[.*?\]/.test(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <h3 className="font-heading font-semibold text-foreground" style={{ fontSize: "12pt" }}>{letterType.label}</h3>
            <p className="text-xs text-muted-foreground" style={{ fontSize: "10pt" }}>{letterType.description}</p>
          </div>
          {/* Send status badge */}
          {lastLog && (
            lastLog.status === 'sent' ? (
              <Badge className="bg-green-500/15 text-green-700 border-green-500/30 gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3" />
                Sent {lastLog.sent_at ? format(new Date(lastLog.sent_at), "d MMM") : ''}
              </Badge>
            ) : lastLog.status === 'failed' ? (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1 text-[10px]">
                <XCircle className="w-3 h-3" />
                Failed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Pending</Badge>
            )
          )}
          {!lastLog && text && (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">Not Sent</Badge>
          )}
          {caseItem[LETTER_SENT_FIELD_MAP[letterType.key]] && caseItem.letter_tracking?.[letterType.key]?.manuallyMarkedSent && (
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px] gap-1">
              <CalendarClock className="w-3 h-3" />
              Marked sent {format(new Date(caseItem[LETTER_SENT_FIELD_MAP[letterType.key]]), "d MMM yyyy")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <LetterTemplateManager
            letterType={letterType.key}
            currentText={text}
            onApplyTemplate={handleApplyTemplate}
          />
          <Button
            variant="outline" size="sm"
            onClick={() => setMarkSentOpen(true)}
            className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            {caseItem[LETTER_SENT_FIELD_MAP[letterType.key]] ? "Change Sent Date" : "Mark as Sent"}
          </Button>
          {text && (
            <>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }} className="gap-1.5 text-xs">
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintPDF} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setEmailOpen(true)}
                className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
              >
                <Mail className="w-3.5 h-3.5" /> Send Email
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={async () => {
                  if (editing) {
                    try {
                      await updateMutation.mutateAsync({ [field]: text });
                      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
                      toast.success("Letter saved");
                    } catch {
                      toast.error("Failed to save. Please try again.");
                      return;
                    }
                  }
                  setEditing(!editing);
                }}
                className="gap-1.5 text-xs"
              >
                {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                {editing ? "Save" : "Edit"}
              </Button>
            </>
          )}
          {text && (
            <Button
              variant="outline" size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting || generating}
              className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </Button>
          )}
          <Button
            size="sm"
            onClick={text ? () => setRegenConfirmOpen(true) : handleGenerate}
            disabled={generating || deleting}
            className="gap-1.5 text-xs min-w-[140px]"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {generating ? "Generating…" : (text ? "Regenerate" : "Generate Letter")}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-xs text-primary font-medium flex items-center gap-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="flex-1">{generateStatus}</span>
          <span className="font-mono text-primary/70 tabular-nums">
            {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {generateError === "__timeout__" && !generating && !text && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-xs text-warning-foreground flex items-center justify-between gap-3">
          <span>⏳ Still generating — the server is processing your letter. This page will update automatically when complete, or click Retry to try again.</span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 shrink-0" onClick={handleGenerate}>
            Retry
          </Button>
        </div>
      )}
      {generateError && generateError !== "__timeout__" && !generating && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-xs text-destructive flex items-center justify-between gap-3">
          <span>⚠️ {generateError}</span>
          <Button size="sm" variant="destructive" className="h-7 text-xs px-3 shrink-0" onClick={handleGenerate}>
            Retry
          </Button>
        </div>
      )}

      {hasPlaceholders && !generating && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-xs text-destructive font-medium">
          ⚠️ Placeholder text detected. Click Regenerate to fill with your real case details.
        </div>
      )}

      {caseItem.stale_letters?.includes(letterType.key) && !generating && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-xs text-warning-foreground font-medium flex items-center justify-between gap-3">
          <span>⚠️ This letter may reference an outdated escalation authority. Click Regenerate to update it to {caseItem.escalation_body || "the current assigned authority"}.</span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3 shrink-0" onClick={() => setRegenConfirmOpen(true)}>
            Regenerate
          </Button>
        </div>
      )}

      {/* Last failed send detail */}
      {lastLog?.status === 'failed' && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5 text-xs text-destructive flex items-center justify-between gap-2">
          <span><strong>Send failed:</strong> {lastLog.error_message || 'Unknown error'}</span>
          <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={() => setEmailOpen(true)}>
            Retry
          </Button>
        </div>
      )}

      {text ? (
        <div className="overflow-hidden rounded-lg shadow-sm border border-border">
          {editing ? (
            <div className="bg-white p-4">
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={18}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5" }}
              />
            </div>
          ) : (() => {
            const client = buildClientContext(caseItem, evidence);
            const { receiverLines, senderLines, today } = buildLetterHeaderData(caseItem, client);
            return (
              <LetterPreviewWrapper>
                <div ref={letterDocRef}>
                  <LetterDocument
                    receiverLines={receiverLines}
                    senderLines={senderLines}
                    today={today}
                    reSubject={getLetterReSubject(letterType.key, caseItem.organisation_name)}
                    bodyText={text}
                  />
                </div>
              </LetterPreviewWrapper>
            );
          })()}
        </div>
      ) : (
        <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-10 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No {letterType.label} generated yet.</p>
          <p className="text-xs text-muted-foreground mb-4">Upload evidence and complete your timeline before generating.</p>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? "Generating..." : `Generate ${letterType.label}`}
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. You can generate a new one afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Delete Letter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate confirmation */}
      <AlertDialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate this letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current version with a newly generated one. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setRegenConfirmOpen(false); handleGenerate(); }}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email send dialog */}
      <LetterEmailDialog
        open={emailOpen}
        onClose={() => { setEmailOpen(false); refetchLogs(); }}
        onSent={handleLetterSent}
        caseItem={caseItem}
        letterType={letterType}
        letterText={text}
        letterDocRef={letterDocRef}
        evidence={evidence}
      />

      {/* Mark as sent / retrospective sent date dialog */}
      <MarkSentDialog
        open={markSentOpen}
        onClose={() => setMarkSentOpen(false)}
        caseItem={caseItem}
        letterType={letterType}
      />
    </div>
  );
}

export default function LetterSuite({ caseItem }) {
  const { user } = useAuth();

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", caseItem.id],
    queryFn: () => base44.entities.Evidence.filter({ case_id: caseItem.id }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const subscription = getActiveSubscription(user, payments);

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Letter Suite</span> — Generate each letter as your dispute progresses.
          Start with the 1st Complaint. Move to 2nd/3rd if unresolved. Use Accept/Deny Offer letters when a settlement is proposed.
          Use the Escalation Letter to lodge with {caseItem.escalation_body || getEscalationBodyLabel(getComplaintPathway({ category: caseItem.category, state: caseItem.state, context: { text: `${caseItem.issue_summary || ""} ${caseItem.issue_details || ""}`, hasCivilClaimPathway: !!caseItem.has_civil_claim_pathway } }))}.
        </p>
      </div>

      <Tabs defaultValue="letter1">
        <TabsList className="flex-wrap h-auto gap-1">
          {LETTER_TYPES.map(lt => {
            const locked = !hasPlanAccess(subscription, lt.minPlan);
            const hasContent = !!caseItem[lt.field];
            // Sent = EmailLog with status 'sent' exists — checked via caseItem context not available here,
            // so we derive: no content = grey dot, has content = green dot (sent is shown inside the editor)
            return (
              <TabsTrigger key={lt.key} value={lt.key} className="text-xs gap-1">
                {locked && <Lock className="w-3 h-3 opacity-60" />}
                {lt.label}
                {!locked && (
                  hasContent
                    ? <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" title="Generated" />
                    : <span className="ml-1 w-1.5 h-1.5 rounded-full bg-gray-400/50 inline-block" title="Not generated" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {LETTER_TYPES.map(lt => {
          const locked = !hasPlanAccess(subscription, lt.minPlan);
          return (
            <TabsContent key={lt.key} value={lt.key} className="mt-4">
              {locked ? (
                <div className="bg-secondary/30 border border-dashed border-border rounded-xl p-10 text-center">
                  <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">{lt.label} — {lt.minPlan} Plan Required</p>
                  <p className="text-sm text-muted-foreground mb-4">{lt.description}</p>
                  <Link to="/payments">
                    <Button size="sm" className="gap-2">Upgrade to {lt.minPlan}</Button>
                  </Link>
                </div>
              ) : (
                <LetterEditor letterType={lt} caseItem={caseItem} evidence={evidence} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}