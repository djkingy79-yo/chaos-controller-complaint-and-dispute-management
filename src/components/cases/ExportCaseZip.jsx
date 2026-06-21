import React, { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { generateChaosDocumentPDF, downloadPDFBlob } from "@/lib/pdfGenerator";
import { toast } from "sonner";

const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

function buildSummaryText(caseItem, evidence, events) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0));
  const lines = [
    `CASE EXPORT — ${caseItem.title}`,
    `Ref: CC-${caseItem.id.slice(0, 8).toUpperCase()}`,
    '',
    'CASE DETAILS',
    `Organisation: ${caseItem.organisation_name || '—'}`,
    `Category: ${caseItem.category || '—'}`,
    `Status: ${(caseItem.status || '').replace(/_/g, ' ').toUpperCase()}`,
    `Priority: ${(caseItem.priority || '').toUpperCase()}`,
    `Account: ${caseItem.account_number || '—'}`,
    `Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), 'd MMMM yyyy') : '—'}`,
    '',
    'COMPLAINANT',
    `Name: ${caseItem.complainant_name || '—'}`,
    `Address: ${caseItem.complainant_address || '—'}`,
    `Email: ${caseItem.complainant_email || '—'}`,
    `Phone: ${caseItem.complainant_phone || '—'}`,
    '',
    'ISSUE SUMMARY',
    caseItem.issue_summary || '—',
    '',
    'DESIRED OUTCOME',
    caseItem.desired_outcome || '—',
  ];

  if (sorted.length > 0) {
    lines.push('', `TIMELINE (${sorted.length} events)`);
    sorted.forEach(ev => {
      const d = ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'Undated';
      lines.push(`${d} — [${(ev.event_type || '').replace(/_/g, ' ')}] ${ev.title}`);
      if (ev.description) lines.push(`  ${ev.description}`);
    });
  }

  if (evidence.length > 0) {
    lines.push('', `EVIDENCE INDEX (${evidence.length} files)`);
    evidence.forEach((ev, i) => {
      const d = ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : '—';
      lines.push(`${i + 1}. ${ev.file_name} [${(ev.file_type || '').replace(/_/g, ' ')}] ${d}`);
      if (ev.description) lines.push(`   ${ev.description}`);
    });
  }

  return lines.join('\n');
}

async function downloadBundlePDF(caseItem, evidence, events) {
  const body = buildSummaryText(caseItem, evidence, events);
  const blob = await generateChaosDocumentPDF({
    documentType: 'general',
    title: 'Case Export Bundle',
    matter: caseItem.title,
    date: format(new Date(), 'd MMMM yyyy'),
    body,
    includeHeader: true,
    includeFooter: true,
  });
  if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
  downloadPDFBlob(blob, `Case_Export_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  if (blob._warnings?.length) toast.warning('PDF generated but branding image failed to load.');
  else toast.success('Case bundle PDF downloaded');
}

// Helper to generate letter PDF blob using unified generator
async function generateLetterPDF(title, content) {
  const cleanContent = content.replace(/<[^>]*>/g, '');
  return await generateChaosDocumentPDF({
    documentType: 'letter',
    title: title,
    body: cleanContent,
    includeHeader: true,
    includeFooter: true,
  });
}

export default function ExportCaseZip({ caseItem, evidence = [], events = [] }) {
  const [exporting, setExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleExportZip = async () => {
    setExporting(true);
    const zip = new JSZip();
    const safeName = (caseItem.title || "case").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
    const now = new Date().toLocaleString("en-AU");

    console.log('[ExportZIP] Starting export...');

    // 1. Text summary
    zip.file("01_case_summary.txt", buildSummaryText(caseItem, evidence, events));

    // 2. Individual letters as PDF (using unified generator)
    const lettersFolder = zip.folder("letters");
    for (const ld of LETTER_DEFS) {
      if (caseItem[ld.field]) {
        try {
          console.log('[ExportZIP] Generating PDF for:', ld.label);
          const pdfBlob = await generateLetterPDF(ld.label, caseItem[ld.field]);
          const safeLabel = ld.label.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          lettersFolder.file(`${safeLabel}.pdf`, pdfBlob);
        } catch (err) {
          console.error('[ExportZIP] Letter PDF failed:', ld.label, err);
        }
      }
    }

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

  const handleBundlePDF = async () => {
    setPdfExporting(true);
    try {
      await downloadBundlePDF(caseItem, evidence, events);
    } catch (error) {
      console.error('Bundle PDF failed:', error);
      alert('PDF failed: ' + error.message);
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBundlePDF}
        disabled={pdfExporting}
        className="gap-2"
      >
        {pdfExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="hidden sm:inline">{pdfExporting ? 'Generating...' : 'PDF Bundle'}</span>
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