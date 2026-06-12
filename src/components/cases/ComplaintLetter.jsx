import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  if (!caseItem.complaint_letter && !letter) {
    return (
      <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No complaint letter generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Complaint Letter</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Copy
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
              if (editing) {
                updateMutation.mutate({ complaint_letter: letter });
              }
              setEditing(!editing);
            }}
            className="gap-1.5 text-xs"
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
      </div>

      {editing ? (
        <Textarea
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          rows={20}
          className="font-body text-sm leading-relaxed"
        />
      ) : (
        <div className="bg-card border border-border rounded-lg p-5">
          <pre className="whitespace-pre-wrap text-sm font-body leading-relaxed text-foreground">
            {letter}
          </pre>
        </div>
      )}
    </div>
  );
}