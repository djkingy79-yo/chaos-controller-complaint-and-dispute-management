import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format } from "date-fns";
import { Flame, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

const statusLabel = {
  draft: "Setting Up",
  complaint_sent: "Complaint Sent",
  awaiting_response: "Awaiting Response",
  response_received: "Response Received",
  escalation_ready: "Ready to Escalate",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const categoryEmoji = {
  banking: "🔥",
  insurance: "🚗",
  tenancy: "🏠",
  telco: "📱",
  utilities: "⚡",
  other: "🛒",
};

function BallIndicator({ caseItem }) {
  const hasTheBall = ["awaiting_response", "escalation_ready"].includes(caseItem.status);
  const weHaveTheBall = ["draft", "complaint_sent", "response_received"].includes(caseItem.status);

  if (hasTheBall) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-2 text-center">
        <p className="text-[10px] font-bold text-warning uppercase tracking-wide">
          {caseItem.organisation_name?.split(" ")[0]?.toUpperCase() || "THEM"} HAS THE BALL
        </p>
      </div>
    );
  }
  if (weHaveTheBall) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wide">YOUR MOVE</p>
      </div>
    );
  }
  return null;
}

function DeadlineBadge({ deadline }) {
  if (!deadline) return null;
  const days = differenceInDays(new Date(deadline), new Date());
  if (days < 0) return <span className="text-[10px] font-bold text-destructive">⚠ OVERDUE</span>;
  if (days === 0) return <span className="text-[10px] font-bold text-destructive">🚨 DUE TODAY</span>;
  if (days <= 3) return <span className="text-[10px] font-bold text-warning">🚨 {days}d left</span>;
  return <span className="text-[10px] text-muted-foreground">{days}d left</span>;
}

export default function CommandCentre({ cases }) {
  const active = cases.filter((c) => !["resolved", "closed"].includes(c.status)).slice(0, 4);

  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-destructive" />
        <h2 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wide">Command Centre</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {active.map((c) => {
          const totalSteps = 5;
          const completedSteps = [
            c.issue_summary,
            c.complaint_letter,
            c.status !== "draft",
            ["awaiting_response", "response_received", "escalation_ready", "escalated", "resolved"].includes(c.status),
            ["escalation_ready", "escalated", "resolved"].includes(c.status),
          ].filter(Boolean).length;
          const progress = Math.round((completedSteps / totalSteps) * 100);

          return (
            <Link key={c.id} to={`/case/${c.id}`} className="block">
              <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{categoryEmoji[c.category] || "🛒"}</span>
                    <span className="text-xs font-medium text-foreground leading-tight line-clamp-1">{c.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                </div>

                {/* Stage */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {statusLabel[c.status] || c.status}
                  </Badge>
                  <DeadlineBadge deadline={c.response_deadline} />
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Progress</span>
                    <span className="text-[10px] font-bold text-foreground">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progress >= 80 ? "bg-success" : progress >= 50 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <BallIndicator caseItem={c} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}