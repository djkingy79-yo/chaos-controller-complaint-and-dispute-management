import React from "react";
import { format } from "date-fns";

/**
 * Builds structured header data for use in both the preview UI and PDF generator.
 * Returns: { receiverLines, senderLines, today }
 */
export function buildLetterHeaderData(caseItem, client) {
  const today = format(new Date(), "d MMMM yyyy");

  const receiverLines = [
    caseItem?.complaint_handler_name || "The Complaints Manager",
    caseItem?.organisation_name || "",
    ...(caseItem?.organisation_complaints_address || "").split("\n").map(l => l.trim()).filter(Boolean),
    caseItem?.organisation_complaints_email || "",
  ].filter(Boolean);

  const senderLines = [
    client?.name || "",
    ...(client?.address || "").split("\n").map(l => l.trim()).filter(Boolean),
    client?.email || "",
    client?.phone || "",
  ].filter(Boolean);

  return { receiverLines, senderLines, today };
}

/**
 * Renders the formal two-column letter header for preview display.
 * Left column: receiver (organisation). Right column: sender (complainant).
 */
export default function LetterHeader({ caseItem, client, reSubject }) {
  const { receiverLines, senderLines, today } = buildLetterHeaderData(caseItem, client);

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", color: "#000", marginBottom: "16pt" }}>
      {/* Date — right aligned */}
      <div style={{ textAlign: "right", marginBottom: "20pt" }}>{today}</div>

      {/* Two-column address block */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24pt", marginBottom: "16pt" }}>
        {/* Receiver — left */}
        <div>
          {receiverLines.map((line, i) => (
            <div key={i} style={{ lineHeight: "1.4" }}>{line}</div>
          ))}
        </div>
        {/* Sender — right, left-aligned text */}
        <div>
          {senderLines.map((line, i) => (
            <div key={i} style={{ lineHeight: "1.4" }}>{line}</div>
          ))}
        </div>
      </div>

      {/* RE line */}
      {reSubject && (
        <div style={{ marginBottom: "8pt", fontWeight: "bold" }}>Re: {reSubject}</div>
      )}

      {/* Rule */}
      <hr style={{ border: "none", borderTop: "1px solid #000", marginBottom: "16pt" }} />
    </div>
  );
}