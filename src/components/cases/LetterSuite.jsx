import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, RefreshCw, Pencil, Check, Loader2, Download, Printer, FileText, Lock } from "lucide-react";
import LetterTemplateManager from "./LetterTemplateManager";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateChaosDocumentPDF, downloadPDFBlob, openPDFForPrint, LETTERHEAD_URL, FOOTER_URL } from "@/lib/pdfGenerator";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription, hasPlanAccess } from "@/lib/subscription";
import { Link } from "react-router-dom";

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
  { key: "letter1", label: "1st Complaint", field: "complaint_letter", description: "Initial formal complaint to the organisation", minPlan: "Starter" },
  { key: "letter2", label: "2nd Complaint", field: "complaint_letter_2", description: "Follow-up when no response or unsatisfactory response", minPlan: "Pro" },
  { key: "letter3", label: "3rd Complaint", field: "complaint_letter_3", description: "Final demand before external escalation", minPlan: "Pro" },
  { key: "accept_offer", label: "Accept Offer", field: "letter_accept_offer", description: "Formally accept a settlement offer", minPlan: "Pro" },
  { key: "deny_offer", label: "Deny Offer", field: "letter_deny_offer", description: "Reject an unsatisfactory offer and state reasons", minPlan: "Pro" },
  { key: "escalation", label: "Escalation Letter", field: "letter_escalation", description: "Formal complaint to external body (AFCA, TIO, NCAT, etc.)", minPlan: "Command" },
];

function buildPrompt(type, caseItem, client, today) {
  const base = `You are a professional consumer advocacy assistant in Australia. Generate a formal letter for a consumer dispute.

  CRITICAL RULES:
  1. NEVER use placeholder brackets like [Name] or [Address]. If a detail is not provided, omit that line entirely.
  2. Use STANDARD AUSTRALIAN BUSINESS LETTER FORMAT.
  3. ALWAYS use AUSTRALIAN ENGLISH spelling (organise, recognise, behaviour, colour, programme, centre, licence, defence, offence).
  4. Address lines must be TIGHT single-spaced with NO gaps.
  5. ABSOLUTELY NO HTML TAGS - no <div>, no <br>, no <p>, no <strong>, no angle brackets of any kind.
  6. PLAIN TEXT ONLY - just normal text with line breaks.

COMPLAINANT DETAILS:
- Name: ${client.name || "not provided — omit name line"}
- Address: ${client.address || "not provided — omit address block"}
- Email: ${client.email || "not provided"}
- Phone: ${client.phone || "not provided"}
- Account/Reference: ${client.accounts?.join(", ") || caseItem.account_number || "not provided"}
- Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : client.dates?.join(", ") || "not provided"}
${client.policies?.length ? `- Policy Numbers: ${client.policies.join(", ")}` : ""}
${client.amounts?.length ? `- Key Amounts: ${client.amounts.join(", ")}` : ""}

ORGANISATION DETAILS:
- Organisation: ${caseItem.organisation_name || "not provided"}
- Complaints Address: ${caseItem.organisation_complaints_address || "Complaints Department, " + (caseItem.organisation_name || "the organisation")}
- Complaints Email: ${caseItem.organisation_complaints_email || "not provided"}
- Complaint Handler: ${caseItem.complaint_handler_name || "The Complaints Manager"}

CASE DETAILS:
- Category: ${caseItem.category}
- Issue Summary: ${caseItem.issue_summary}
- Full Details: ${caseItem.issue_details}
- Desired Outcome: ${caseItem.desired_outcome}
- Escalation Body: ${caseItem.escalation_body || "the relevant ombudsman"}
- Today's Date: ${today}`;

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
  - This is the INITIAL formal complaint to the organisation
  - Include a clear 21-day response deadline
  - Mention ${caseItem.escalation_body || "the relevant ombudsman"} as next step if unresolved
  - Reference the incident date and account number
  - State the desired outcome clearly
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
  - The organisation has either NOT responded within 21 days, or gave an unsatisfactory response
  - Reference that a previous complaint letter was sent and the deadline has passed (or response was inadequate)
  - Escalate the tone — firm, assertive, professional
  - Provide a FINAL 14-day deadline before escalation to ${caseItem.escalation_body || "the relevant ombudsman"}
  - Mention you have documented evidence ready for external submission
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

  LETTER TYPE: Third and Final Complaint Letter (Final Notice)
  - This is the LAST internal letter before escalating to ${caseItem.escalation_body || "the external ombudsman/tribunal"}
  - Reference that TWO prior letters have been sent with no satisfactory resolution
  - Give a FINAL 7-day ultimatum
  - State clearly you will be lodging a formal complaint with ${caseItem.escalation_body || "the relevant external body"} and/or seeking legal advice
  - Very firm, professional, evidence-focused tone
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
  - The organisation has made a settlement offer in response to the complaint
  - Formally accept the offer and state the terms being accepted
  - Request written confirmation and a timeline for fulfilment
  - State that if the offer is not fulfilled by the agreed date, the matter will be escalated
  - Professional, clear, binding language
  - Use Australian English spelling throughout
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
  - The organisation has made an offer but it is UNSATISFACTORY
  - Formally REJECT the offer with clear reasons why it does not address the dispute
  - Counter with the desired outcome stated in the case: "${caseItem.desired_outcome}"
  - Give a 14-day deadline to reconsider or provide an improved offer
  - State that failure to respond acceptably will result in escalation to ${caseItem.escalation_body || "the relevant ombudsman"}
  - Firm, reasoned, professional tone
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
  - This letter is addressed TO ${caseItem.escalation_body || "the external ombudsman/tribunal"}, NOT the organisation
  - Summarise the entire dispute: what happened, when, what was sought, what the organisation did or didn't do
  - Attach a chronology of complaint letters sent (mention 1st, 2nd, 3rd letters and dates if known)
  - State the desired outcome clearly
  - Reference all key evidence: account numbers, dates, amounts
  - Request the external body investigate and order appropriate remedy
  - Address to: The Complaints Officer, ${caseItem.escalation_body || "External Dispute Resolution Body"}
  - Professional, comprehensive, factual tone
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

function LetterEditor({ letterType, caseItem, evidence }) {
  const queryClient = useQueryClient();
  const field = letterType.field;
  const [text, setText] = useState(caseItem[field] || "");
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleApplyTemplate = (content) => {
    setText(content);
    updateMutation.mutate({ [field]: content });
    setEditing(false);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      setEditing(false);
      toast.success("Letter saved successfully");
    },
    onError: (error) => {
      console.error("Failed to save letter:", error);
      toast.error("Failed to save letter. Please try again.");
      // Revert local state to match database
      setText(caseItem[field] || "");
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const client = buildClientContext(caseItem, evidence);
      const today = format(new Date(), "d MMMM yyyy");
      const prompt = buildPrompt(letterType.key, caseItem, client, today);
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      // Only update local state after successful save
      updateMutation.mutate({ [field]: result }, {
        onSuccess: () => {
          setText(result);
          toast.success(`${letterType.label} generated and saved`);
          setGenerating(false);
        },
        onError: () => {
          toast.error("Letter generated but failed to save. Please try again.");
          setGenerating(false);
        }
      });
    } catch (e) {
      toast.error("Generation failed: " + e.message);
      setGenerating(false);
    }
  };

  const buildLetterBlob = async () => {
    if (!text || !text.trim()) throw new Error(`No content for ${letterType.label}. Generate the letter first.`);
    const cleanContent = String(text).replace(/<[^>]*>/g, '').trim();
    const blob = await generateChaosDocumentPDF({
      documentType: 'general',
      title: letterType.label,
      body: cleanContent,
      includeHeader: true,
      includeFooter: true,
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
        <div>
          <h3 className="font-heading font-semibold text-foreground" style={{ fontSize: "12pt" }}>{letterType.label}</h3>
          <p className="text-xs text-muted-foreground" style={{ fontSize: "10pt" }}>{letterType.description}</p>
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
                onClick={() => { if (editing) updateMutation.mutate({ [field]: text }); setEditing(!editing); }}
                className="gap-1.5 text-xs"
              >
                {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                {editing ? "Save" : "Edit"}
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5 text-xs">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {text ? "Regenerate" : "Generate Letter"}
          </Button>
        </div>
      </div>

      {hasPlaceholders && !generating && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-xs text-destructive font-medium">
          ⚠️ Placeholder text detected. Click Regenerate to fill with your real case details.
        </div>
      )}

      {text ? (
        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-white">
          {/* Thinner, longer header banner */}
          <div className="letterhead-banner" style={{ height: '60px', backgroundImage: `url(${LETTERHEAD_URL})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', margin: '0 auto 0 auto' }}></div>
          <div className="bg-white px-12 pb-8" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", color: "#000", marginTop: '0', paddingTop: '8pt' }}>
            {editing ? (
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={18}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5" }}
              />
            ) : (
              <pre style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.2", margin: 0, whiteSpace: 'pre-wrap', color: "#000" }}>
                {text.replace(/<[^>]*>/g, '')}
              </pre>
            )}
          </div>
          {/* Extended footer banner */}
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
          <p className="text-sm text-muted-foreground mb-3">No {letterType.label} generated yet.</p>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? "Generating..." : `Generate ${letterType.label}`}
          </Button>
        </div>
      )}
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
            return (
              <TabsTrigger key={lt.key} value={lt.key} className="text-xs gap-1">
                {locked && <Lock className="w-3 h-3 opacity-60" />}
                {lt.label}
                {!locked && caseItem[lt.field] && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
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