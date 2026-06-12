import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function buildClientContext(evidenceList) {
  const merged = {};
  for (const ev of (evidenceList || [])) {
    const d = ev.extracted_data;
    if (!d) continue;
    if (d.complainant_name && !merged.name)       merged.name    = d.complainant_name;
    if (d.complainant_address && !merged.address) merged.address = d.complainant_address;
    if (d.complainant_email && !merged.email)     merged.email   = d.complainant_email;
    if (d.complainant_phone && !merged.phone)     merged.phone   = d.complainant_phone;
    if (d.account_numbers?.length)  merged.accounts  = [...(merged.accounts  || []), ...d.account_numbers];
    if (d.policy_numbers?.length)   merged.policies  = [...(merged.policies  || []), ...d.policy_numbers];
    if (d.key_amounts?.length)      merged.amounts   = [...(merged.amounts   || []), ...d.key_amounts];
    if (d.dates_mentioned?.length)  merged.dates     = [...(merged.dates     || []), ...d.dates_mentioned];
  }
  // dedupe arrays
  for (const k of ["accounts","policies","amounts","dates"]) {
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
    const client = buildClientContext(evidence);

    const clientBlock = `
CLIENT DETAILS (extracted from their documents — use these directly in the letter, no placeholders):
- Name: ${client.name || "Not yet extracted — use [CLIENT NAME]"}
- Address: ${client.address || "Not yet extracted — use [CLIENT ADDRESS]"}
- Email: ${client.email || "Not yet extracted — use [CLIENT EMAIL]"}
- Phone: ${client.phone || "Not yet extracted — use [CLIENT PHONE]"}
${client.accounts?.length  ? `- Account Number(s): ${client.accounts.join(", ")}`  : ""}
${client.policies?.length  ? `- Policy/Reference Number(s): ${client.policies.join(", ")}` : ""}
${client.amounts?.length   ? `- Key Amounts Referenced: ${client.amounts.join(", ")}` : ""}
${client.dates?.length     ? `- Key Dates Referenced: ${client.dates.join(" | ")}` : ""}
`.trim();

    const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute.

${clientBlock}

CASE DETAILS:
Category: ${caseItem.category}
Organisation: ${caseItem.organisation_name}
Issue: ${caseItem.issue_summary}
Details: ${caseItem.issue_details}
Desired Outcome: ${caseItem.desired_outcome}
Escalation Body: ${caseItem.escalation_body}

INSTRUCTIONS:
- Use the client's real name, address, account numbers, and dates throughout the letter — do NOT use placeholder brackets for any detail that has been provided above.
- Only use a placeholder like [X] if a specific field above says "Not yet extracted".
- Write a professional, firm but polite letter in formal business letter format.
- Address it to: Complaints Department, ${caseItem.organisation_name || "the organisation"}.
- Include a 21-day response deadline and mention ${caseItem.escalation_body || "the relevant ombudsman"} as the next escalation step.
- Reference specific dates and amounts from the client details above.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setLetter(result);
    updateMutation.mutate({ complaint_letter: result });
    setRegenerating(false);
  };

  const handlePrint = () => {
    const client = buildClientContext(evidence);
    const printStyles = `
      <style>
        @media print { body * { visibility: hidden !important; } #cc-letter-print, #cc-letter-print * { visibility: visible !important; } #cc-letter-print { position: fixed; left: 0; top: 0; width: 100%; } @page { margin: 2cm; } }
      </style>`;
    if (!document.getElementById("cc-letter-print-styles")) {
      const s = document.createElement("style");
      s.id = "cc-letter-print-styles";
      s.innerHTML = `@media print { body * { visibility: hidden !important; } #cc-letter-print, #cc-letter-print * { visibility: visible !important; } #cc-letter-print { position: fixed; left: 0; top: 0; width: 100%; } @page { margin: 2cm; } }`;
      document.head.appendChild(s);
    }
    let area = document.getElementById("cc-letter-print");
    if (!area) { area = document.createElement("div"); area.id = "cc-letter-print"; document.body.appendChild(area); }
    area.innerHTML = buildLetterHTML(caseItem, letter, client);
    window.print();
  };

  if (!caseItem.complaint_letter && !letter) {
    return (
      <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No complaint letter generated yet.</p>
      </div>
    );
  }

  const client = buildClientContext(evidence);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Complaint Letter</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="gap-1.5 text-xs"
          >
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (editing) updateMutation.mutate({ complaint_letter: letter });
              setEditing(!editing);
            }}
            className="gap-1.5 text-xs"
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Letterhead preview */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-black px-6 py-3 flex items-center justify-between">
          <img
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png"
            alt="Chaos Controller"
            className="h-14 w-auto object-contain"
          />
          <p className="text-slate-400 text-[10px] text-right">Generated {format(new Date(), "d MMMM yyyy")}</p>
        </div>

        {/* Client info block */}
        {(client.name || client.address || client.email || client.phone || client.accounts?.length) && (
          <div className="px-6 py-3 bg-secondary/30 border-b border-border grid grid-cols-2 gap-x-6 gap-y-1">
            {client.name    && <p className="text-xs"><span className="text-muted-foreground">From: </span><span className="font-medium text-foreground">{client.name}</span></p>}
            {client.address && <p className="text-xs"><span className="text-muted-foreground">Address: </span><span className="font-medium text-foreground">{client.address}</span></p>}
            {client.email   && <p className="text-xs"><span className="text-muted-foreground">Email: </span><span className="font-medium text-foreground">{client.email}</span></p>}
            {client.phone   && <p className="text-xs"><span className="text-muted-foreground">Phone: </span><span className="font-medium text-foreground">{client.phone}</span></p>}
            {client.accounts?.length > 0 && <p className="text-xs col-span-2"><span className="text-muted-foreground">Account(s): </span><span className="font-medium text-foreground">{client.accounts.join(", ")}</span></p>}
            {client.policies?.length > 0 && <p className="text-xs col-span-2"><span className="text-muted-foreground">Reference(s): </span><span className="font-medium text-foreground">{client.policies.join(", ")}</span></p>}
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-primary/20 mx-6" />

        {/* Letter body */}
        <div className="p-6">
          {editing ? (
            <Textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={20}
              className="font-body text-sm leading-relaxed"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-body leading-relaxed text-foreground">
              {letter}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-secondary/20">
          <p className="text-[10px] text-muted-foreground italic">Chaos Controller™ — {caseItem.title} — This document is for organisational purposes only. Not legal advice.</p>
        </div>
      </div>
    </div>
  );
}

function buildLetterHTML(caseItem, letter, client) {
  const today = format(new Date(), "d MMMM yyyy");
  const clientRows = [
    client.name    ? `<tr><td style="color:#666;padding:2pt 12pt 2pt 0;font-size:11pt;">From:</td><td style="font-weight:bold;font-size:11pt;">${client.name}</td></tr>` : "",
    client.address ? `<tr><td style="color:#666;padding:2pt 12pt 2pt 0;font-size:11pt;">Address:</td><td style="font-size:11pt;">${client.address}</td></tr>` : "",
    client.email   ? `<tr><td style="color:#666;padding:2pt 12pt 2pt 0;font-size:11pt;">Email:</td><td style="font-size:11pt;">${client.email}</td></tr>` : "",
    client.phone   ? `<tr><td style="color:#666;padding:2pt 12pt 2pt 0;font-size:11pt;">Phone:</td><td style="font-size:11pt;">${client.phone}</td></tr>` : "",
    client.accounts?.length ? `<tr><td style="color:#666;padding:2pt 12pt 2pt 0;font-size:11pt;">Account(s):</td><td style="font-size:11pt;">${client.accounts.join(", ")}</td></tr>` : "",
    client.policies?.length ? `<tr><td style="color:#666;padding:2pt 12pt 2pt 0;font-size:11pt;">Reference(s):</td><td style="font-size:11pt;">${client.policies.join(", ")}</td></tr>` : "",
  ].filter(Boolean).join("");

  return `
  <div style="font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;line-height:1.6;">
    <!-- LETTERHEAD -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
      <tr>
        <td style="padding:14pt 0 10pt 0;">
          <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png" alt="Chaos Controller" style="height:60pt;width:auto;" />
        </td>
        <td style="text-align:right;vertical-align:top;padding-top:14pt;">
          <div style="font-size:10pt;color:#64748b;">${today}</div>
          <div style="font-size:9pt;color:#94a3b8;margin-top:2pt;">chaoscontroller.com.au</div>
        </td>
      </tr>
    </table>

    ${clientRows ? `
    <!-- CLIENT INFO -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6pt;padding:10pt 14pt;margin-bottom:0;">
      <table style="border-collapse:collapse;">${clientRows}</table>
    </div>` : ""}

    <!-- SEPARATOR -->
    <hr style="border:none;border-top:2px solid #1d4ed8;margin:14pt 0 16pt 0;"/>

    <!-- LETTER BODY -->
    <pre style="white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.75;margin:0;">${letter}</pre>

    <!-- FOOTER -->
    <div style="font-size:10pt;font-style:italic;border-top:1px solid #ccc;margin-top:28pt;padding-top:8pt;color:#666;">
      Prepared by Chaos Controller™ — ${caseItem.title} — ${today} | This document is for organisational purposes only. Not legal advice.
    </div>
  </div>`;
}