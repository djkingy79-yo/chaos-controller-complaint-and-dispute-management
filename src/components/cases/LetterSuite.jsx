import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, RefreshCw, Pencil, Check, Loader2, Download, Printer, FileText, Lock, Mail, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LetterTemplateManager from "./LetterTemplateManager";
import LetterEmailDialog from "./LetterEmailDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateChaosDocumentPDF, downloadPDFBlob, openPDFForPrint, LETTERHEAD_URL, stripToLetterBody } from "@/lib/pdfGenerator";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription, hasPlanAccess } from "@/lib/subscription";
import { Link } from "react-router-dom";
import LetterHeader, { buildLetterHeaderData } from "@/components/cases/LetterHeader.jsx";

function buildClientContext(caseItem, evidenceList) {
  const merged = {
    name: caseItem.complainant_name || "",
    address: caseItem.complainant_address || "",
    email: caseItem.complainant_email || "",
    phone: caseItem.complainant_phone || "",
    accounts: caseItem.account_number ? [caseItem.account_number] : [],
    policies: [],
    amounts: [],
    dates: caseItem.incident_date ? [format(new Date(caseItem.incident_date), "d MMMM yyyy")] : [],
  };
  for (const ev of (evidenceList || [])) {
    const d = ev.extracted_data;
    if (!d) continue;
    if (!merged.name && d.complainant_name) merged.name = d.complainant_name;
    if (!merged.address && d.complainant_address) merged.address = d.complainant_address;
    if (!merged.email && d.complainant_email) merged.email = d.complainant_email;
    if (!merged.phone && d.complainant_phone) merged.phone = d.complainant_phone;
    if (d.account_numbers?.length) merged.accounts = [...merged.accounts, ...d.account_numbers];
    if (d.policy_numbers?.length) merged.policies = [...merged.policies, ...d.policy_numbers];
    if (d.key_amounts?.length) merged.amounts = [...merged.amounts, ...d.key_amounts];
    if (d.dates_mentioned?.length) merged.dates = [...merged.dates, ...d.dates_mentioned];
  }
  for (const k of ["accounts", "policies", "amounts", "dates"]) {
    merged[k] = [...new Set(merged[k])];
  }
  return merged;
}

// minPlan: "Starter" | "Pro" | "Command"
const LETTER_TYPES = [
  { key: "letter1", label: "1st Complaint", field: "first_complaint_letter", description: "Initial formal complaint to the organisation", minPlan: "Starter" },
  { key: "letter2", label: "2nd Complaint", field: "second_complaint_letter", description: "Follow-up when no response or unsatisfactory response", minPlan: "Pro" },
  { key: "letter3", label: "3rd Complaint", field: "third_complaint_letter", description: "Final demand before external escalation", minPlan: "Pro" },
  { key: "accept_offer", label: "Accept Offer", field: "accept_offer_letter", description: "Formally accept a settlement offer", minPlan: "Pro" },
  { key: "deny_offer", label: "Deny Offer", field: "deny_offer_letter", description: "Reject an unsatisfactory offer and state reasons", minPlan: "Pro" },
  { key: "escalation", label: "Escalation Letter", field: "escalation_letter", description: "Formal complaint to external body (AFCA, TIO, NCAT, etc.)", minPlan: "Command" },
];

function buildPrompt(type, caseItem, client, today, evidenceList) {
  // Build evidence summary for injection into prompts
  const evidenceSummary = (evidenceList || []).length > 0
    ? (evidenceList || []).map(ev => {
        const summary = ev.extracted_data?.document_summary || ev.description || '';
        const amounts = (ev.extracted_data?.key_amounts || []).join(', ');
        const dates = (ev.extracted_data?.dates_mentioned || []).join(', ');
        return `- ${ev.file_name}${summary ? ': ' + summary.slice(0, 400) : ''}${amounts ? ' | Amounts: ' + amounts : ''}${dates ? ' | Dates: ' + dates : ''}`;
      }).join('\n')
    : 'No documents uploaded.';

  const letterHistory = [
    caseItem.complaint_letter ? '- First Complaint Letter: Generated and on file' : null,
    caseItem.complaint_letter_2 ? '- Second Complaint Letter: Generated and on file' : null,
    caseItem.complaint_letter_3 ? '- Third Complaint Letter: Generated and on file' : null,
  ].filter(Boolean).join('\n') || 'No prior letters generated.';

  const base = `You are a professional consumer advocacy solicitor in Australia. Generate a detailed, substantive formal letter for a consumer dispute. This letter must be comprehensive and professional — NOT generic. Use the specific facts, evidence, and details provided below.

  CRITICAL RULES:
  1. NEVER use placeholder brackets like [Name] or [Address]. If a detail is not provided, omit that line entirely.
  2. Use STANDARD AUSTRALIAN BUSINESS LETTER FORMAT.
  3. ALWAYS use AUSTRALIAN ENGLISH spelling (organise, recognise, behaviour, colour, programme, centre, licence, defence, offence).
  4. Address lines must be TIGHT single-spaced with NO gaps.
  5. ABSOLUTELY NO HTML TAGS - no <div>, no <br>, no <p>, no <strong>, no angle brackets of any kind.
  6. PLAIN TEXT ONLY - just normal text with line breaks.
  7. Write at length — use ALL provided facts. Do not summarise or truncate.
  8. Include specific dates, amounts, account numbers, and document references from the evidence provided.
  9. Each letter must be substantive — minimum 3-4 solid paragraphs of specific content.

COMPLAINANT DETAILS:
- Name: ${client.name || "not provided — omit name line"}
- Address: ${client.address || "not provided — omit address block"}
- Email: ${client.email || "not provided"}
- Phone: ${client.phone || "not provided"}
- Account/Reference: ${client.accounts?.join(", ") || caseItem.account_number || "not provided"}
- Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : client.dates?.join(", ") || "not provided"}
${client.policies?.length ? `- Policy Numbers: ${client.policies.join(", ")}` : ""}
${client.amounts?.length ? `- Key Financial Amounts in Dispute: ${client.amounts.join(", ")}` : ""}

ORGANISATION DETAILS:
- Organisation: ${caseItem.organisation_name || "not provided"}
- Complaints Address: ${caseItem.organisation_complaints_address || "Complaints Department, " + (caseItem.organisation_name || "the organisation")}
- Complaints Email: ${caseItem.organisation_complaints_email || "not provided"}
- Complaint Handler: ${caseItem.complaint_handler_name || "The Complaints Manager"}

CASE DETAILS:
- Industry Category: ${caseItem.category}
- Issue Type Summary: ${caseItem.issue_summary}
- Full Complaint Details: ${caseItem.issue_details}
- Desired Outcome: ${caseItem.desired_outcome}
- Escalation Body: ${caseItem.escalation_body || "the relevant ombudsman"}
- Today's Date: ${today}

EVIDENCE ON FILE (${(evidenceList || []).length} documents):
${evidenceSummary}

PRIOR CORRESPONDENCE:
${letterHistory}`;

  const formats = `
  CRITICAL: PLAIN TEXT ONLY - ABSOLUTELY NO HTML TAGS:
  - NO <div>, NO </div>, NO <br>, NO <strong>, NO <p>
  - NO angle brackets of any kind
  - Just plain text with normal line breaks
  - The rendering system will apply formatting automatically
  
  FORMAT (plain text lines only):
  ${today}
  
  [Sender Name]
  [Sender Street Address]
  [Sender City Postcode]
  [Sender Email]
  [Sender Phone]
  
  [Recipient Name/Title]
  [Organisation Name]
  [Organisation Address]
  [Organisation Email]
  
  Re: [Subject]
  
  Dear [Name/Sir/Madam],
  
  [Body paragraphs - each separated by one blank line]
  
  Yours faithfully,
  
  [Sender Name]`;

  if (type === "letter1") {
    return `${base}

  LETTER TYPE: First Formal Complaint Letter
  - This is the INITIAL formal complaint to the organisation.
  - Write a DETAILED, SUBSTANTIVE letter — minimum 4 substantial paragraphs.
  - SECTION 1: Introduction — who you are, your account details, the relationship with the organisation.
  - SECTION 2: Background and chronology — detailed account of what happened, specific dates, amounts, interactions.
  - SECTION 3: Impact — how this has affected you financially, practically, and emotionally.
  - SECTION 4: Evidence — reference each document on file by name. State what it proves.
  - SECTION 5: Legal/regulatory obligations — reference the relevant Australian consumer laws, industry codes, and the organisation's own obligations.
  - SECTION 6: Demand — state the specific desired outcome. Give a firm 21-day response deadline.
  - SECTION 7: Escalation warning — state that if unresolved, you will escalate to ${caseItem.escalation_body || "the relevant ombudsman"}.
  ${formats}

  FORMAT EXAMPLE (plain text - NO HTML):
  21 June 2026

  Mick Gallagher
  14 The Road
  Penrith 2750
  Djkingy79@gmail.com
  0413572850

  The Complaints Manager
  NRMA Insurance
  GPO Box 438
  Sydney NSW 2001

  Re: Formal Complaint

  Dear Sir/Madam,

  [Body text]

  Yours faithfully,
  Mick Gallagher`;
  }

  if (type === "letter2") {
    return `${base}

  LETTER TYPE: Second Formal Complaint Letter (Follow-Up)
  - The organisation has either NOT responded within 21 days, or gave an unsatisfactory response.
  - Write a DETAILED, SUBSTANTIVE letter — minimum 4 substantial paragraphs.
  - SECTION 1: Reference your first complaint letter — the date it was sent, what was asked for, that the deadline has passed or the response was inadequate.
  - SECTION 2: Restate the full complaint with additional detail. Include all evidence. Be specific about each failure.
  - SECTION 3: Catalogue the organisation's failures — delayed response, inadequate investigation, breach of their own complaints policy, breach of industry codes.
  - SECTION 4: Updated impact — state how the ongoing failure to resolve has compounded the original harm.
  - SECTION 5: Reference each document on file as evidence. State what it proves about the organisation's conduct.
  - SECTION 6: Final 14-day ultimatum — specific resolution required. State you are preparing to escalate to ${caseItem.escalation_body || "the relevant ombudsman"} and have all documentation ready.
  ${formats}

  FORMAT EXAMPLE (plain text - NO HTML):
  21 June 2026

  Mick Gallagher
  14 The Road
  Penrith 2750
  Djkingy79@gmail.com
  0413572850

  The Complaints Manager
  NRMA Insurance
  GPO Box 438
  Sydney NSW 2001

  Re: Formal Complaint

  Dear Sir/Madam,

  [Body text]

  Yours faithfully,
  Mick Gallagher`;
  }

  if (type === "letter3") {
    return `${base}

  LETTER TYPE: Third and Final Complaint Letter (Final Demand)
  - This is the LAST internal letter before escalating to ${caseItem.escalation_body || "the external ombudsman/tribunal"}.
  - Write a DETAILED, SUBSTANTIVE letter — minimum 5 substantial paragraphs.
  - SECTION 1: State that this is the third and final letter. Reference the first and second complaints, their dates, and the organisation's failure to resolve.
  - SECTION 2: Comprehensive summary of the entire dispute — timeline, all key facts, all amounts, all interactions.
  - SECTION 3: Complete evidence index — list every document on file and what it proves. Make clear the evidence is overwhelming.
  - SECTION 4: Legal analysis — cite Australian Consumer Law, the relevant industry Code of Practice, and any specific regulations the organisation has breached.
  - SECTION 5: Harm suffered — full account of financial loss, practical impact, and distress caused by the organisation's conduct.
  - SECTION 6: Final 7-day ultimatum. If not resolved, you will immediately lodge with ${caseItem.escalation_body || "the relevant external body"}, pursue all available legal remedies, and consider media disclosure where permitted.
  - Very firm, authoritative, evidence-focused tone. The organisation should understand this is their final opportunity.
  ${formats}

  FORMAT EXAMPLE (plain text - NO HTML):
  21 June 2026

  Mick Gallagher
  14 The Road
  Penrith 2750
  Djkingy79@gmail.com
  0413572850

  The Complaints Manager
  NRMA Insurance
  GPO Box 438
  Sydney NSW 2001

  Re: Formal Complaint

  Dear Sir/Madam,

  [Body text]

  Yours faithfully,
  Mick Gallagher`;
  }

  if (type === "accept_offer") {
    return `${base}

  LETTER TYPE: Acceptance of Settlement Offer
  - The organisation has made a settlement offer in response to the complaint.
  - Write a DETAILED, SUBSTANTIVE letter.
  - SECTION 1: Reference the complaint history and the offer received. Be specific about what was offered and when.
  - SECTION 2: Formal acceptance — state you accept the offer. Specify the exact terms being accepted. Include any conditions of acceptance.
  - SECTION 3: Binding requirements — request written confirmation of the offer terms. Specify the method and timeline for payment/fulfilment.
  - SECTION 4: Conditions — state this acceptance is conditional on the offer being fulfilled by a specific date (14 days is standard). State any requirements before the matter is considered closed.
  - SECTION 5: Closure terms — upon full performance, this matter will be considered fully resolved and you will not pursue further action. If the offer is not fulfilled, you will escalate.
  - Professional, clear, binding language. This letter creates a contract.
  ${formats}

  FORMAT EXAMPLE (plain text - NO HTML):
  21 June 2026

  Mick Gallagher
  14 The Road
  Penrith 2750
  Djkingy79@gmail.com
  0413572850

  The Complaints Manager
  NRMA Insurance
  GPO Box 438
  Sydney NSW 2001

  Re: Formal Complaint

  Dear Sir/Madam,

  [Body text]

  Yours faithfully,
  Mick Gallagher`;
  }

  if (type === "deny_offer") {
    return `${base}

  LETTER TYPE: Rejection of Settlement Offer
  - The organisation has made an offer but it is UNSATISFACTORY.
  - Write a DETAILED, SUBSTANTIVE letter.
  - SECTION 1: Acknowledge receipt of the offer. Reference the complaint history and the offer details.
  - SECTION 2: Formal rejection — clearly state you reject the offer. List each specific reason why the offer is inadequate:
    - Does not fully compensate for the loss
    - Does not address all aspects of the complaint
    - Does not reflect the evidence on file
    - Does not meet the desired outcome: "${caseItem.desired_outcome}"
  - SECTION 3: Evidence — reference each document on file and how it supports the higher valuation of your claim.
  - SECTION 4: Counter-proposal — state specifically what resolution you require. Be precise about amounts, timelines, and conditions.
  - SECTION 5: Ultimatum — give the organisation 14 days to provide an improved and acceptable offer. State that if they fail to do so, you will immediately escalate to ${caseItem.escalation_body || "the relevant ombudsman"}.
  - Firm, reasoned, professional tone.
  ${formats}

  FORMAT EXAMPLE (plain text - NO HTML):
  21 June 2026

  Mick Gallagher
  14 The Road
  Penrith 2750
  Djkingy79@gmail.com
  0413572850

  The Complaints Manager
  NRMA Insurance
  GPO Box 438
  Sydney NSW 2001

  Re: Formal Complaint

  Dear Sir/Madam,

  [Body text]

  Yours faithfully,
  Mick Gallagher`;
  }

  if (type === "escalation") {
    return `${base}

  LETTER TYPE: External Escalation Complaint Letter
  - This letter is addressed TO ${caseItem.escalation_body || "the external ombudsman/tribunal"} — NOT the organisation.
  - Write a COMPREHENSIVE, DETAILED letter — minimum 6 substantial paragraphs. This is the most important letter.
  - SECTION 1: Introduction — who you are, who the dispute is with (${caseItem.organisation_name}), the nature of the complaint, and why you are contacting the external body.
  - SECTION 2: Why this body has jurisdiction — explain why ${caseItem.escalation_body || "this body"} is the correct escalation path for this type of dispute (industry category: ${caseItem.category}).
  - SECTION 3: Full chronological complaint history:
    - Date and details of the original incident
    - Date the First Complaint Letter was sent and the response (or lack thereof)
    - Date the Second Complaint Letter was sent (if applicable) and the response
    - Date the Third/Final Complaint Letter was sent (if applicable) and the response
    - Summary of all direct communications with the organisation
  - SECTION 4: Detailed account of the dispute — full facts, specific dates, amounts, account/policy numbers. Reference each piece of evidence on file.
  - SECTION 5: The organisation's failures — how they breached their obligations under Australian Consumer Law, their industry Code of Practice, their own complaints process, and their duty of care.
  - SECTION 6: Evidence index — list each document on file with a brief description of what it proves.
  - SECTION 7: Harm and loss — complete account of financial loss, practical impact, distress.
  - SECTION 8: Remedy requested — specific, clear request for what you need the external body to investigate and order: "${caseItem.desired_outcome}".
  - Professional, factual, comprehensive tone. Address to: The Complaints Officer, ${caseItem.escalation_body || "External Dispute Resolution Body"}.
  ${formats}

  FORMAT EXAMPLE (plain text - NO HTML):
  21 June 2026

  Mick Gallagher
  14 The Road
  Penrith 2750
  Djkingy79@gmail.com
  0413572850

  The Complaints Manager
  NRMA Insurance
  GPO Box 438
  Sydney NSW 2001

  Re: Formal Complaint

  Dear Sir/Madam,

  [Body text]

  Yours faithfully,
  Mick Gallagher`;
  }

  return base;
}

// Map letter key -> the timestamp field to stamp when the letter is sent/emailed
const SENT_TIMESTAMP_MAP = {
  letter1: "first_complaint_sent_at",
  letter2: "second_complaint_sent_at",
  letter3: "third_complaint_sent_at",
  escalation: "escalated_at",
};

// Map letter key -> progress_stage to set after send
const SENT_STAGE_MAP = {
  letter1: "awaiting_first_response",
  letter2: "awaiting_second_response",
  letter3: "awaiting_final_response",
  escalation: "escalated",
};

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timedOutRef = React.useRef(false);
  const abortControllerRef = React.useRef(null);

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

  // Stamp complaint sent timestamp and progress stage when a letter is emailed for the first time
  const handleLetterSent = async () => {
    const tsField = SENT_TIMESTAMP_MAP[letterType.key];
    const stageField = SENT_STAGE_MAP[letterType.key];
    if (!tsField || caseItem[tsField]) return; // only stamp once
    const updates = { [tsField]: new Date().toISOString() };
    if (stageField) updates.progress_stage = stageField;
    await base44.entities.Case.update(caseItem.id, updates);
    // Create timeline event for the send
    await base44.entities.TimelineEvent.create({
      case_id: caseItem.id,
      event_date: format(new Date(), "yyyy-MM-dd"),
      title: `${letterType.label} sent to ${caseItem.organisation_name || "organisation"}`,
      description: `${letterType.label} formally submitted via email.`,
      event_type: "complaint",
      is_action_required: false,
    });
    queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
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

  const buildLetterBlob = async () => {
    if (!text || !text.trim()) throw new Error(`No content for ${letterType.label}. Generate the letter first.`);
    const client = buildClientContext(caseItem, evidence);
    const headerData = buildLetterHeaderData(caseItem, client);
    const reLabels = {
      letter1: `FORMAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`,
      letter2: `SECOND FORMAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`,
      letter3: `THIRD AND FINAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`,
      accept_offer: `ACCEPTANCE OF SETTLEMENT OFFER — ${caseItem.organisation_name || "Organisation"}`,
      deny_offer: `REJECTION OF SETTLEMENT OFFER — ${caseItem.organisation_name || "Organisation"}`,
      escalation: `EXTERNAL DISPUTE SUBMISSION — ${caseItem.organisation_name || "Organisation"}`,
    };
    const reSubject = reLabels[letterType.key] || `FORMAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`;
    const strippedBody = stripToLetterBody(text);
    const blob = await generateChaosDocumentPDF({
      documentType: 'letter',
      title: letterType.label,
      body: strippedBody,
      includeHeader: true,
      includeFooter: true,
      letterHeader: { ...headerData, reSubject },
    });
    if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
    return blob;
  };

  const letterFilename = `${String(letterType.label).replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  const handleDownloadPDF = async () => {
    pdfDiagStart({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!text });
    if (!text || !text.trim()) { pdfDiagMissingData({ tab: `Letter: ${letterType.label}`, action: 'Download PDF', dataName: 'letter content (generate letter first)' }); return; }
    try {
      const blob = await buildLetterBlob();
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
    try {
      const blob = await buildLetterBlob();
      pdfDiagBlobCreated({ tab: `Letter: ${letterType.label}`, action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, letterFilename);
      if (!opened) { toast.warning('Print blocked — downloading instead.'); downloadPDFBlob(blob, letterFilename); }
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
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <LetterTemplateManager
            letterType={letterType.key}
            currentText={text}
            onApplyTemplate={handleApplyTemplate}
          />
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
        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-white">
          <div className="letterhead-banner" style={{ height: '60px', backgroundImage: `url(${LETTERHEAD_URL})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', margin: '0 auto 0 auto' }}></div>
          <div className="bg-white px-12 pb-8" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", color: "#000", marginTop: '0', paddingTop: '16pt' }}>
            {/* Structured letter header — date, two-column address, RE line, rule */}
            {!editing && (() => {
              const client = buildClientContext(caseItem, evidence);
              const reLabels = {
                letter1: `FORMAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`,
                letter2: `SECOND FORMAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`,
                letter3: `THIRD AND FINAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`,
                accept_offer: `ACCEPTANCE OF SETTLEMENT OFFER — ${caseItem.organisation_name || "Organisation"}`,
                deny_offer: `REJECTION OF SETTLEMENT OFFER — ${caseItem.organisation_name || "Organisation"}`,
                escalation: `EXTERNAL DISPUTE SUBMISSION — ${caseItem.organisation_name || "Organisation"}`,
              };
              return (
                <LetterHeader
                  caseItem={caseItem}
                  client={client}
                  reSubject={reLabels[letterType.key] || `FORMAL COMPLAINT — ${caseItem.organisation_name || "Organisation"}`}
                />
              );
            })()}
            {editing ? (
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={18}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5" }}
              />
            ) : (
              <pre style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.15", margin: 0, whiteSpace: 'pre-wrap', color: "#000" }}>
                {text.replace(/<[^>]*>/g, '').replace(/^[\s\S]*?(?=Dear\s)/i, '')}
              </pre>
            )}
          </div>
          <div
            className="w-full"
            style={{
              height: '60px',
              backgroundImage: `url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              backgroundColor: '#ffffff'
            }}
          ></div>
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
        evidence={evidence}
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
          Use the Escalation Letter to lodge with {caseItem.escalation_body || "AFCA / TIO / NCAT"}.
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