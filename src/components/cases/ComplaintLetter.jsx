import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { printLetter as printLetterUniversal } from "@/lib/documentFormatEngine";
import { LETTERHEAD_URL, FOOTER_URL } from "@/lib/printUtilities";

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

  const prompt = `AUSTRALIAN BUSINESS LETTER FORMAT - PLAIN TEXT ONLY (ABSOLUTELY NO HTML TAGS):

${today}

${client.name || ""}
${client.address || ""}
${client.email || ""}
${client.phone || ""}

${caseItem.complaint_handler_name || "The Complaints Manager"}
${caseItem.organisation_name || ""}
${caseItem.organisation_complaints_address || ""}
${caseItem.organisation_complaints_email || ""}

Re: Formal Complaint - ${caseItem.account_number || client.accounts?.[0] || "Account Dispute"}

Dear Sir/Madam,

[Write professional complaint letter body here - Australian English spelling]

Yours faithfully,
${client.name || ""}

CRITICAL RULES:
- ABSOLUTELY NO HTML TAGS - no <div>, no </div>, no <br>, no <p>, no <strong>
- NO angle brackets of any kind
- Plain text lines only with normal line breaks
- Sender address will be RIGHT aligned automatically
- Recipient address will be LEFT aligned automatically
- Use actual data, NO [brackets] except for body content
- Case: ${caseItem.issue_summary}. Desired: ${caseItem.desired_outcome}.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setLetter(result);
    updateMutation.mutate({ complaint_letter: result });
    setRegenerating(false);
  };

  const handlePrint = () => {
    printLetterUniversal({ title: 'Complaint Letter', letterContent: letter });
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
                height: '60px', 
                backgroundImage: `url(${LETTERHEAD_URL})`, 
                backgroundSize: '100% 100%', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center center',
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
            <div className="letterhead-footer" style={{ height: '60px', backgroundImage: `url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg')`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center' }}></div>
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
              backgroundSize: '100% 100%', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'center center',
              backgroundColor: '#ffffff',
              marginBottom: '0'
            }}
          ></div>
          <div className="bg-white" style={{ padding: '8pt 25mm 20mm 25mm', marginTop: '0', fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", color: "#000", width: '100%', boxSizing: 'border-box' }}>
            {editing ? (
              <Textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={22}
                className="font-body bg-white text-slate-900 w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.2", width: '100%', boxSizing: 'border-box' }}
              />
            ) : (
              <pre style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.2", margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: "#000", width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                {letter.replace(/<[^>]*>/g, '')}
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
      </div>
    </div>
  );
}