import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";
import { format, isPast, addDays, isWithinInterval } from "date-fns";

export default function ActionItems({ cases }) {
  const actions = [];

  cases.forEach((c) => {
    if (c.status === "draft") {
      actions.push({
        caseId: c.id,
        title: c.title,
        message: "Complete your complaint and send it",
        type: "warning",
      });
    }
    if (c.response_deadline) {
      const deadline = new Date(c.response_deadline);
      if (isPast(deadline) && c.status === "awaiting_response") {
        actions.push({
          caseId: c.id,
          title: c.title,
          message: `Response deadline passed (${format(deadline, "d MMM")})`,
          type: "urgent",
        });
      } else if (
        c.status === "awaiting_response" &&
        isWithinInterval(new Date(), { start: addDays(deadline, -3), end: deadline })
      ) {
        actions.push({
          caseId: c.id,
          title: c.title,
          message: `Response deadline approaching (${format(deadline, "d MMM")})`,
          type: "warning",
        });
      }
    }
    if (c.status === "escalation_ready") {
      actions.push({
        caseId: c.id,
        title: c.title,
        message: "Ready to escalate — review your escalation package",
        type: "info",
      });
    }
  });

  if (actions.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm">No actions required right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.slice(0, 5).map((action, i) => (
        <Link
          key={i}
          to={`/case/${action.caseId}`}
          className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all group"
        >
          {action.type === "urgent" ? (
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-warning shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{action.title}</p>
            <p className="text-xs text-muted-foreground">{action.message}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}