import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, DollarSign, CheckCircle2, XCircle, Handshake, Edit2 } from "lucide-react";

const OUTCOME_CONFIG = {
  won: { label: "Won", icon: Trophy, className: "text-success bg-success/10 border-success/20" },
  settled: { label: "Settled", icon: Handshake, className: "text-warning bg-warning/10 border-warning/20" },
  lost: { label: "Lost", icon: XCircle, className: "text-destructive bg-destructive/10 border-destructive/20" },
};

export default function OutcomeTracker({ caseItem }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [outcome, setOutcome] = useState(caseItem.outcome || "");
  const [recovery, setRecovery] = useState(caseItem.financial_recovery || "");

  const isClosedOrResolved = ["resolved", "closed"].includes(caseItem.status);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ outcome: outcome || null, financial_recovery: recovery || null });
  };

  const currentOutcome = OUTCOME_CONFIG[caseItem.outcome];

  if (!isClosedOrResolved) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          <span className="font-heading font-semibold text-sm text-foreground">Outcome</span>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          {currentOutcome ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${currentOutcome.className}`}>
              <currentOutcome.icon className="w-4 h-4" />
              {currentOutcome.label}
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-lg py-2.5 px-3 hover:border-primary/30 hover:text-foreground transition-colors text-left"
            >
              + Record outcome (won / settled / lost)
            </button>
          )}
          {caseItem.financial_recovery && (
            <div className="flex items-center gap-2 text-sm text-success">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="font-medium">Recovery: {caseItem.financial_recovery}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block">Dispute outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select outcome…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Financial recovery (optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
                placeholder="e.g. $1,200.00"
                className="h-9 text-sm pl-7"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 h-8 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setOutcome(caseItem.outcome || ""); setRecovery(caseItem.financial_recovery || ""); }} className="h-8 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}