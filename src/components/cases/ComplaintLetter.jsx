import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LetterheadHeader, buildLetterheadHTML, buildFooterHTML, CONTACT } from "./LetterheadBanner";

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

    const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute.

CRITICAL RULE: Never use placeholder brackets like [Name] or [Address]. If a detail is not provided, omit that line entirely or write naturally around it.

COMPLAINANT DETAILS:
- Name: ${client.name || "not provided — omit name line"}
- Address: ${client.address || "not provided — omit address block"}
- Email: ${client.email || "not provided"}
- Phone/Mobile: ${client.phone || "not provided"}
- Account/Reference Number: ${client.accounts?.join(", ") || caseItem.account_number || "not provided"}
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

LETTER FORMAT INSTRUCTIONS:
1. Top right block: complainant's address (if provided), then today's date (${today}).
2. Left block: complaint handler name/title, organisation name, organisation complaints address.
3. Re: line — e.g. "Re: Formal Complaint — ${caseItem.account_number ? "Account " + caseItem.account_number : caseItem.title}"
4. Salutation: "Dear ${caseItem.complaint_handler_name || "Sir/Madam"},"
5. Opening paragraph references account number and incident date if available.
6. Firm but professional tone. Include a 21-day response deadline.
7. Mention ${caseItem.escalation_body || "the relevant ombudsman"} as the next escalation step if unresolved.
8. Close with "Yours faithfully," then the complainant's full name (if provided).
9. NEVER write bracket placeholders — use real data or omit the line entirely.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setLetter(result);
    updateMutation.mutate({ complaint_letter: result });
    setRegenerating(false);
  };

  const handlePrint = () => {
    const client = buildClientContext(caseItem, evidence);
    const today = format(new Date(), "d MMMM yyyy");
    const printStyles = `
      @media print {
        body * { visibility: hidden !important; }
        #cc-letter-print, #cc-letter-print * { visibility: visible !important; }
        #cc-letter-print { position: fixed; left: 0; top: 0; width: 100%; }
        @page { margin: 2cm; }
      }
    `;
    if (!document.getElementById("cc-print-style")) {
      const s = document.createElement("style");
      s.id = "cc-print-style";
      s.innerHTML = printStyles;
      document.head.appendChild(s);
    }
    let area = document.getElementById("cc-letter-print");
    if (!area) { area = document.createElement("div"); area.id = "cc-letter-print"; document.body.appendChild(area); }
    area.innerHTML = `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;line-height:1.65;">
      ${buildLetterheadHTML(caseItem, client, today)}
      <pre style="white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.75;margin:0;">${letter}</pre>
      ${buildFooterHTML(caseItem, client, 1)}
    </div>`;
    window.print();
  };

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

      {/* Letterhead Preview */}
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">

        {/* Header: business card banner + contact strip */}
        <LetterheadHeader today={today} />



        {/* Letter body */}
        <div className="px-8 py-6 bg-white">
          {editing ? (
            <Textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={22}
              className="font-body text-sm leading-relaxed bg-white text-slate-900"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              {letter}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9pt] italic text-slate-400">
                Chaos Controller by Deb King {new Date().getFullYear()}{client.name ? ` — ${client.name} vs ${caseItem.organisation_name || ""}` : ""} — {caseItem.title}
              </p>
              <p className="text-[8pt] text-slate-300 mt-0.5">
                Chaos Controller™ provides organisational and document management assistance only. Not legal advice.
              </p>
            </div>
            <p className="text-[9pt] text-slate-400 ml-4 shrink-0">p. 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}