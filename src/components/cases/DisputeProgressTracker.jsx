import React from "react";
import { Check, Circle } from "lucide-react";

const STAGES = [
  {
    key: "draft",
    label: "Draft",
    description: "Case created, details being filled in"
  },
  {
    key: "complaint_sent",
    label: "Complaint Sent",
    description: "Formal complaint submitted to the organisation"
  },
  {
    key: "awaiting_response",
    label: "Awaiting Response",
    description: "Waiting for the organisation to respond (21 days)"
  },
  {
    key: "response_received",
    label: "Response Received",
    description: "Organisation has replied — review their response"
  },
  {
    key: "escalation_ready",
    label: "Escalation Ready",
    description: "Evidence strong enough to escalate to ombudsman"
  },
  {
    key: "escalated",
    label: "Escalated",
    description: "Complaint lodged with ombudsman or tribunal"
  },
  {
    key: "resolved",
    label: "Resolved",
    description: "Dispute has been settled in your favour"
  }
];

// Map any status to its stage index (including "closed" → resolved position)
const STATUS_INDEX = {
  draft: 0,
  complaint_sent: 1,
  awaiting_response: 2,
  response_received: 3,
  escalation_ready: 4,
  escalated: 5,
  resolved: 6,
  closed: 6
};

export default function DisputeProgressTracker({ caseItem }) {
  const currentIndex = STATUS_INDEX[caseItem?.status] ?? 0;
  const isClosed = caseItem?.status === "closed";

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-heading font-bold text-sm text-foreground mb-4 uppercase tracking-wide">
        Dispute Progress
      </h3>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

        <div className="space-y-3">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <div key={stage.key} className="relative flex items-start gap-3 pl-1">
                {/* Step indicator */}
                <div
                  className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-green-500 border-green-500"
                      : isCurrent
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>

                {/* Label + description */}
                <div className="flex-1 pt-0.5 pb-1">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      isCompleted
                        ? "text-green-500"
                        : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                    {isCurrent && !isClosed && (
                      <span className="ml-2 text-xs font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  {(isCurrent || isCompleted) && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {stage.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Closed badge */}
          {isClosed && (
            <div className="mt-2 ml-10 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              This case has been closed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}