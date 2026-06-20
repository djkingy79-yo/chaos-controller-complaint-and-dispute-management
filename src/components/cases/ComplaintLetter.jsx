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
  2. Use STANDARD BUSINESS LETTER FORMAT with DATE FIRST.

  FORMATTING REQUIREMENTS:
  1. FIRST line: TODAY'S DATE in bold - **${today}**
  2. RIGHT SIDE (below date): Sender's full name, address lines, email, phone (each on separate lines, right-aligned in your mind)
  3. LEFT SIDE (below date, opposite sender): Complaint handler name, organisation name, complaints address, complaints email
  4. Then: Re: line, salutation, body, closing

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
12. If account numbers are very long, format them on separate lines for readability.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setLetter(result);
    updateMutation.mutate({ complaint_letter: result });
    setRegenerating(false);
  };

  const handlePrint = () => {
    const lines = letter.split('\n');
    // First page holds ~40 lines (below full letterhead), continuation pages ~50 lines each
    const firstPageLines = lines.slice(0, 40);
    const remainingLines = lines.slice(40);
    const continuationPages = [];
    for (let i = 0; i < remainingLines.length; i += 50) {
      continuationPages.push(remainingLines.slice(i, i + 50).join('\n'));
    }
    const continuationHTML = continuationPages.map(chunk => `
      <div class="letter-continuation"><pre>${chunk}</pre></div>
    `).join('');
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>Complaint Letter</title>
    <style>${getLetterPageStyles()}</style>
    </head><body>
      <div class="letter-page">
        <div class="letter-content"><pre>${firstPageLines.join('\n')}</pre></div>
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
      <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No complaint letter generated yet.</p>
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

      {/* Letterhead Preview */}
      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-white">
        <div style={{ position: "relative" }}>
          <img src={LETTERHEAD_URL} alt="Chaos Controller Full Letterhead" style={{ width: "100%", display: "block" }} />
        </div>
        <div className="px-8 pb-8 bg-white" style={{ marginTop: 0, paddingTop: "16px" }}>
          {editing ? (
            <Textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={22}
              className="font-body text-sm leading-relaxed bg-white text-slate-900"
              style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt" }}
            />
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-900" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.7", paddingTop: "12px" }}>
              {letter}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}