import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Pencil, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ComplaintLetter({ caseItem }) {
  const [editing, setEditing] = useState(false);
  const [letter, setLetter] = useState(caseItem.complaint_letter || "");
  const [regenerating, setRegenerating] = useState(false);
  const queryClient = useQueryClient();

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
    const prompt = `You are a professional consumer advocacy assistant in Australia. Regenerate a formal internal complaint letter for this dispute:

Category: ${caseItem.category}
Organisation: ${caseItem.organisation_name}
Issue: ${caseItem.issue_summary}
Details: ${caseItem.issue_details}
Desired Outcome: ${caseItem.desired_outcome}
Escalation Body: ${caseItem.escalation_body}

Write a professional, firm but polite complaint letter. Include a 21-day response request and mention the escalation body. No placeholder brackets.`;

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