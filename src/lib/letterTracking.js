/**
 * CHAOS CONTROLLER — LETTER SENT TRACKING
 *
 * Shared helper to mark a letter as sent — used for both:
 *   - real-time sends (email sent today via LetterEmailDialog)
 *   - retrospective sends (user already sent this letter in the past,
 *     before joining Chaos Controller)
 *
 * Updates:
 *   - the letter's sent timestamp field (e.g. first_complaint_sent_at)
 *   - the letter_tracking object (method, recipient, notes, proof, manual flag)
 *   - progress_stage (only advances forward, never regresses an already-later stage)
 *   - creates a TimelineEvent dated with the ACTUAL sent date (not "today")
 */

import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { LETTER_SENT_FIELD_MAP, LETTER_PROGRESS_STAGE_MAP } from "@/lib/disputeStageLogic";

const STAGE_ORDER = [
  "case_created",
  "first_complaint_sent", "awaiting_first_response", "first_no_response",
  "second_complaint_sent", "awaiting_second_response", "second_no_response",
  "third_complaint_sent", "awaiting_final_response", "final_no_response",
  "escalation_ready", "escalated",
  "offer_received", "offer_accepted", "offer_denied",
  "resolved", "closed",
];

function isForwardStage(current, next) {
  const curIdx = STAGE_ORDER.indexOf(current);
  const nextIdx = STAGE_ORDER.indexOf(next);
  if (curIdx === -1 || nextIdx === -1) return true;
  return nextIdx > curIdx;
}

/**
 * @param {object} caseItem - full current case record
 * @param {string} letterKey - one of letter1, letter2, letter3, accept_offer, deny_offer, escalation
 * @param {object} details - { sentDate (yyyy-MM-dd or ISO), method, recipientName, recipientEmail, notes, proofFileUrl, manuallyMarkedSent }
 */
export async function markLetterSent(caseItem, letterKey, details = {}) {
  const {
    sentDate,
    method = "email",
    recipientName = "",
    recipientEmail = "",
    notes = "",
    proofFileUrl = "",
    manuallyMarkedSent = false,
  } = details;

  const sentField = LETTER_SENT_FIELD_MAP[letterKey];
  const sentIso = sentDate ? new Date(sentDate).toISOString() : new Date().toISOString();

  const existingTracking = caseItem.letter_tracking || {};
  const letter_tracking = {
    ...existingTracking,
    [letterKey]: {
      sentDate: sentIso,
      generatedDate: existingTracking[letterKey]?.generatedDate || null,
      manuallyMarkedSent,
      status: "sent",
      sentMethod: method,
      sentTo: recipientName || recipientEmail || "",
      sentNotes: notes,
      proofOfSendingFileId: proofFileUrl || existingTracking[letterKey]?.proofOfSendingFileId || "",
    },
  };

  const updates = { letter_tracking };
  if (sentField) updates[sentField] = sentIso;

  const targetStage = LETTER_PROGRESS_STAGE_MAP[letterKey];
  if (targetStage && isForwardStage(caseItem.progress_stage, targetStage)) {
    updates.progress_stage = targetStage;
  }

  await base44.entities.Case.update(caseItem.id, updates);

  const labelMap = {
    letter1: "1st Complaint",
    letter2: "2nd Complaint",
    letter3: "3rd/Final Complaint",
    accept_offer: "Accept Offer Letter",
    deny_offer: "Deny Offer Letter",
    escalation: "Escalation Letter",
  };

  await base44.entities.TimelineEvent.create({
    case_id: caseItem.id,
    event_date: format(new Date(sentIso), "yyyy-MM-dd"),
    title: `${labelMap[letterKey] || letterKey} sent to ${caseItem.organisation_name || "organisation"}`,
    description: [
      manuallyMarkedSent ? "Marked as already sent (retrospective entry)." : "Sent via email.",
      method ? `Method: ${method.replace(/_/g, " ")}.` : "",
      recipientName || recipientEmail ? `Recipient: ${recipientName || recipientEmail}.` : "",
      notes || "",
    ].filter(Boolean).join(" "),
    event_type: "complaint",
    is_action_required: false,
  });
}