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

  const prompt = `CRITICAL PROFESSIONAL LETTER FORMAT - AUSTRALIAN BUSINESS STANDARD:

  OUTPUT FORMAT (EXACT ORDER):
  Line 1: ${today} (plain text only, no bold, no asterisks)
  Line 2: [blank]
  Lines 3-7: SENDER ADDRESS LEFT-ALIGNED (name, street, city, email, phone - NO gaps between lines)
  Line 8: [blank]
  Lines 9-12: RECIPIENT ADDRESS LEFT-ALIGNED under sender (handler, org, address, email - NO gaps)
  Line 13: [blank]
  Line 14: Re: line
  Line 15: Dear Sir/Madam,
  Lines 16+: Body paragraphs (compact spacing)
  Final: Yours faithfully, [blank line] Sender name

  CRITICAL RULES:
  1. SENDER ADDRESS ON LEFT SIDE
  2. RECIPIENT ADDRESS ON LEFT SIDE (directly under sender)
  3. NO BLANK LINES WITHIN ADDRESS BLOCKS - TIGHT SINGLE SPACING
  4. NO PLACEHOLDER BRACKETS - omit lines if data missing
  5. COMPACT PARAGRAPH SPACING - professional density

  COMPLAINANT (SENDER - RIGHT SIDE):
  Name: ${client.name || "omit"}
  Address: ${client.address || "omit"}
  Email: ${client.email || "omit"}
  Phone: ${client.phone || "omit"}
  Account: ${formattedAccounts || "omit"}

  ORGANISATION (RECIPIENT - LEFT SIDE):
  Handler: ${caseItem.complaint_handler_name || "The Complaints Manager"}
  Org: ${caseItem.organisation_name || "omit"}
  Address: ${caseItem.organisation_complaints_address || "omit"}
  Email: ${caseItem.organisation_complaints_email || "omit"}

  CASE: ${caseItem.issue_summary}. Desired: ${caseItem.desired_outcome}. Escalate to: ${caseItem.escalation_body || "ombudsman"}.

  Generate the complete letter NOW with sender address RIGHT-ALIGNED.`;

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
            <div style={{ padding: '0 25mm 0 25mm', fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.15", color: "#000" }}>
              <p style={{ fontSize: '10pt', margin: '0 0 4pt 0', textAlign: 'left' }}>{format(new Date(), "d MMMM yyyy")}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6pt' }}>
                <div style={{ textAlign: 'right', minWidth: '45%' }}>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>Mick Gallagher</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>14 The Road</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>Penrith 2750</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>Djkingy79@gmail.com</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>0413572850</p>
                </div>
                <div style={{ textAlign: 'left', minWidth: '45%' }}>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>The Complaints Manager</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>NRMA Insurance</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>GPO Box 438</p>
                  <p style={{ margin: '0', lineHeight: '1.1', fontSize: '9pt' }}>Sydney NSW 2001</p>
                </div>
              </div>
              <p style={{ margin: '4pt 0 3pt 0', fontWeight: 'bold', fontSize: '10pt' }}>Re: Formal Complaint — Account NRMA09887</p>
              <p style={{ margin: '3pt 0', fontSize: '10pt' }}>Dear Sir/Madam,</p>
              <p style={{ margin: '3pt 0', fontSize: '10pt' }}>I am writing to formally lodge a complaint regarding...</p>
              <p style={{ margin: '3pt 0', fontSize: '10pt', color: '#666', fontStyle: 'italic' }}>Letter body continues...</p>
              <p style={{ margin: '0 0 3pt 0', fontSize: '10pt' }}>Yours faithfully,</p>
              <p style={{ margin: '0', fontSize: '10pt' }}>Mick Gallagher</p>
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
          {/* Thinner, longer header banner */}
          <div 
            className="w-full"
            style={{ 
              height: '60px', 
              backgroundImage: `url(${LETTERHEAD_URL})`, 
              backgroundSize: 'contain', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'center top',
              backgroundColor: '#ffffff',
              marginBottom: '0'
            }}
          ></div>
          <div className="bg-white" style={{ padding: '8pt 25mm 20mm 25mm', marginTop: '0', fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.2", color: "#000" }}>
            {editing ? (
              <Textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={22}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.2" }}
              />
            ) : (
              <div className="text-slate-900 w-full" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.2", margin: 0, color: "#000" }}>
                {letter.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '0 0 8pt 0', minHeight: '10pt', lineHeight: '1.2' }}>{line || '\u00A0'}</p>
                ))}
              </div>
            )}
          </div>
          {/* Extended footer banner */}
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