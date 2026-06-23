import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Scoring breakdown (total possible: 100)
 * +20  Issue documented (summary + details)
 * +20  Evidence uploaded
 * +15  Timeline recorded
 * +15  First complaint drafted
 * +10  Complaint actually sent (first_complaint_sent_at stamped)
 * +10  No-response / rejected response recorded (no_response_at or second/final complaint reached)
 * +10  Final complaint completed OR escalation criteria genuinely met
 *
 * Ready to Escalate requires: score >= 85 AND hard escalation criteria satisfied
 */
function scoreFromCase(caseItem, evidence, events) {
  let score = 0;
  const items = [];

  // 1. Issue documented (+20)
  if (caseItem.issue_summary && caseItem.issue_details) {
    score += 20;
    items.push({ label: "Issue documented", status: "green" });
  } else {
    items.push({ label: "Issue not fully documented", status: "red" });
  }

  // 2. Evidence uploaded (+20)
  if (evidence.length > 0) {
    score += 20;
    items.push({ label: `${evidence.length} evidence file${evidence.length > 1 ? "s" : ""} uploaded`, status: "green" });
  } else {
    items.push({ label: "No evidence uploaded", status: "red" });
  }

  // 3. Timeline recorded (+15)
  if (events.length > 0) {
    score += 15;
    items.push({ label: "Timeline recorded", status: "green" });
  } else {
    items.push({ label: "No timeline events recorded", status: "yellow" });
  }

  // 4. First complaint drafted (+15)
  if (caseItem.complaint_letter) {
    score += 15;
    items.push({ label: "First complaint letter drafted", status: "green" });
  } else {
    items.push({ label: "First complaint letter not drafted", status: "red" });
  }

  // 5. Complaint actually sent (+10) — requires the timestamp to be stamped
  if (caseItem.first_complaint_sent_at) {
    score += 10;
    items.push({ label: "First complaint sent to organisation", status: "green" });
  } else {
    items.push({ label: "First complaint not yet sent", status: "yellow" });
  }

  // 6. No-response / unresolved response recorded (+10)
  // True if: no-response timestamp set, OR second/final complaint sent, OR status is escalation_ready/escalated
  const noResponseRecorded =
    !!caseItem.first_no_response_at ||
    !!caseItem.second_no_response_at ||
    !!caseItem.third_no_response_at ||
    !!caseItem.second_complaint_sent_at ||
    !!caseItem.third_complaint_sent_at ||
    caseItem.status === "escalation_ready" ||
    caseItem.status === "escalated";

  // Only show response label if a response was ACTUALLY recorded
  const responseActuallyReceived =
    !!caseItem.first_response_received_at ||
    !!caseItem.second_response_received_at ||
    !!caseItem.third_response_received_at ||
    caseItem.status === "response_received";

  if (noResponseRecorded) {
    score += 10;
    items.push({ label: "No adequate response — dispute escalatable", status: "green" });
  } else if (responseActuallyReceived) {
    // Response received but not yet unresolved — partial credit, show honest label
    score += 5;
    items.push({ label: "Response received — outcome pending", status: "yellow" });
  } else if (caseItem.status === "complaint_sent" || caseItem.status === "awaiting_response") {
    items.push({ label: "Awaiting response from organisation", status: "yellow" });
  } else {
    items.push({ label: "No response outcome recorded", status: "yellow" });
  }

  // 7. Final complaint completed or escalation criteria met (+10)
  const escalationCriteriaMet =
    !!caseItem.third_complaint_sent_at ||
    !!caseItem.letter_escalation ||
    caseItem.status === "escalation_ready" ||
    caseItem.status === "escalated" ||
    caseItem.progress_stage === "escalation_ready" ||
    caseItem.progress_stage === "escalated";

  if (escalationCriteriaMet) {
    score += 10;
    items.push({ label: "Escalation pathway completed", status: "green" });
  } else if (caseItem.second_complaint_sent_at) {
    score += 5;
    items.push({ label: "Second complaint sent — final stage pending", status: "yellow" });
  } else {
    items.push({ label: "Escalation pathway not yet complete", status: "yellow" });
  }

  // Hard gate for "Ready to Escalate":
  // Score >= 85 AND complaint actually sent AND unresolved response/no-response recorded
  const readyToEscalate =
    score >= 85 &&
    !!caseItem.first_complaint_sent_at &&
    noResponseRecorded &&
    caseItem.status !== "escalated" &&
    caseItem.status !== "resolved" &&
    caseItem.status !== "closed";

  return { score, items, readyToEscalate };
}

const statusIcon = {
  green: <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />,
  yellow: <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />,
  red: <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />,
};

const scoreColor = (score) => {
  if (score >= 85) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

const barColor = (score) => {
  if (score >= 85) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
};

export default function ChaosScore({ caseItem, evidence, events }) {
  const navigate = useNavigate();
  const { score, items, readyToEscalate } = scoreFromCase(caseItem, evidence, events);

  const handleEscalate = () => {
    if (caseItem.category === "banking" || caseItem.category === "insurance") {
      window.open("https://www.afca.org.au/make-a-complaint/", "_blank");
    } else if (caseItem.category === "telco") {
      window.open("https://www.tio.com.au/complaints", "_blank");
    } else if (caseItem.category === "utilities") {
      window.open("https://www.ewon.com.au/page/making-a-complaint/complaint-forms", "_blank");
    } else if (caseItem.category === "tenancy") {
      window.open("https://www.ncat.nsw.gov.au/ncat/how-to-apply.html", "_blank");
    } else {
      navigate(`/case/${caseItem.id}?tab=bundle`);
    }
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

      {/* Escalate / progress hint */}
      <div className="pt-2 border-t border-border">
        {readyToEscalate ? (
          <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-success mb-2">READY TO ESCALATE</p>
            <p className="text-xs text-muted-foreground mb-3">Your case is strong. Time to take it further.</p>
            {caseItem.escalation_body && (
              <p className="text-xs font-medium text-foreground mb-2">→ {caseItem.escalation_body}</p>
            )}
            <Button
              onClick={handleEscalate}
              className="bg-success text-success-foreground hover:bg-success/90 text-xs px-4 py-2 h-auto gap-1.5"
            >
              <ArrowUpRight className="w-3 h-3" /> Green Light — Escalate Now
            </Button>
          </div>
        ) : (
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {score < 50
                ? "Build your case — document the issue, upload evidence, and send the first complaint."
                : score < 85
                ? `${85 - score}% more needed — complete the complaint pathway to unlock escalation.`
                : "Complaint pathway must be completed before escalating."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}