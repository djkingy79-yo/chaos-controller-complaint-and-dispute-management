import React, { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { LETTERHEAD_URL, CONTINUATION_PAGE_URL } from "./LetterheadBanner";

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
  const today = format(new Date(), "d MMMM yyyy");
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return `<!DOCTYPE html><html><head>
    <title>Case Export — ${caseItem.title}</title>
    <style>
      @page { margin: 0; size: A4; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      body { margin: 0; padding: 20mm; background: #000; font-family: 'Courier New', Courier, monospace; font-size: 10pt; color: #A0A0A0; line-height: 1.6; }
      .header { font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 1px solid #A0A0A0; }
      .section { margin-top: 20pt; }
      .section-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 8pt; padding-bottom: 4pt; border-bottom: 1px solid #A0A0A0; }
      .data-row { margin-bottom: 4pt; }
      .data-label { display: inline-block; width: 140pt; color: #A0A0A0; }
      .data-value { color: #E0E0E0; font-weight: bold; }
      .timeline-item { margin-bottom: 12pt; }
      .timeline-date { color: #E0E0E0; font-weight: bold; }
      .timeline-type { color: #888; font-size: 9pt; margin-top: 2pt; }
      .evidence-item { margin-bottom: 12pt; }
      .evidence-name { color: #E0E0E0; font-weight: bold; }
      .evidence-type { color: #888; }
      .evidence-url { color: #666; font-size: 9pt; margin-top: 2pt; word-break: break-all; }
      .letter-section { margin-top: 24pt; page-break-before: always; }
      .letter-content { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #E0E0E0; margin-top: 8pt; }
      .footer { margin-top: 30pt; padding-top: 8pt; border-top: 1px solid #A0A0A0; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
    </style>
  </head><body>
    
    <div class="header">
      <div>CHAOS CONTROLLER™ — CASE EXPORT</div>
      <div>Generated: ${now}</div>
      <div>Ref: ${caseRef}</div>
    </div>

    <div class="section">
      <div class="section-title">Case Details</div>
      <div class="data-row"><span class="data-label">Title:</span><span class="data-value">${caseItem.title || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Category:</span><span class="data-value">${caseItem.category || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Status:</span><span class="data-value">${caseItem.status || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Priority:</span><span class="data-value">${caseItem.priority || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Organisation:</span><span class="data-value">${caseItem.organisation_name || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Account No:</span><span class="data-value">${caseItem.account_number || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Incident Date:</span><span class="data-value">${caseItem.incident_date || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Response Due:</span><span class="data-value">${caseItem.response_deadline || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Escalation Body:</span><span class="data-value">${caseItem.escalation_body || "N/A"}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Complainant</div>
      <div class="data-row"><span class="data-label">Name:</span><span class="data-value">${caseItem.complainant_name || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Address:</span><span class="data-value">${caseItem.complainant_address || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Email:</span><span class="data-value">${caseItem.complainant_email || "N/A"}</span></div>
      <div class="data-row"><span class="data-label">Phone:</span><span class="data-value">${caseItem.complainant_phone || "N/A"}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Issue Summary</div>
      <div style="color: #E0E0E0; margin-top: 6pt;">${caseItem.issue_summary || "N/A"}</div>
    </div>

    <div class="section">
      <div class="section-title">Issue Details</div>
      <div style="color: #E0E0E0; margin-top: 6pt;">${caseItem.issue_details || "N/A"}</div>
    </div>

    <div class="section">
      <div class="section-title">Desired Outcome</div>
      <div style="color: #E0E0E0; margin-top: 6pt;">${caseItem.desired_outcome || "N/A"}</div>
    </div>

    ${sorted.length > 0 ? `
    <div class="section">
      <div class="section-title">Timeline (${sorted.length} events)</div>
      ${sorted.map((e, i) => `
        <div class="timeline-item">
          <div class="timeline-date">${i + 1}. [${e.event_date ? format(new Date(e.event_date), "yyyy-MM-dd") : "No date"}] ${e.title}</div>
          <div class="timeline-type">Type: ${e.event_type || "N/A"}</div>
          ${e.description ? `<div style="color: #888; margin-top: 2pt;">${e.description}</div>` : ""}
        </div>`).join("")}
    </div>` : ""}

    ${evidence.length > 0 ? `
    <div class="section">
      <div class="section-title">Evidence Index (${evidence.length} files)</div>
      ${evidence.map((ev, i) => `
        <div class="evidence-item">
          <div class="evidence-name">${i + 1}. ${ev.file_name} <span class="evidence-type">[${ev.file_type || "other"}]</span></div>
          <div class="evidence-url">URL: ${ev.file_url}</div>
        </div>`).join("")}
    </div>` : ""}

    ${LETTER_DEFS.filter(ld => caseItem[ld.field]).map((ld, idx) => `
    <div class="letter-section">
      <div class="section-title">${ld.label}</div>
      <div class="letter-content">${caseItem[ld.field]}</div>
    </div>`).join("")}

    <div class="footer">
      <span>Chaos Controller™ — chaoscontroller.com.au</span>
      <span>${caseRef} · Page 1</span>
    </div>

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
        const letterHTML = `<!DOCTYPE html><html><head><title>${ld.label}</title>
        <style>
          body { margin: 0; padding: 20mm; background: #000; font-family: 'Courier New', Courier, monospace; font-size: 10pt; color: #A0A0A0; }
          .header { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 1px solid #A0A0A0; }
          .content { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #E0E0E0; line-height: 1.6; }
        </style>
        </head><body>
          <div class="header">${ld.label}</div>
          <div class="content">${caseItem[ld.field]}</div>
        </body></html>`;
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
   Professional HTML export matching PDF bundle style:
   - Dark theme (#000 background, #A0A0A0 text)
   - Monospace font (Courier New, 10pt)
   - Section headers with underline separators
   - 12pt headings, 10pt body text
   - Clean data layout with labels and values
   - Complete timeline with dates and types
   - Evidence index with direct file URLs
   - All complaint letters in formatted sections

2. LETTERS (letters/ folder)
   Individual HTML files for each generated letter:
   - Same dark theme styling
   - Professional formatting preserved
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
✓ Professional dark theme (black background, light text)
✓ Monospace font for data (Courier New, 10pt)
✓ Clear section separators
✓ 12pt headings, 10pt body text
✓ Proper spacing and margins
✓ Print-ready formatting

${"─".repeat(60)}
CONTACT & SUPPORT
${"─".repeat(60)}

Chaos Controller™
chaoscontroller.com.au
The Complaint & Dispute App THAT'S GOT YOUR BACK

"They had your loyalty. Now you deserve their accountability."
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