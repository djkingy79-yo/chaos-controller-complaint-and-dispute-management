import React, { useState } from "react";
import { Check, Clock, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import ResponseCheckpointDialog from "./ResponseCheckpointDialog";

function ts(dt) {
  if (!dt) return null;
  return format(new Date(dt), "d MMM yyyy");
}

function StepIcon({ state }) {
  if (state === "complete")
    return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green-500 border-2 border-green-500 z-10 shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>;
  if (state === "active")
    return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary border-2 border-primary z-10 shrink-0"><div className="w-2 h-2 rounded-full bg-white animate-pulse" /></div>;
  if (state === "warning")
    return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-warning border-2 border-warning z-10 shrink-0"><Clock className="w-3.5 h-3.5 text-white" /></div>;
  if (state === "error")
    return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-destructive border-2 border-destructive z-10 shrink-0"><XCircle className="w-3.5 h-3.5 text-white" /></div>;
  // future
  return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-card border-2 border-border z-10 shrink-0"><div className="w-2 h-2 rounded-full bg-muted-foreground/30" /></div>;
}

function StepLabel({ label, sublabel, state }) {
  const textColor =
    state === "complete" ? "text-green-600" :
    state === "active" ? "text-primary" :
    state === "warning" ? "text-warning" :
    state === "error" ? "text-destructive" :
    "text-muted-foreground";
  return (
    <div className="flex-1 pt-0.5 pb-1 min-w-0">
      <p className={`text-sm font-semibold leading-tight ${textColor}`}>{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sublabel}</p>}
    </div>
  );
}

export default function DisputeProgressTracker({ caseItem }) {
  const [checkpointDialog, setCheckpointDialog] = useState(null); // "first" | "second" | "third"

  const c = caseItem || {};

  // ---- derive each step's state ----

  // 1. Case Created — always complete if case exists
  const caseCreated = "complete";

  // 2. 1st Complaint Sent
  const firstSent = !!c.first_complaint_sent_at;
  const firstSentState = firstSent ? "complete" : "future";
  const firstSentSub = firstSent ? `Sent ${ts(c.first_complaint_sent_at)}` : "Send your 1st Complaint letter";

  // 3. Merchant Response after 1st
  let firstResponseState, firstResponseLabel, firstResponseSub;
  if (!firstSent) {
    firstResponseState = "future";
    firstResponseLabel = "Merchant / Respondent Response";
    firstResponseSub = "Awaiting 1st complaint being sent";
  } else if (c.first_response_received_at) {
    firstResponseState = "complete";
    firstResponseLabel = "Response Received";
    firstResponseSub = `Received ${ts(c.first_response_received_at)}`;
  } else if (c.first_no_response_at) {
    firstResponseState = "error";
    firstResponseLabel = "No Response";
    firstResponseSub = `No response by deadline — 2nd complaint unlocked`;
  } else {
    firstResponseState = "warning";
    firstResponseLabel = "Merchant / Respondent Response";
    firstResponseSub = "Awaiting response — record outcome below";
  }

  // show response checkpoint buttons after 1st sent if no outcome yet
  const showFirstCheckpoint = firstSent && !c.first_response_received_at && !c.first_no_response_at;

  // 4. 2nd Complaint Sent — unlocked after first no-response OR first response received (user continues)
  const secondUnlocked = !!c.first_no_response_at || (!!c.first_response_received_at && ["second_complaint_sent", "awaiting_second_response", "second_no_response", "third_complaint_sent", "awaiting_final_response", "final_no_response", "escalation_ready", "escalated", "offer_received", "offer_accepted", "offer_denied", "resolved", "closed"].includes(c.progress_stage));
  const secondSent = !!c.second_complaint_sent_at;
  let secondSentState, secondSentSub;
  if (secondSent) { secondSentState = "complete"; secondSentSub = `Sent ${ts(c.second_complaint_sent_at)}`; }
  else if (secondUnlocked) { secondSentState = "active"; secondSentSub = "Send your 2nd Complaint letter"; }
  else { secondSentState = "future"; secondSentSub = "Unlocked after recording 1st response outcome"; }

  // 5. Merchant Response after 2nd
  let secondResponseState, secondResponseLabel, secondResponseSub;
  if (!secondSent) {
    secondResponseState = "future";
    secondResponseLabel = "Merchant / Respondent Response";
    secondResponseSub = "Awaiting 2nd complaint being sent";
  } else if (c.second_response_received_at) {
    secondResponseState = "complete";
    secondResponseLabel = "Response Received";
    secondResponseSub = `Received ${ts(c.second_response_received_at)}`;
  } else if (c.second_no_response_at) {
    secondResponseState = "error";
    secondResponseLabel = "No Response";
    secondResponseSub = "No response by deadline — 3rd complaint unlocked";
  } else {
    secondResponseState = "warning";
    secondResponseLabel = "Merchant / Respondent Response";
    secondResponseSub = "Awaiting response — record outcome below";
  }
  const showSecondCheckpoint = secondSent && !c.second_response_received_at && !c.second_no_response_at;

  // 6. 3rd Final Complaint Sent
  const thirdUnlocked = !!c.second_no_response_at || (!!c.second_response_received_at && ["third_complaint_sent", "awaiting_final_response", "final_no_response", "escalation_ready", "escalated"].includes(c.progress_stage));
  const thirdSent = !!c.third_complaint_sent_at;
  let thirdSentState, thirdSentSub;
  if (thirdSent) { thirdSentState = "complete"; thirdSentSub = `Sent ${ts(c.third_complaint_sent_at)}`; }
  else if (thirdUnlocked) { thirdSentState = "active"; thirdSentSub = "Send your Final Complaint letter"; }
  else { thirdSentState = "future"; thirdSentSub = "Unlocked after recording 2nd response outcome"; }

  // 7. Final Response Checkpoint
  let finalResponseState, finalResponseLabel, finalResponseSub;
  if (!thirdSent) {
    finalResponseState = "future";
    finalResponseLabel = "Final Response Checkpoint";
    finalResponseSub = "Awaiting 3rd complaint being sent";
  } else if (c.third_response_received_at) {
    finalResponseState = "complete";
    finalResponseLabel = "Response Received";
    finalResponseSub = `Received ${ts(c.third_response_received_at)}`;
  } else if (c.third_no_response_at) {
    finalResponseState = "error";
    finalResponseLabel = "Organisation Failed To Respond";
    finalResponseSub = "Escalation unlocked — proceed to external body";
  } else {
    finalResponseState = "warning";
    finalResponseLabel = "Final Response Checkpoint";
    finalResponseSub = "Awaiting response — record outcome below";
  }
  const showThirdCheckpoint = thirdSent && !c.third_response_received_at && !c.third_no_response_at;

  // 8. Escalated
  const escalated = !!c.escalated_at;
  const escalationUnlocked = !!c.third_no_response_at || !!c.third_response_received_at || c.progress_stage === "escalation_ready" || c.progress_stage === "escalated";
  let escalatedState, escalatedSub;
  if (escalated) { escalatedState = "complete"; escalatedSub = `Escalated ${ts(c.escalated_at)}${c.escalation_reference ? ` · Ref: ${c.escalation_reference}` : ""}`; }
  else if (escalationUnlocked) { escalatedState = "active"; escalatedSub = "Ready to escalate to external body"; }
  else { escalatedState = "future"; escalatedSub = `Escalate to ${c.escalation_body || "AFCA / NCAT / Ombudsman"}`; }

  // 9. Final Outcome
  const hasFinalOutcome = !!c.final_outcome;
  let finalOutcomeState, finalOutcomeSub;
  if (hasFinalOutcome) { finalOutcomeState = "complete"; finalOutcomeSub = `${c.final_outcome}${c.final_outcome_at ? " · " + ts(c.final_outcome_at) : ""}`; }
  else { finalOutcomeState = "future"; finalOutcomeSub = "Offer accepted / denied · Resolved · Closed"; }

  const steps = [
    { icon: caseCreated, label: "Case Created", sub: `Created ${ts(c.created_date)}` },
    { icon: firstSentState, label: "1st Internal Complaint Sent", sub: firstSentSub },
    { icon: firstResponseState, label: firstResponseLabel, sub: firstResponseSub, checkpointKey: showFirstCheckpoint ? "first" : null },
    { icon: secondSentState, label: "2nd Complaint Sent", sub: secondSentSub },
    { icon: secondResponseState, label: secondResponseLabel, sub: secondResponseSub, checkpointKey: showSecondCheckpoint ? "second" : null },
    { icon: thirdSentState, label: "Final Complaint Sent", sub: thirdSentSub },
    { icon: finalResponseState, label: finalResponseLabel, sub: finalResponseSub, checkpointKey: showThirdCheckpoint ? "third" : null },
    { icon: escalatedState, label: "Escalated", sub: escalatedSub },
    { icon: finalOutcomeState, label: "Final Outcome", sub: finalOutcomeSub },
  ];

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading font-bold text-sm text-foreground mb-4 uppercase tracking-wide">
          Dispute Progress
        </h3>

        <div className="relative">
          <div className="absolute left-[14px] top-4 bottom-4 w-0.5 bg-border" />

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx}>
                <div className="relative flex items-start gap-3 pl-1">
                  <StepIcon state={step.icon} />
                  <StepLabel label={step.label} sublabel={step.sub} state={step.icon} />
                </div>

                {/* Checkpoint action buttons */}
                {step.checkpointKey && (
                  <div className="ml-10 mt-2 flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs border-green-500/50 text-green-700 hover:bg-green-50"
                      onClick={() => setCheckpointDialog(step.checkpointKey)}
                    >
                      <Check className="w-3.5 h-3.5" />
                      YES — Record Response Received
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs border-destructive/50 text-destructive hover:bg-red-50"
                      onClick={() => setCheckpointDialog(step.checkpointKey)}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {step.checkpointKey === "third" ? "NO RESPONSE — Escalate" : `NO RESPONSE — ${step.checkpointKey === "first" ? "Unlock 2nd Complaint" : "Unlock 3rd Complaint"}`}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {checkpointDialog && (
        <ResponseCheckpointDialog
          open={!!checkpointDialog}
          onClose={() => setCheckpointDialog(null)}
          caseItem={caseItem}
          stage={checkpointDialog}
        />
      )}
    </>
  );
}