import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, RefreshCw, Pencil, Check, Loader2, Printer, FileText, Lock } from "lucide-react";
import LetterTemplateManager from "./LetterTemplateManager";
import { toast } from "sonner";
import { format } from "date-fns";
import { LETTERHEAD_URL, CONTINUATION_PAGE_URL, getLetterPageStyles } from "./LetterheadBanner";
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
2. Use STANDARD BUSINESS LETTER FORMAT with DATE FIRST.
3. ALWAYS use AUSTRALIAN ENGLISH spelling (organise, recognise, behaviour, colour, programme, centre, licence, defence, offence).

FORMATTING REQUIREMENTS:
- FIRST LINE: Today's date: ${today} - NO asterisks or bold markers, plain text only
- TOP RIGHT (below date): Sender's (complainant's) full name, address lines, email, phone
- LEFT SIDE (below date, opposite sender): Merchant's complaint handler name, organisation name, complaints address, complaints email
- Then: Re: line, salutation, body, closing

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
  PROFESSIONAL BUSINESS LETTER FORMAT - CRITICAL:
  1. LINE 1: ${today} (DATE FIRST, PLAIN TEXT - NO ASTERISKS)
  2. NEXT: Sender details RIGHT side (Name, Address, Email, Phone) - each on separate line
  3. OPPOSITE LEFT: Recipient details (Complaint Handler, Organisation, Address, Email) - each on separate line
  4. BLANK LINE
  5. Re: line with account/reference
  6. Salutation: "Dear ${caseItem.complaint_handler_name || "Sir/Madam"},"
  7. Body paragraphs - professional AUSTRALIAN ENGLISH spelling (organise, recognise, behaviour, colour, programme, centre, licence, defence, offence)
  8. Close: "Yours faithfully," then blank line, then complainant name
  9. NEVER use [brackets] for placeholders - if data missing, omit that line entirely
  10. Keep formatting CLEAN and PROFESSIONAL - this is a legal document`;

  if (type === "letter1") {
    return `${base}

LETTER TYPE: First Formal Complaint Letter
- This is the INITIAL formal complaint to the organisation
- Include a clear 21-day response deadline
- Mention ${caseItem.escalation_body || "the relevant ombudsman"} as next step if unresolved
- Reference the incident date and account number
- State the desired outcome clearly
${formats}`;
  }

  if (type === "letter2") {
    return `${base}

LETTER TYPE: Second Formal Complaint Letter (Follow-Up)
- The organisation has either NOT responded within 21 days, or gave an unsatisfactory response
- Reference that a previous complaint letter was sent and the deadline has passed (or response was inadequate)
- Escalate the tone — firm, assertive, professional
- Provide a FINAL 14-day deadline before escalation to ${caseItem.escalation_body || "the relevant ombudsman"}
- Mention you have documented evidence ready for external submission
${formats}`;
  }

  if (type === "letter3") {
    return `${base}

LETTER TYPE: Third and Final Complaint Letter (Final Notice)
- This is the LAST internal letter before escalating to ${caseItem.escalation_body || "the external ombudsman/tribunal"}
- Reference that TWO prior letters have been sent with no satisfactory resolution
- Give a FINAL 7-day ultimatum
- State clearly you will be lodging a formal complaint with ${caseItem.escalation_body || "the relevant external body"} and/or seeking legal advice
- Very firm, professional, evidence-focused tone
${formats}`;
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
${formats}`;
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
${formats}`;
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
${formats}`;
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
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const client = buildClientContext(caseItem, evidence);
      const today = format(new Date(), "d MMMM yyyy");
      const prompt = buildPrompt(letterType.key, caseItem, client, today);
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setText(result);
      updateMutation.mutate({ [field]: result });
      toast.success(`${letterType.label} generated`);
    } catch (e) {
      toast.error("Generation failed: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const lines = text.split('\n');
    const firstPageLines = lines.slice(0, 45);
    const remainingLines = lines.slice(45);
    const continuationPages = [];
    for (let i = 0; i < remainingLines.length; i += 55) {
      continuationPages.push(remainingLines.slice(i, i + 55).join('\n'));
    }
    const continuationHTML = continuationPages.map((chunk) => `
      <div class="letter-continuation">
        <div class="continuation-header"></div>
        <div class="continuation-content">${chunk.split('\n').map(line => `<p style="margin:10pt 0;min-height:18pt;line-height:1.6;font-size:11pt">${line || '&nbsp;'}</p>`).join('')}</div>
      </div>
    `).join('');
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${letterType.label}</title>
    <style>
      @page { margin: 0; size: A4; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.6; }
      .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
      .letterhead-header { width: 100%; height: 180px; background-image: url('${LETTERHEAD_URL}'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
      .letterhead-footer { display: none !important; }
      .letter-content { padding: 0 25mm 20mm 25mm; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.5; }
      .letter-content p { margin: 0 0 6pt 0; min-height: 14pt; line-height: 1.5; }
      .letter-continuation { position: relative; width: 100%; min-height: 297mm; page-break-before: always; background: white; }
      .continuation-header { width: 100%; height: 40px; background-image: url('${LETTERHEAD_URL}'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
      .continuation-content { padding: 0 25mm 20mm 25mm; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.5; }
      .continuation-content p { margin: 0 0 6pt 0; min-height: 14pt; line-height: 1.5; }
    </style>
    </head><body>
      <div class="letter-page">
        <div class="letterhead-header"></div>
        <div class="letter-content">${firstPageLines.map(line => `<p style="margin:0 0 6pt 0;min-height:14pt;line-height:1.5;font-size:11pt">${line || '&nbsp;'}</p>`).join('')}</div>
      </div>
      ${continuationHTML}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
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
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print
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
          {/* Smaller professional letterhead banner — page 1 only */}
          <div className="letterhead-banner" style={{ height: '180px', backgroundImage: `url(${LETTERHEAD_URL})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center top', margin: '0 auto 0 auto' }}></div>
          <div className="bg-white px-12 pb-8" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5", color: "#000", marginTop: '0', paddingTop: '0' }}>
            {editing ? (
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={18}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5" }}
              />
            ) : (
              <div className="text-slate-900 w-full" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.5", margin: 0, color: "#000" }}>
                {text.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '0 0 6pt 0', minHeight: '14pt' }}>{line || '\u00A0'}</p>
                ))}
              </div>
            )}
          </div>
          <div 
            className="w-full"
            style={{ 
              height: '60px', 
              backgroundImage: `url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg')`, 
              backgroundSize: 'contain', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'center bottom',
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