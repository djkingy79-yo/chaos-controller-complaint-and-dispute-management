import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Shield, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
  complaint_sent: { label: "Complaint Sent", className: "bg-primary/15 text-primary" },
  awaiting_response: { label: "Awaiting Response", className: "bg-warning/15 text-warning" },
  response_received: { label: "Response Received", className: "bg-accent/15 text-accent" },
  escalation_ready: { label: "Ready to Escalate", className: "bg-destructive/15 text-destructive" },
  escalated: { label: "Escalated", className: "bg-destructive/15 text-destructive" },
  resolved: { label: "Resolved", className: "bg-success/15 text-success" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

const priorityConfig = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export default function CaseStatusControl({ caseItem }) {
  const queryClient = useQueryClient();
  const status = statusConfig[caseItem.status] || statusConfig.draft;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] }),
  });

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Badge className={`${status.className} border-0 text-xs font-medium px-3 py-1`}>
          {status.label}
        </Badge>
        <Select
          value={caseItem.priority}
          onValueChange={(v) => updateMutation.mutate({ priority: v })}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(priorityConfig).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2.5 text-sm">
        {caseItem.organisation_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{caseItem.organisation_name}</span>
          </div>
        )}
        {caseItem.response_deadline && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Deadline: {format(new Date(caseItem.response_deadline), "d MMM yyyy")}</span>
          </div>
        )}
        {caseItem.escalation_body && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span className="text-xs">{caseItem.escalation_body}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <label className="text-xs text-muted-foreground mb-1.5 block">Update Status</label>
        <Select
          value={caseItem.status}
          onValueChange={(v) => updateMutation.mutate({ status: v })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}