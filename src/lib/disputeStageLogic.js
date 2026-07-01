/**
 * CHAOS CONTROLLER — SHARED DISPUTE STAGE LOGIC
 *
 * Single source of truth for "has this stage had no response" detection,
 * used by ChaosScore (matter strength) and DisputeProgressTracker.
 *
 * A stage counts as "no response" if EITHER:
 *   - the user explicitly recorded no-response via the checkpoint dialog, OR
 *   - the letter was sent >= RESPONSE_DEADLINE_DAYS ago and no response has
 *     been recorded yet (auto-detected from the sent date — this is what
 *     lets retrospective/past sent-dates unlock the next stage automatically).
 */

import { differenceInDays } from "date-fns";

export const RESPONSE_DEADLINE_DAYS = 21;

export function computeNoResponse(sentAt, receivedAt, noResponseAt, days = RESPONSE_DEADLINE_DAYS) {
  if (noResponseAt) return true;
  if (receivedAt) return false;
  if (!sentAt) return false;
  const daysSince = differenceInDays(new Date(), new Date(sentAt));
  return daysSince >= days;
}

// Letter key -> Case field that stores the sent timestamp for that letter
export const LETTER_SENT_FIELD_MAP = {
  letter1: "first_complaint_sent_at",
  letter2: "second_complaint_sent_at",
  letter3: "third_complaint_sent_at",
  accept_offer: "accept_offer_sent_at",
  deny_offer: "deny_offer_sent_at",
  escalation: "escalated_at",
};

// Letter key -> progress_stage to set once that letter is marked sent
export const LETTER_PROGRESS_STAGE_MAP = {
  letter1: "awaiting_first_response",
  letter2: "awaiting_second_response",
  letter3: "awaiting_final_response",
  accept_offer: "offer_accepted",
  deny_offer: "offer_denied",
  escalation: "escalated",
};

export const SEND_METHODS = [
  { value: "email", label: "Email" },
  { value: "post", label: "Post" },
  { value: "portal", label: "Portal" },
  { value: "hand_delivered", label: "Hand delivered" },
  { value: "phone_confirmed", label: "Phone confirmed" },
  { value: "other", label: "Other" },
];

// Letter key -> Case field storing that letter's generated content.
// This is the ONLY letter field map used anywhere in the app — never the
// legacy complaint_letter / complaint_letter_2 / letter_escalation fields.
export const LETTER_FIELD_MAP = {
  letter1: "first_complaint_letter",
  letter2: "second_complaint_letter",
  letter3: "third_complaint_letter",
  accept_offer: "accept_offer_letter",
  deny_offer: "deny_offer_letter",
  escalation: "escalation_letter",
};

export const LETTER_LABELS = {
  letter1: "1st Complaint",
  letter2: "2nd Complaint",
  letter3: "3rd Complaint",
  accept_offer: "Accept Offer",
  deny_offer: "Deny Offer",
  escalation: "Escalation Letter",
};

// Single source of truth for each letter type's "Re:" subject line.
export function getLetterReSubject(letterKey, organisationName) {
  const org = organisationName || "Organisation";
  const map = {
    letter1: `FORMAL COMPLAINT — ${org}`,
    letter2: `SECOND FORMAL COMPLAINT — ${org}`,
    letter3: `THIRD AND FINAL COMPLAINT — ${org}`,
    accept_offer: `ACCEPTANCE OF SETTLEMENT OFFER — ${org}`,
    deny_offer: `REJECTION OF SETTLEMENT OFFER — ${org}`,
    escalation: `EXTERNAL DISPUTE SUBMISSION — ${org}`,
  };
  return map[letterKey] || `FORMAL COMPLAINT — ${org}`;
}