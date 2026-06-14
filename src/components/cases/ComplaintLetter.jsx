import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const LOGO = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png";

// Merge extracted evidence data with case-level complainant fields
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
  // Fill gaps from scanned evidence
  for (const ev of (evidenceList || [])) {
    const d = ev.extracted_data;
    if (!d) continue;
    if (!merged.name && d.complainant_name) merged.name = d.complainant_name;
    if (!merged.address && d.complainant_address) merged.address = d.complainant_address;
    if (!merged.email && d.complainant_email) merged.email = d.complainant_email;
    if (!merged.phone && d.complainant_phone) merged.phone = d.complainant_phone;
    if (d.account_numbers?.length) merged.accounts = [...merged.accounts, ...d.account_numbers];
    if (d.policy_numbers?.length) merged.policies = [...(merged.policies || []), ...d.policy_numbers];
    if (d.key_amounts?.length) merged.amounts = [...(merged.amounts || []), ...d.key_amounts];
    if (d.dates_mentioned?.length) merged.dates = [...(merged.dates || []), ...d.dates_mentioned];
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

    const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute.

COMPLAINANT DETAILS (use all provided fields directly — no placeholder brackets):
- Name: ${client.name || "[COMPLAINANT NAME]"}
- Address: ${client.address || "[COMPLAINANT ADDRESS]"}
- Email: ${client.email || "[COMPLAINANT EMAIL]"}
- Phone/Mobile: ${client.phone || "[COMPLAINANT PHONE]"}
- Account/Reference Number: ${client.accounts?.join(", ") || caseItem.account_number || "not provided"}
- Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : client.dates?.join(", ") || "not provided"}
${client.policies?.length ? `- Policy/Reference Numbers: ${client.policies.join(", ")}` : ""}
${client.amounts?.length ? `- Key Amounts: ${client.amounts.join(", ")}` : ""}

ORGANISATION DETAILS:
- Organisation: ${caseItem.organisation_name || "[ORGANISATION NAME]"}
- Complaints Address: ${caseItem.organisation_complaints_address || "Complaints Department, " + (caseItem.organisation_name || "[Organisation]")}
- Complaints Email: ${caseItem.organisation_complaints_email || "not provided"}
- Complaint Handler: ${caseItem.complaint_handler_name || "The Complaints Manager"}

CASE DETAILS:
- Category: ${caseItem.category}
- Issue Summary: ${caseItem.issue_summary}
- Full Details: ${caseItem.issue_details}
- Desired Outcome: ${caseItem.desired_outcome}
- Escalation Body: ${caseItem.escalation_body}

LETTER FORMAT INSTRUCTIONS:
1. Top right: complainant's full address block, then the date (${format(new Date(), "d MMMM yyyy")}).
2. Below that, left-aligned: complaint handler name/title, organisation name, organisation complaints address.
3. Re: line with the subject e.g. "Re: Formal Complaint — Account ${client.accounts?.[0] || caseItem.account_number || "[account]"}"
4. Salutation: "Dear ${caseItem.complaint_handler_name ? caseItem.complaint_handler_name : "Sir/Madam"},"
5. Body: reference account number and incident date prominently in the opening paragraph.
6. Firm but professional tone. Include a 21-day response deadline.
7. Mention ${caseItem.escalation_body || "the relevant ombudsman"} as the next escalation step.
8. Close with "Yours faithfully," then the complainant's full name.
9. Do NOT use any placeholder brackets for any detail that has been provided above.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setLetter(result);
    updateMutation.mutate({ complaint_letter: result });
    setRegenerating(false);
  };

  const handlePrint = () => {
    const client = buildClientContext(caseItem, evidence);
    if (!document.getElementById("cc-print-style")) {
      const s = document.createElement("style");
      s.id = "cc-print-style";
      s.innerHTML = `@media print { body * { visibility: hidden !important; } #cc-letter-print, #cc-letter-print * { visibility: visible !important; } #cc-letter-print { position: fixed; left: 0; top: 0; width: 100%; } @page { margin: 2cm; } }`;
      document.head.appendChild(s);
    }
    let area = document.getElementById("cc-letter-print");
    if (!area) { area = document.createElement("div"); area.id = "cc-letter-print"; document.body.appendChild(area); }
    area.innerHTML = buildPrintHTML(caseItem, letter, client);
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
  const footerText = buildFooterText(caseItem, client);

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

      {/* Letterhead Preview — clean white, professional */}
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">

        {/* Header — white background, logo left, date + domain right */}
        <div className="px-8 pt-6 pb-4 flex items-start justify-between border-b border-slate-200">
          <img src={LOGO} alt="Chaos Controller" className="h-16 w-auto object-contain" />
          <div className="text-right">
            <p className="text-xs text-slate-500">{today}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">chaoscontroller.com.au</p>
          </div>
        </div>

        {/* Blue rule */}
        <div className="h-0.5 bg-primary mx-8" />

        {/* Complainant details block */}
        {(client.name || client.address || client.email || client.phone) && (
          <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-x-8 gap-y-1">
            {client.name    && <p className="text-xs"><span className="text-slate-500">From: </span><span className="font-semibold text-slate-800">{client.name}</span></p>}
            {client.address && <p className="text-xs"><span className="text-slate-500">Address: </span><span className="font-medium text-slate-700">{client.address}</span></p>}
            {client.email   && <p className="text-xs"><span className="text-slate-500">Email: </span><span className="font-medium text-slate-700">{client.email}</span></p>}
            {client.phone   && <p className="text-xs"><span className="text-slate-500">Mobile: </span><span className="font-medium text-slate-700">{client.phone}</span></p>}
            {client.accounts?.length > 0 && <p className="text-xs col-span-2"><span className="text-slate-500">Account: </span><span className="font-semibold text-slate-800">{client.accounts.join(", ")}</span></p>}
            {client.policies?.length > 0 && <p className="text-xs col-span-2"><span className="text-slate-500">Reference: </span><span className="font-medium text-slate-700">{client.policies.join(", ")}</span></p>}
            {caseItem.incident_date && <p className="text-xs"><span className="text-slate-500">Incident Date: </span><span className="font-semibold text-red-600">{format(new Date(caseItem.incident_date), "d MMMM yyyy")}</span></p>}
            {caseItem.complaint_handler_name && <p className="text-xs"><span className="text-slate-500">Attn: </span><span className="font-medium text-slate-700">{caseItem.complaint_handler_name}</span></p>}
            {caseItem.organisation_name && <p className="text-xs col-span-2"><span className="text-slate-500">To: </span><span className="font-semibold text-slate-800">{caseItem.organisation_name}</span>{caseItem.organisation_complaints_email ? <span className="text-slate-400 ml-2">({caseItem.organisation_complaints_email})</span> : ""}</p>}
          </div>
        )}

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

        {/* Footer — italic, 9pt style, matches spec */}
        <div className="px-8 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <p className="text-[9pt] italic text-slate-400">{footerText}</p>
          <p className="text-[9pt] text-slate-400 ml-4 shrink-0">p. 1</p>
        </div>
      </div>
    </div>
  );
}

function buildFooterText(caseItem, client) {
  const year = new Date().getFullYear();
  const complainantName = client.name || caseItem.complainant_name || "";
  const org = caseItem.organisation_name || "";
  const title = caseItem.title || "";
  return `Chaos Controller by Deb King ${year}${complainantName ? ` — ${complainantName} vs ${org}` : ""} ${year} — ${title}`;
}

function buildPrintHTML(caseItem, letter, client) {
  const today = format(new Date(), "d MMMM yyyy");
  const year = new Date().getFullYear();
  const footerText = buildFooterText(caseItem, client);

  const clientRows = [
    client.name    ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">From:</td><td style="font-weight:bold;">${client.name}</td></tr>` : "",
    client.address ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Address:</td><td>${client.address}</td></tr>` : "",
    client.email   ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Email:</td><td>${client.email}</td></tr>` : "",
    client.phone   ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Mobile:</td><td>${client.phone}</td></tr>` : "",
    client.accounts?.length ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Account:</td><td style="font-weight:bold;">${client.accounts.join(", ")}</td></tr>` : "",
    client.policies?.length ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Reference:</td><td>${client.policies.join(", ")}</td></tr>` : "",
    caseItem.incident_date ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Incident Date:</td><td style="font-weight:bold;color:#cc0000;">${format(new Date(caseItem.incident_date), "d MMMM yyyy")}</td></tr>` : "",
    caseItem.complaint_handler_name ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">Attn:</td><td>${caseItem.complaint_handler_name}</td></tr>` : "",
    caseItem.organisation_name ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;">To:</td><td style="font-weight:bold;">${caseItem.organisation_name}${caseItem.organisation_complaints_email ? ` (${caseItem.organisation_complaints_email})` : ""}</td></tr>` : "",
    caseItem.organisation_complaints_address ? `<tr><td style="color:#555;padding:2pt 16pt 2pt 0;white-space:nowrap;"></td><td style="color:#555;">${caseItem.organisation_complaints_address}</td></tr>` : "",
  ].filter(Boolean).join("");

  return `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;line-height:1.65;">
    <!-- LETTERHEAD: no dark background -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:0;padding-bottom:10pt;border-bottom:1pt solid #e2e8f0;">
      <tr>
        <td style="padding:10pt 0 8pt 0;">
          <img src="${LOGO}" alt="Chaos Controller" style="height:55pt;width:auto;" />
        </td>
        <td style="text-align:right;vertical-align:top;padding-top:10pt;">
          <div style="font-size:10pt;color:#64748b;">${today}</div>
          <div style="font-size:9pt;color:#94a3b8;margin-top:2pt;">chaoscontroller.com.au</div>
        </td>
      </tr>
    </table>

    <div style="border-bottom:2pt solid #1d4ed8;margin:0 0 12pt 0;"></div>

    ${clientRows ? `<div style="background:#f8fafc;border:1pt solid #e2e8f0;padding:8pt 14pt;margin-bottom:14pt;">
      <table style="border-collapse:collapse;font-size:11pt;">${clientRows}</table>
    </div>` : ""}

    <pre style="white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.75;margin:0;">${letter}</pre>

    <!-- FOOTER: starts page 2+ in print, shown here on screen for preview -->
    <div style="font-size:9pt;font-style:italic;color:#888;border-top:1pt solid #ddd;margin-top:32pt;padding-top:8pt;display:flex;justify-content:space-between;">
      <span>${footerText}</span>
      <span>p. 2</span>
    </div>
  </div>`;
}