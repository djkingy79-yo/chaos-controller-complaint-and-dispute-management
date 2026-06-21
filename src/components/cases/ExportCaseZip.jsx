import React, { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { buildDocument, DOCUMENT_CSS, LETTERHEAD_URL, FOOTER_URL } from "@/lib/documentFormatEngine";

const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

function buildSummaryHTML(caseItem, evidence, events) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0));
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const summaryRows = [
    { label: "Title", value: caseItem.title },
    { label: "Category", value: caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : null },
    { label: "Status", value: (caseItem.status || "").replace(/_/g, " ").toUpperCase() },
    { label: "Priority", value: (caseItem.priority || "").toUpperCase() },
    { label: "Organisation", value: caseItem.organisation_name },
    { label: "Account No.", value: caseItem.account_number },
    { label: "Incident Date", value: caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : null },
    { label: "Response Due", value: caseItem.response_deadline ? format(new Date(caseItem.response_deadline), "d MMMM yyyy") : null },
    { label: "Escalation Body", value: caseItem.escalation_body },
  ].filter(r => r.value);

  return `<!DOCTYPE html><html><head>
    <title>Case Export — ${caseItem.title}</title>
    <style>
      ${DOCUMENT_CSS}
      h1.section-title { font-size: 13pt; font-weight: bold; margin: 12pt 0 8pt 0; color: #000; border-bottom: 1px solid #000; padding-bottom: 4pt; }
      h2.section-title { font-size: 12pt; font-weight: bold; margin: 10pt 0 6pt 0; color: #000; }
      .summary-box { background: white; border: none; padding: 0; margin-bottom: 10pt; }
      .summary-row td { border: none; padding: 3pt 6pt 3pt 0; font-size: 10pt; color: #000; }
      .summary-row td:first-child { color: #000; font-style: normal; white-space: nowrap; width: 35%; font-weight: bold; }
      .summary-row td:last-child { font-weight: normal; }
      .section { margin-top: 10pt; }
      table { width: 100%; border-collapse: collapse; margin-top: 10pt; font-size: 10pt; }
      th { background: white; text-align: left; padding: 4pt 6pt; font-weight: bold; border-bottom: 1px solid #000; font-size: 10pt; color: #000; }
      td { padding: 3pt 6pt; border-bottom: none; vertical-align: top; font-size: 10pt; color: #000; }
      </style>
      </head><body>
      <div class="letterhead-header"></div>
      <div class="document-content">
      <div class="section-title" style="font-size:14pt;margin-bottom:10pt;">CHAOS CONTROLLER™ — CASE EXPORT</div>
    
    <div class="summary-box">
      <table class="summary-row">
        <tbody>${summaryRows.map(r => `<tr><td>${r.label}</td><td>${r.value}</td></tr>`).join("")}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Complainant Details</div>
      <table class="summary-row">
        <tbody>
          ${caseItem.complainant_name ? `<tr><td>Name</td><td>${caseItem.complainant_name}</td></tr>` : ""}
          ${caseItem.complainant_address ? `<tr><td>Address</td><td>${caseItem.complainant_address}</td></tr>` : ""}
          ${caseItem.complainant_email ? `<tr><td>Email</td><td>${caseItem.complainant_email}</td></tr>` : ""}
          ${caseItem.complainant_phone ? `<tr><td>Phone</td><td>${caseItem.complainant_phone}</td></tr>` : ""}
        </tbody>
      </table>
    </div>

    ${caseItem.issue_summary ? `<div class="section">
      <div class="section-title">Issue Summary</div>
      <div style="font-size:10.5pt;line-height:1.6;">${caseItem.issue_summary}</div>
    </div>` : ""}

    ${caseItem.issue_details ? `<div class="section">
      <div class="section-title">Full Issue Details</div>
      <div style="font-size:10.5pt;line-height:1.6;">${caseItem.issue_details}</div>
    </div>` : ""}

    ${caseItem.desired_outcome ? `<div class="section">
      <div class="section-title">Desired Outcome</div>
      <div style="font-size:10.5pt;line-height:1.6;">${caseItem.desired_outcome}</div>
    </div>` : ""}

    ${sorted.length > 0 ? `
    <div class="section">
      <div class="section-title">Chronological Timeline (${sorted.length} events)</div>
      <table>
        <thead><tr><th style="width:70pt;">Date</th><th style="width:80pt;">Type</th><th>Event</th><th>Details</th></tr></thead>
        <tbody>${sorted.map(ev=>`<tr>
          <td style="white-space:nowrap;">${ev.event_date?format(new Date(ev.event_date),"d MMM yyyy"):"—"}</td>
          <td style="text-transform:capitalize;">${(ev.event_type||"").replace(/_/g," ")}</td>
          <td style="font-weight:bold;">${ev.title}</td>
          <td style="color:#555;">${ev.description||""}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>` : ""}

    ${evidence.length > 0 ? `
    <div class="section">
      <div class="section-title">Evidence Index (${evidence.length} files)</div>
      <table>
        <thead><tr><th style="width:25pt;">#</th><th>File Name</th><th style="width:70pt;">Type</th><th style="width:60pt;">Date</th><th>Description</th></tr></thead>
        <tbody>${evidence.map((ev,i)=>`<tr>
          <td style="font-weight:bold;text-align:center;">${i+1}</td>
          <td style="font-weight:bold;word-break:break-word;">${ev.file_name}</td>
          <td style="text-transform:capitalize;">${(ev.file_type||"").replace(/_/g," ")}</td>
          <td>${ev.event_date?format(new Date(ev.event_date),"d MMM yyyy"):"—"}</td>
          <td style="color:#555;">${ev.description||"—"}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>` : ""}

    ${LETTER_DEFS.filter(ld => caseItem[ld.field]).map((ld, idx) => `
    <div class="section" style="page-break-before:always;margin-top:20pt;">
      <div class="section-title">${ld.label}</div>
      <pre style="font-size:10pt;line-height:1.2;font-family:'Times New Roman',Times,serif;white-space:pre-wrap;">${(caseItem[ld.field] || '').replace(/<[^>]*>/g, '')}</pre>
    </div>`).join("")}
      </div>
      <div class="letterhead-footer"></div>
  </body></html>`;
}

function openPrintPreview(caseItem, evidence, events) {
  const htmlContent = buildSummaryHTML(caseItem, evidence, events);
  const win = window.open("", "_blank");
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

// Helper to build letter HTML for ZIP export
function buildLetterHTML(title, content) {
  const cleanContent = content.replace(/<[^>]*>/g, '');
  return `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    ${DOCUMENT_CSS}
    .content { white-space: pre-wrap; word-wrap: break-word; font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; width: 100%; max-width: 100%; margin: 0; padding: 0 17.5mm; box-sizing: border-box; }
  </style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="document-content">${cleanContent}</div>
    <div class="letterhead-footer"></div>
  </body></html>`;
}

export default function ExportCaseZip({ caseItem, evidence = [], events = [] }) {
  const [exporting, setExporting] = useState(false);

  const handleExportZip = async () => {
    setExporting(true);
    const zip = new JSZip();
    const safeName = (caseItem.title || "case").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
    const now = new Date().toLocaleString("en-AU");

    // 1. HTML summary (PDF-style view)
    zip.file("01_case_summary.html", buildSummaryHTML(caseItem, evidence, events));

    // 2. Individual letters as HTML
    const lettersFolder = zip.folder("letters");
    LETTER_DEFS.forEach((ld, i) => {
      if (caseItem[ld.field]) {
        const letterHTML = buildLetterHTML(ld.label, caseItem[ld.field]);
        lettersFolder.file(`${i + 1}_${ld.label.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`, letterHTML);
      }
    });

    // 3. Timeline CSV
    if (events.length > 0) {
      const sorted = [...events].sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""));
      const csv = ["Date,Type,Title,Description,Action Required",
        ...sorted.map(e => `"${e.event_date || ""}","${e.event_type || ""}","${(e.title || "").replace(/"/g, '""')}","${(e.description || "").replace(/"/g, '""')}","${e.is_action_required ? "Yes" : "No"}"`)
      ].join("\n");
      zip.file("02_timeline.csv", csv);
    }

    // 4. Evidence index CSV
    if (evidence.length > 0) {
      const csv = ["File Name,Type,Date,Description,URL",
        ...evidence.map(ev => `"${ev.file_name}","${ev.file_type || ""}","${ev.event_date || ""}","${(ev.description || "").replace(/"/g, '""')}","${ev.file_url}"`)
      ].join("\n");
      zip.file("03_evidence_index.csv", csv);
    }

    // 5. README
    zip.file("README.txt", `CHAOS CONTROLLER™ — CASE EXPORT GUIDE
${"=".repeat(60)}
Ref: ${caseRef}
Generated: ${now}

CASE: "${caseItem.title}"
vs. ${caseItem.organisation_name || "Organisation"}

${"─".repeat(60)}
WHAT'S INCLUDED
${"─".repeat(60)}

1. CASE SUMMARY (01_case_summary.html)
    Professional HTML export matching standard correspondence:
    - White background with black text
    - Times New Roman font (10pt body, 12pt headings)
    - Section headers with underline separators
    - Clean data layout with labels and values
    - Complete timeline with dates and types
    - Evidence index with direct file URLs
    - All complaint letters in formatted sections
    - Print-ready with proper margins (1.5cm)

    2. LETTERS (letters/ folder)
    Individual HTML files for each generated letter:
    - Professional white background styling
    - Standard business letter formatting
    - Easy to print or convert to PDF

3. TIMELINE (02_timeline.csv)
    Chronological event log in CSV format:
    - Event dates, types, titles, descriptions
    - Action required flags
    - Sortable in Excel/Google Sheets

    4. EVIDENCE INDEX (03_evidence_index.csv)
    Complete document register:
    - File names, types, dates
    - Descriptions and direct URLs
    - Tag categories

    ${"─".repeat(60)}
    HOW TO USE
    ${"─".repeat(60)}

    1. Open 01_case_summary.html in any web browser
    2. Use browser's Print function (Ctrl/Cmd+P)
    3. Select "Save as PDF" for tribunal submissions
    4. Open individual letters from letters/ folder
    5. Use CSV files for data analysis in spreadsheets

    ${"─".repeat(60)}
    FORMATTING
    ${"─".repeat(60)}

    All exports feature:
    ✓ Professional white background with black text
    ✓ Times New Roman font (10pt body, 12pt headings)
    ✓ Clear section separators
    ✓ Standard business letter formatting
    ✓ Proper margins (1.5cm / 20mm)
    ✓ Print-ready for tribunal submissions

${"─".repeat(60)}
EXPORT COMPLETE
${"─".repeat(60)}

All documents formatted for tribunal submission.
Review and print as needed.
`);

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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => openPrintPreview(caseItem, evidence, events)}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">PDF Bundle</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportZip}
        disabled={exporting}
        className="gap-2"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export ZIP"}</span>
      </Button>
    </div>
  );
}