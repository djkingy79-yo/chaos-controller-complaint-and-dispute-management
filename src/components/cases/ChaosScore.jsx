import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { computeNoResponse } from "@/lib/disputeStageLogic";
import { getEscalationUrl } from "@/lib/industryClassifier";

/**
 * Matter Strength scoring (total: 100%)
 * +15  Issue documented
 * +20  Evidence uploaded
 * +15  Timeline has events
 * +5   1st complaint generated
 * +10  1st complaint sent
 * +5   2nd complaint generated OR no response recorded after 1st
 * +10  2nd complaint sent OR no response recorded after 1st
 * +5   3rd/final complaint generated OR no response recorded after 2nd
 * +10  3rd/final complaint sent OR no response recorded after 2nd
 * +5   Escalation body identified
 *
 * "No response recorded" is auto-detected once the response deadline has
 * passed with nothing recorded — see computeNoResponse() — so retrospective
 * (past) sent dates unlock the pathway without extra manual steps.
 */
export function scoreFromCase(caseItem, evidence, events) {
  let score = 0;
  const items = [];
  const c = caseItem;

  // A letter counts as "generated" if drafted in-app OR it was actually sent
  // (a letter clearly existed if it was sent, even if drafted outside the app)
  const firstGenerated = !!(c.first_complaint_letter || c.complaint_letter || c.first_complaint_sent_at);
  const secondGenerated = !!(c.second_complaint_letter || c.complaint_letter_2 || c.second_complaint_sent_at);
  const thirdGenerated = !!(c.third_complaint_letter || c.complaint_letter_3 || c.third_complaint_sent_at);

  const noResponseAfterFirst = computeNoResponse(c.first_complaint_sent_at, c.first_response_received_at, c.first_no_response_at);
  const noResponseAfterSecond = computeNoResponse(c.second_complaint_sent_at, c.second_response_received_at, c.second_no_response_at);
  const noResponseAfterThird = computeNoResponse(c.third_complaint_sent_at, c.third_response_received_at, c.third_no_response_at);

  // 1. Issue documented (+15)
  if (c.issue_summary && c.issue_details) {
    score += 15;
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

  // 3. Timeline has events (+15)
  if (events.length > 0) {
    score += 15;
    items.push({ label: "Timeline recorded", status: "green" });
  } else {
    items.push({ label: "No timeline events recorded", status: "yellow" });
  }

  // 4. 1st complaint generated (+5)
  if (firstGenerated) {
    score += 5;
    items.push({ label: "1st complaint letter generated", status: "green" });
  } else {
    items.push({ label: "1st complaint letter not yet generated", status: "yellow" });
  }

  // 5. 1st complaint sent (+10)
  if (c.first_complaint_sent_at) {
    score += 10;
    items.push({ label: "1st complaint sent to organisation", status: "green" });
  } else {
    items.push({ label: "1st complaint not yet sent", status: "yellow" });
  }

  // 6. 2nd complaint generated OR no response after 1st (+5)
  if (secondGenerated || noResponseAfterFirst) {
    score += 5;
    items.push({ label: secondGenerated ? "2nd complaint letter generated" : "No response after 1st complaint", status: "green" });
  } else {
    items.push({ label: "2nd complaint not generated — awaiting response", status: "yellow" });
  }

  // 7. 2nd complaint sent OR no response after 1st (+10)
  if (c.second_complaint_sent_at || noResponseAfterFirst) {
    score += 10;
    items.push({ label: c.second_complaint_sent_at ? "2nd complaint sent" : "No response after 1st — pathway continues", status: "green" });
  } else {
    items.push({ label: "2nd complaint not yet sent", status: "yellow" });
  }

  // 8. 3rd/final complaint generated OR no response after 2nd (+5)
  if (thirdGenerated || noResponseAfterSecond) {
    score += 5;
    items.push({ label: thirdGenerated ? "3rd/final complaint letter generated" : "No response after 2nd complaint", status: "green" });
  } else {
    items.push({ label: "3rd/final complaint not generated — awaiting response", status: "yellow" });
  }

  // 9. 3rd/final complaint sent OR no response after 2nd (+10)
  if (c.third_complaint_sent_at || noResponseAfterSecond) {
    score += 10;
    items.push({ label: c.third_complaint_sent_at ? "3rd/final complaint sent" : "No response after 2nd — pathway continues", status: "green" });
  } else {
    items.push({ label: "3rd/final complaint not yet sent", status: "yellow" });
  }

  // 10. Escalation body identified (+5)
  if (c.escalation_body) {
    score += 5;
    items.push({ label: `Escalation body identified — ${c.escalation_body}`, status: "green" });
  } else {
    items.push({ label: "Escalation body not yet identified", status: "yellow" });
  }

  // Escalation pathway complete once the 3rd/final complaint has run its course —
  // either no response was received (auto-detected or recorded), OR a response
  // WAS received and the case has since progressed to an offer/escalation letter.
  // (Previously this only unlocked on no-response, so cases where the organisation
  // actually replied to the final complaint could never unlock Escalation.)
  const escalationCriteriaMet =
    (!!c.third_complaint_sent_at && (noResponseAfterThird || !!c.third_response_received_at)) ||
    (!c.third_complaint_sent_at && noResponseAfterSecond) ||
    !!c.accept_offer_sent_at ||
    !!c.deny_offer_sent_at ||
    !!c.escalated_at ||
    c.status === "escalation_ready" ||
    c.status === "escalated" ||
    c.progress_stage === "escalation_ready" ||
    c.progress_stage === "escalated";

  const readyToEscalate =
    escalationCriteriaMet &&
    !!c.escalation_body &&
    c.status !== "escalated" &&
    c.status !== "resolved" &&
    c.status !== "closed";

  return { score, items, readyToEscalate, noResponseAfterFirst, noResponseAfterSecond, noResponseAfterThird, escalationCriteriaMet };
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
  const { score, items, readyToEscalate, noResponseAfterFirst, escalationCriteriaMet } = scoreFromCase(caseItem, evidence, events);

  const handleEscalate = () => {
    // Single source of truth — the industry classifier — decides the
    // escalation body/URL for this case's category. No separate/hardcoded
    // category mapping lives here.
    const url = getEscalationUrl(caseItem.category);
    if (url) {
      window.open(url, "_blank");
    } else {
      navigate(`/case/${caseItem.id}?tab=print`);
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
              {(() => {
                if (!caseItem.first_complaint_sent_at) {
                  return "Build your case — document the issue, upload evidence, and send the first complaint.";
                }
                if (!noResponseAfterFirst) {
                  return "Awaiting response — response deadline has not yet passed.";
                }
                if (!escalationCriteriaMet) {
                  return "Send (or mark as sent) the next complaint stage before escalating.";
                }
                if (!caseItem.escalation_body) {
                  return "Identify the escalation body (e.g. AFCA, TIO, NCAT) to unlock escalation.";
                }
                return `${100 - score}% more needed to complete the pathway.`;
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}