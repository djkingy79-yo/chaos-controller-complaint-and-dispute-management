import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function scoreFromCase(caseItem, evidence, events) {
  let score = 0;
  const items = [];

  if (caseItem.issue_summary && caseItem.issue_details) {
    score += 20;
    items.push({ label: "Issue documented", status: "green" });
  } else {
    items.push({ label: "Issue not fully documented", status: "red" });
  }

  if (caseItem.complaint_letter) {
    score += 20;
    items.push({ label: "Complaint letter drafted", status: "green" });
  } else {
    items.push({ label: "No complaint letter", status: "red" });
  }

  if (evidence.length > 0) {
    score += 20;
    items.push({ label: `${evidence.length} evidence file${evidence.length > 1 ? "s" : ""} uploaded`, status: "green" });
  } else {
    items.push({ label: "No evidence uploaded", status: "red" });
  }

  if (events.length > 0) {
    score += 20;
    items.push({ label: "Timeline recorded", status: "green" });
  } else {
    items.push({ label: "No timeline events", status: "yellow" });
  }

  const hasResponse = ["response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status);
  if (hasResponse) {
    score += 20;
    items.push({ label: "Response received / escalated", status: "green" });
  } else if (caseItem.status === "complaint_sent" || caseItem.status === "awaiting_response") {
    score += 10;
    items.push({ label: "Awaiting organisation response", status: "yellow" });
  } else {
    items.push({ label: "No response logged yet", status: "yellow" });
  }

  return { score, items };
}

const statusIcon = {
  green: <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />,
  yellow: <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />,
  red: <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />,
};

const scoreColor = (score) => {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

const barColor = (score) => {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
};

export default function ChaosScore({ caseItem, evidence, events }) {
  const navigate = useNavigate();
  const { score, items } = scoreFromCase(caseItem, evidence, events);
  const readyToEscalate = score >= 80 && caseItem.status !== "escalated" && caseItem.status !== "resolved";

  const handleEscalate = () => {
    navigate(`/case/${caseItem.id}?tab=bundle`);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm text-foreground">Matter Strength</h3>
        <span className={`text-2xl font-display font-bold ${scoreColor(score)}`}>{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {statusIcon[item.status]}
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Escalate button */}
      {readyToEscalate ? (
        <div className="pt-2 border-t border-border">
          <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-success mb-2">READY TO ESCALATE</p>
            <p className="text-xs text-muted-foreground mb-3">Your case is strong. Time to take it further.</p>
            {caseItem.escalation_body && (
              <p className="text-xs font-medium text-foreground mb-2">→ {caseItem.escalation_body}</p>
            )}
            <Button onClick={handleEscalate} className="bg-success text-success-foreground hover:bg-success/90 text-xs px-4 py-2 h-auto gap-1.5">
              <ArrowUpRight className="w-3 h-3" /> Green Light — Escalate Now
            </Button>
          </div>
        </div>
      ) : score < 80 ? (
        <div className="pt-2 border-t border-border">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Reach 80% to unlock the escalation pathway.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}