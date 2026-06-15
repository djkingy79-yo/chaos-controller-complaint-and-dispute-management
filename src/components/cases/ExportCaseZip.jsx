import React, { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export default function ExportCaseZip({ caseItem, evidence = [], events = [] }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const zip = new JSZip();
    const safeName = (caseItem.title || "case").replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // 1. Case summary text
    const summary = `CHAOS CONTROLLER™ — CASE EXPORT
Generated: ${new Date().toLocaleString("en-AU")}
${"=".repeat(50)}

CASE DETAILS
${"─".repeat(50)}
Title:           ${caseItem.title || "N/A"}
Category:        ${caseItem.category || "N/A"}
Status:          ${caseItem.status || "N/A"}
Priority:        ${caseItem.priority || "N/A"}
Organisation:    ${caseItem.organisation_name || "N/A"}
Account No:      ${caseItem.account_number || "N/A"}
Incident Date:   ${caseItem.incident_date || "N/A"}
Response Due:    ${caseItem.response_deadline || "N/A"}
Escalation Body: ${caseItem.escalation_body || "N/A"}

COMPLAINANT
${"─".repeat(50)}
Name:    ${caseItem.complainant_name || "N/A"}
Address: ${caseItem.complainant_address || "N/A"}
Email:   ${caseItem.complainant_email || "N/A"}
Phone:   ${caseItem.complainant_phone || "N/A"}

ISSUE SUMMARY
${"─".repeat(50)}
${caseItem.issue_summary || "N/A"}

ISSUE DETAILS
${"─".repeat(50)}
${caseItem.issue_details || "N/A"}

DESIRED OUTCOME
${"─".repeat(50)}
${caseItem.desired_outcome || "N/A"}

NOTES
${"─".repeat(50)}
${caseItem.notes || "N/A"}
`;
    zip.file("01_case_summary.txt", summary);

    // 2. Complaint letter
    if (caseItem.complaint_letter) {
      zip.file("02_complaint_letter.txt", caseItem.complaint_letter);
    }

    // 3. Timeline
    if (events.length > 0) {
      const sorted = [...events].sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""));
      let timeline = `CASE TIMELINE\n${"=".repeat(50)}\n\n`;
      sorted.forEach((e, i) => {
        timeline += `${i + 1}. [${e.event_date || "No date"}] ${e.title}\n`;
        timeline += `   Type: ${e.event_type || "N/A"}\n`;
        if (e.description) timeline += `   ${e.description}\n`;
        if (e.is_action_required) timeline += `   ⚠️ ACTION REQUIRED\n`;
        timeline += "\n";
      });
      zip.file("03_timeline.txt", timeline);
    }

    // 4. Evidence index
    if (evidence.length > 0) {
      let index = `EVIDENCE INDEX\n${"=".repeat(50)}\n\n`;
      index += `Total files: ${evidence.length}\n\n`;
      evidence.forEach((ev, i) => {
        index += `${i + 1}. ${ev.file_name}\n`;
        index += `   Type: ${ev.file_type || "N/A"}\n`;
        if (ev.event_date) index += `   Date: ${ev.event_date}\n`;
        if (ev.description) index += `   Notes: ${ev.description}\n`;
        index += `   URL: ${ev.file_url}\n\n`;
      });
      zip.file("04_evidence_index.txt", index);
    }

    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_export_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-2"
    >
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? "Exporting..." : "Export ZIP"}
    </Button>
  );
}