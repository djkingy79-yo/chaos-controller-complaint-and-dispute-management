import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LETTERHEAD_URL, CONTINUATION_PAGE_URL, getLetterPageStyles } from "./LetterheadBanner";

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
    if (merged[k]) merged[k] = [...new Set(merged[k])];
  }
  return merged;
}

export default function ComplaintLetter({ caseItem }) {
  const [editing, setEditing] = useState(false);
  const [letter, setLetter] = useState(caseItem.complaint_letter || "");
  const [regenerating, setRegenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", caseItem.id],
    queryFn: () => base44.entities.Evidence.filter({ case_id: caseItem.id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      setEditing(false);
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    toast.success("Letter copied to clipboard");
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const client = buildClientContext(caseItem, evidence);
    const today = format(new Date(), "d MMMM yyyy");

    // Format account numbers professionally — break into multiple lines if too long
  const accountNumbers = client.accounts?.length ? client.accounts.join(", ") : caseItem.account_number || "";
  const formattedAccounts = accountNumbers && accountNumbers.length > 60 
    ? accountNumbers.split(", ").reduce((lines, acc, i) => {
        const currentLine = lines[lines.length - 1];
        if (!currentLine || (currentLine + ", " + acc).length > 60) {
          lines.push(acc);
        } else {
          lines[lines.length - 1] = currentLine + ", " + acc;
        }
        return lines;
      }, []).join("\n    ")
    : accountNumbers;

  const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute.

  CRITICAL RULES:
  1. NEVER use placeholder brackets like [Name] or [Address]. If a detail is not provided, omit that line entirely.
  2. Use STANDARD AUSTRALIAN BUSINESS LETTER FORMAT.
  3. The DATE must be the VERY FIRST line at the TOP of the page.
  4. Address lines must be TIGHT single-spaced with NO gaps between lines.
  5. Paragraph spacing must be TIGHT - no large gaps.

  FORMATTING REQUIREMENTS:
  1. FIRST LINE: TODAY'S DATE - ${today} - PLAIN TEXT ONLY, no asterisks, no bold, no **, just "21 June 2026"
  2. BLANK LINE after date
  3. SENDER ADDRESS (RIGHT SIDE) - TIGHT SPACING, NO GAPS: Full name on line 1, street address line 2, city/state/postcode line 3, email line 4, phone line 5 - ALL RIGHT ALIGNED
  4. BLANK LINE
  5. RECIPIENT ADDRESS (LEFT SIDE) - TIGHT SPACING, NO GAPS: Complaint handler name, organisation name, complaints address, complaints email - each on separate line, NO gaps
  6. BLANK LINE
  7. Then: Re: line, salutation, body paragraphs (tight spacing), closing
  
  CRITICAL: SENDER ADDRESS MUST BE ON THE RIGHT SIDE. RECIPIENT ADDRESS ON LEFT SIDE.

  COMPLAINANT DETAILS:
- Name: ${client.name || "not provided — omit name line"}
- Address: ${client.address || "not provided — omit address block"}
- Email: ${client.email || "not provided"}
- Phone/Mobile: ${client.phone || "not provided"}
- Account/Reference Number: ${formattedAccounts || "not provided"}
- Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : client.dates?.join(", ") || "not provided"}
${client.policies?.length ? `- Policy/Reference Numbers: ${client.policies.join(", ")}` : ""}
${client.amounts?.length ? `- Key Amounts: ${client.amounts.join(", ")}` : ""}

ORGANISATION DETAILS:
- Organisation: ${caseItem.organisation_name || "not provided"}
- Complaints Address: ${caseItem.organisation_complaints_address || ("Complaints Department, " + (caseItem.organisation_name || "the organisation"))}
- Complaints Email: ${caseItem.organisation_complaints_email || "not provided"}
- Complaint Handler: ${caseItem.complaint_handler_name || "The Complaints Manager"}

CASE DETAILS:
- Category: ${caseItem.category}
- Issue Summary: ${caseItem.issue_summary}
- Full Details: ${caseItem.issue_details}
- Desired Outcome: ${caseItem.desired_outcome}
- Escalation Body: ${caseItem.escalation_body || "the relevant ombudsman"}

5. Re: line — e.g. "Re: Formal Complaint — ${caseItem.account_number ? "Account " + caseItem.account_number : caseItem.title}"
6. Salutation: "Dear ${caseItem.complaint_handler_name || "Sir/Madam"},"
7. Opening paragraph references account number and incident date if available.
8. Firm but professional tone. Include a 21-day response deadline.
9. Mention ${caseItem.escalation_body || "the relevant ombudsman"} as the next escalation step if unresolved.
10. Close with "Yours faithfully," then the complainant's full name (if provided).
11. NEVER write bracket placeholders — use real data or omit the line entirely.
12. If account numbers are very long, format them on separate lines for readability.
13. NO BLANK LINES within sender or recipient address blocks - keep them tight.
14. Body paragraphs should have minimal spacing - compact and professional.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setLetter(result);
    updateMutation.mutate({ complaint_letter: result });
    setRegenerating(false);
  };

  const handlePrint = () => {
    const lines = letter.split('\n');
    const firstPageLines = lines.slice(0, 45);
    const remainingLines = lines.slice(45);
    const continuationPages = [];
    for (let i = 0; i < remainingLines.length; i += 55) {
      continuationPages.push(remainingLines.slice(i, i + 55).join('\n'));
    }
    const continuationHTML = continuationPages.map((chunk) => `
      <div class="letter-continuation">
        <div class="continuation-header"></div>
        <div class="continuation-content">${chunk.split('\n').map(line => `<p style="margin:0 0 3pt 0;min-height:11pt;line-height:1.2;font-size:10pt">${line || '&nbsp;'}</p>`).join('')}</div>
      </div>
    `).join('');
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>Complaint Letter</title>
    <style>${getLetterPageStyles()}</style>
    </head><body>
      <div class="letter-page">
        <div class="letterhead-header"></div>
        <div class="letter-content" style="padding:0 25mm 20mm 25mm">${firstPageLines.map(line => `<p style="margin:0 0 3pt 0;min-height:11pt;line-height:1.2;font-size:10pt">${line || '&nbsp;'}</p>`).join('')}</div>
        <div class="letterhead-footer"></div>
      </div>
      ${continuationHTML}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const hasPlaceholders = /\[Your Name\]|\[Your Address\]|\[NRMA Address\]|\[.*?\]/.test(letter);

  if (!caseItem.complaint_letter && !letter) {
    return (
      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">No complaint letter generated yet.</p>
          <Button onClick={handleRegenerate} disabled={regenerating} className="gap-2">
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate First Complaint Letter
          </Button>
        </div>
        
        {/* Sample format preview */}
        <div className="flex justify-center">
          <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header Banner - 180px */}
            <div 
              className="w-full"
              style={{ 
                height: '180px', 
                backgroundImage: `url(${LETTERHEAD_URL})`, 
                backgroundSize: 'cover', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center top',
                backgroundColor: '#ffffff'
              }}
            ></div>
            <div style={{ padding: '0 25mm 0 25mm', fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.3", color: "#000" }}>
              <p style={{ fontSize: '11pt', margin: '0 0 6pt 0', textAlign: 'left' }}>{format(new Date(), "d MMMM yyyy")}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10pt' }}>
                <div style={{ textAlign: 'right', minWidth: '45%' }}>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>Mick Gallagher</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>14 The Road</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>Penrith 2750</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>Djkingy79@gmail.com</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>0413572850</p>
                </div>
                <div style={{ textAlign: 'left', minWidth: '45%' }}>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>The Complaints Manager</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>NRMA Insurance</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>GPO Box 438</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '10pt' }}>Sydney NSW 2001</p>
                </div>
              </div>
              <p style={{ margin: '6pt 0 4pt 0', fontWeight: 'bold', fontSize: '11pt' }}>Re: Formal Complaint — Account NRMA09887</p>
              <p style={{ margin: '4pt 0', fontSize: '11pt' }}>Dear Sir/Madam,</p>
              <p style={{ margin: '4pt 0', fontSize: '11pt' }}>I am writing to formally lodge a complaint regarding...</p>
              <p style={{ margin: '4pt 0', fontSize: '11pt', color: '#666', fontStyle: 'italic' }}>Letter body continues...</p>
              <p style={{ margin: '0 0 4pt 0', fontSize: '11pt' }}>Yours faithfully,</p>
              <p style={{ margin: '0', fontSize: '11pt' }}>Mick Gallagher</p>
            </div>
            <div className="letterhead-footer" style={{ height: '60px', backgroundImage: `url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg')`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom' }}></div>
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Format shown:</strong> Date (13pt bold, left) · Sender address (right) · Recipient address (left) · Re line · Body · Closing
          </p>
        </div>
      </div>
    );
  }

  const client = buildClientContext(caseItem, evidence);
  const today = format(new Date(), "d MMMM yyyy");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Complaint Letter</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-1.5 text-xs">
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { if (editing) updateMutation.mutate({ complaint_letter: letter }); setEditing(!editing); }}
            className="gap-1.5 text-xs"
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Placeholder warning */}
      {hasPlaceholders && !regenerating && (
        <div className="flex items-center justify-between gap-3 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
          <p className="text-xs text-destructive font-medium">⚠️ This letter still has placeholder text. Hit Regenerate to replace them with your real case details.</p>
          <Button size="sm" onClick={handleRegenerate} className="gap-1.5 text-xs shrink-0">
            <RefreshCw className="w-3 h-3" /> Regenerate Now
          </Button>
        </div>
      )}

      {/* A4 Letter Preview */}
      <div className="flex justify-center">
        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
          {/* Header Banner - 180px */}
          <div 
            className="w-full"
            style={{ 
              height: '180px', 
              backgroundImage: `url(${LETTERHEAD_URL})`, 
              backgroundSize: 'cover', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'center top',
              backgroundColor: '#ffffff',
              marginBottom: '0'
            }}
          ></div>
          <div className="bg-white" style={{ padding: '0 25mm 20mm 25mm', marginTop: '0', fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.3", color: "#000" }}>
            {editing ? (
              <Textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={22}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.3" }}
              />
            ) : (
              <div className="text-slate-900 w-full" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.3", margin: 0, color: "#000" }}>
                {letter.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '0 0 3pt 0', minHeight: '12pt' }}>{line || '\u00A0'}</p>
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
      </div>
    </div>
  );
}