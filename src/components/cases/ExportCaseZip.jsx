import React, { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { LETTERHEAD_URL, CONTINUATION_PAGE_URL, getLetterPageStyles } from "./LetterheadBanner";

const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

function buildSummaryText(caseItem, evidence, events) {
  const sorted = [...events].sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""));
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;

  let txt = `CHAOS CONTROLLER™ — CASE EXPORT\nGenerated: ${new Date().toLocaleString("en-AU")}\nRef: ${caseRef}\n${"=".repeat(60)}\n\n`;
  txt += `CASE DETAILS\n${"─".repeat(60)}\n`;
  txt += `Title:           ${caseItem.title || "N/A"}\n`;
  txt += `Category:        ${caseItem.category || "N/A"}\n`;
  txt += `Status:          ${caseItem.status || "N/A"}\n`;
  txt += `Priority:        ${caseItem.priority || "N/A"}\n`;
  txt += `Organisation:    ${caseItem.organisation_name || "N/A"}\n`;
  txt += `Account No:      ${caseItem.account_number || "N/A"}\n`;
  txt += `Incident Date:   ${caseItem.incident_date || "N/A"}\n`;
  txt += `Response Due:    ${caseItem.response_deadline || "N/A"}\n`;
  txt += `Escalation Body: ${caseItem.escalation_body || "N/A"}\n\n`;
  txt += `COMPLAINANT\n${"─".repeat(60)}\n`;
  txt += `Name:    ${caseItem.complainant_name || "N/A"}\n`;
  txt += `Address: ${caseItem.complainant_address || "N/A"}\n`;
  txt += `Email:   ${caseItem.complainant_email || "N/A"}\n`;
  txt += `Phone:   ${caseItem.complainant_phone || "N/A"}\n\n`;
  txt += `ISSUE SUMMARY\n${"─".repeat(60)}\n${caseItem.issue_summary || "N/A"}\n\n`;
  txt += `ISSUE DETAILS\n${"─".repeat(60)}\n${caseItem.issue_details || "N/A"}\n\n`;
  txt += `DESIRED OUTCOME\n${"─".repeat(60)}\n${caseItem.desired_outcome || "N/A"}\n\n`;

  if (sorted.length > 0) {
    txt += `TIMELINE (${sorted.length} events)\n${"─".repeat(60)}\n`;
    sorted.forEach((e, i) => {
      txt += `${i + 1}. [${e.event_date || "No date"}] ${e.title}\n   Type: ${e.event_type || "N/A"}\n`;
      if (e.description) txt += `   ${e.description}\n`;
      txt += "\n";
    });
  }

  if (evidence.length > 0) {
    txt += `EVIDENCE INDEX (${evidence.length} files)\n${"─".repeat(60)}\n`;
    evidence.forEach((ev, i) => {
      txt += `${i + 1}. ${ev.file_name} [${ev.file_type || "N/A"}]`;
      if (ev.event_date) txt += ` — ${ev.event_date}`;
      if (ev.description) txt += `\n   ${ev.description}`;
      txt += `\n   URL: ${ev.file_url}\n\n`;
    });
  }

  LETTER_DEFS.forEach(ld => {
    if (caseItem[ld.field]) {
      txt += `${ld.label.toUpperCase()}\n${"─".repeat(60)}\n${caseItem[ld.field]}\n\n`;
    }
  });

  return txt;
}

function openPrintPreview(caseItem, evidence, events) {
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const today = format(new Date(), "d MMMM yyyy");
  const sorted = [...events].sort((a, b) => new Date(a.event_date || 0) - new Date(b.event_date || 0));
  const presentLetters = LETTER_DEFS.filter(ld => caseItem[ld.field]);

  const tocSections = [
    { num: 1, title: "Case Summary", sub: "Parties, incident details & desired outcome" },
    { num: 2, title: "Chronological Timeline", sub: `${events.length} recorded events` },
    { num: 3, title: "Evidence Index", sub: `${evidence.length} documents on file` },
    ...presentLetters.map((ld, i) => ({ num: 4 + i, title: ld.label, sub: "Formal correspondence" })),
  ];

  const sectionHeader = (num, title) => `
    <div style="background:#1a1a2e;color:white;padding:10pt 18pt;margin-bottom:16pt;border-left:5px solid #FFD700;">
      <div style="font-size:9pt;color:#FFD700;letter-spacing:2px;text-transform:uppercase;margin-bottom:2pt;">Section ${num}</div>
      <div style="font-size:15pt;font-weight:bold;">${title}</div>
    </div>`;

  const foot = () => `<div style="position:fixed;bottom:0;left:0;right:0;font-size:8pt;color:#888;text-align:center;padding:4pt 0;border-top:1px solid #ddd;">
    www.chaoscontroller.com.au | ${caseRef} | ${today}
  </div>`;

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Case Bundle — ${caseItem.title}</title>
    <style>
      ${getLetterPageStyles()}
      body { font-family:'Times New Roman',Times,serif; font-size:11pt; color:#111; line-height:1.6; margin:0; padding:0; }
      .cover-page { width:210mm; min-height:297mm; page-break-after:always; background-image:url('${LETTERHEAD_URL}'); background-size:100% 100%; background-repeat:no-repeat; }
      .toc-page { width:210mm; min-height:297mm; page-break-after:always; background-image:url('${CONTINUATION_PAGE_URL}'); background-size:100% 100%; background-repeat:no-repeat; }
      .section-page { width:210mm; min-height:297mm; page-break-before:always; background-image:url('${CONTINUATION_PAGE_URL}'); background-size:100% 100%; background-repeat:no-repeat; }
      .cover-body { padding:76mm 22mm 38mm 22mm; }
      .page-body { padding:38mm 22mm 32mm 22mm; }
      table { width:100%; border-collapse:collapse; font-size:10.5pt; margin-top:8pt; }
      th { background:#f4f4f4; text-align:left; padding:5pt 8pt; font-weight:bold; border-bottom:2px solid #ddd; }
      td { padding:4.5pt 8pt; border-bottom:1px solid #eee; vertical-align:top; }
      pre { white-space:pre-wrap; font-family:'Times New Roman',Times,serif; font-size:10.5pt; line-height:1.6; margin:0; }
      .toc-row { display:flex; align-items:baseline; padding:7pt 0; border-bottom:1px dotted #ccc; }
      .toc-num { font-weight:bold; color:#1a1a2e; min-width:28pt; font-size:11pt; }
      .toc-title { font-size:11pt; font-weight:bold; flex:1; }
      .toc-sub { font-size:9pt; color:#666; margin-top:1pt; }
      @media print { @page { margin:0; } }
    </style>
  </head><body>

  <!-- COVER -->
  <div class="cover-page">
    <div class="cover-body">
      <div style="font-size:9pt;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:12pt;">Chaos Controller™ — Formal Case Bundle</div>
      <div style="border-left:5px solid #1a1a2e;padding-left:14pt;margin-bottom:20pt;">
        <div style="font-size:22pt;font-weight:bold;line-height:1.2;margin-bottom:6pt;">${caseItem.title}</div>
        <div style="font-size:13pt;color:#444;font-style:italic;">vs. ${caseItem.organisation_name || "Organisation"}</div>
      </div>
      <table style="margin-bottom:16pt;">
        ${[
          ["Case Reference", caseRef],
          ["Complainant", caseItem.complainant_name],
          ["Organisation", caseItem.organisation_name],
          ["Category", caseItem.category],
          ["Status", (caseItem.status || "").replace(/_/g, " ").toUpperCase()],
          ["Incident Date", caseItem.incident_date],
          ["Response Deadline", caseItem.response_deadline],
          ["Generated", today],
        ].filter(r => r[1]).map(r => `<tr><td style="border:none;padding:2pt 12pt 2pt 0;color:#666;font-style:italic;width:35%;">${r[0]}</td><td style="border:none;font-weight:bold;">${r[1]}</td></tr>`).join("")}
      </table>
      ${caseItem.issue_summary ? `<div style="margin-bottom:12pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Issue Summary</div><div>${caseItem.issue_summary}</div></div>` : ""}
      ${caseItem.desired_outcome ? `<div><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Desired Outcome</div><div>${caseItem.desired_outcome}</div></div>` : ""}
    </div>
  </div>

  <!-- TOC -->
  <div class="toc-page">
    <div class="page-body">
      <div style="font-size:18pt;font-weight:bold;margin-bottom:4pt;">Table of Contents</div>
      <div style="font-size:10pt;color:#888;margin-bottom:20pt;">${caseItem.title} — ${today}</div>
      ${tocSections.map(s => `
        <div class="toc-row">
          <div class="toc-num">${s.num}.</div>
          <div style="flex:1;">
            <div class="toc-title">${s.title}</div>
            <div class="toc-sub">${s.sub}</div>
          </div>
        </div>`).join("")}
    </div>
  </div>

  <!-- SECTION 1: SUMMARY -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(1, "Case Summary")}
      <table><tbody>
        ${[
          ["Complainant Name", caseItem.complainant_name],
          ["Complainant Address", caseItem.complainant_address],
          ["Complainant Email", caseItem.complainant_email],
          ["Complainant Phone", caseItem.complainant_phone],
          ["Organisation", caseItem.organisation_name],
          ["Complaints Email", caseItem.organisation_complaints_email],
          ["Account / Reference No.", caseItem.account_number],
          ["Category", caseItem.category],
          ["Incident Date", caseItem.incident_date],
          ["Status", (caseItem.status || "").replace(/_/g, " ").toUpperCase()],
          ["Priority", (caseItem.priority || "").toUpperCase()],
          ["Response Deadline", caseItem.response_deadline],
          ["Escalation Body", caseItem.escalation_body],
        ].filter(r => r[1]).map(r => `<tr><td style="color:#666;font-style:italic;width:35%;">${r[0]}</td><td style="font-weight:bold;">${r[1]}</td></tr>`).join("")}
      </tbody></table>
      ${caseItem.issue_summary ? `<div style="margin-top:14pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Issue Summary</div><div>${caseItem.issue_summary}</div></div>` : ""}
      ${caseItem.desired_outcome ? `<div style="margin-top:10pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Desired Outcome</div><div>${caseItem.desired_outcome}</div></div>` : ""}
      ${caseItem.issue_details ? `<div style="margin-top:10pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Full Details</div><div>${caseItem.issue_details}</div></div>` : ""}
    </div>
  </div>

  <!-- SECTION 2: TIMELINE -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(2, "Chronological Timeline")}
      ${sorted.length === 0 ? `<p style="color:#888;">No timeline events recorded.</p>` : `
      <table>
        <thead><tr><th style="width:80pt;">Date</th><th style="width:90pt;">Type</th><th>Event</th><th>Details</th></tr></thead>
        <tbody>${sorted.map(ev => `<tr>
          <td style="white-space:nowrap;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
          <td style="text-transform:capitalize;">${(ev.event_type || "").replace(/_/g, " ")}</td>
          <td style="font-weight:bold;">${ev.title}</td>
          <td style="color:#555;">${ev.description || ""}</td>
        </tr>`).join("")}</tbody>
      </table>`}
    </div>
  </div>

  <!-- SECTION 3: EVIDENCE -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(3, "Evidence Index")}
      <p style="font-size:10pt;color:#555;margin-bottom:10pt;">Total documents on file: <strong>${evidence.length}</strong></p>
      ${evidence.length === 0 ? `<p style="color:#888;">No evidence uploaded.</p>` : `
      <table>
        <thead><tr><th style="width:22pt;">#</th><th>File Name</th><th style="width:90pt;">Type</th><th style="width:80pt;">Date</th><th>Description</th></tr></thead>
        <tbody>${evidence.map((ev, i) => `<tr>
          <td style="font-weight:bold;text-align:center;">${i + 1}</td>
          <td style="font-weight:bold;word-break:break-word;">${ev.file_name}</td>
          <td style="text-transform:capitalize;">${(ev.file_type || "").replace(/_/g, " ")}</td>
          <td>${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
          <td style="color:#555;">${ev.description || "—"}</td>
        </tr>`).join("")}</tbody>
      </table>`}
    </div>
  </div>

  <!-- LETTER SECTIONS -->
  ${presentLetters.map((ld, idx) => `
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(4 + idx, ld.label)}
      <pre>${caseItem[ld.field]}</pre>
    </div>
  </div>`).join("")}

  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

export default function ExportCaseZip({ caseItem, evidence = [], events = [] }) {
  const [exporting, setExporting] = useState(false);

  const handleExportZip = async () => {
    setExporting(true);
    const zip = new JSZip();
    const safeName = (caseItem.title || "case").replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // 1. Full text summary
    zip.file("01_case_summary.txt", buildSummaryText(caseItem, evidence, events));

    // 2. Individual letters
    const lettersFolder = zip.folder("letters");
    LETTER_DEFS.forEach((ld, i) => {
      if (caseItem[ld.field]) {
        lettersFolder.file(`${i + 1}_${ld.label.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`, caseItem[ld.field]);
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
    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
    zip.file("README.txt", `Chaos Controller™ Case Export\nRef: ${caseRef}\nGenerated: ${new Date().toLocaleString("en-AU")}\n\nThis ZIP contains all case documents, letters, timeline, and evidence index for:\n"${caseItem.title}"\n\nFor the formatted PDF bundle, use the Print/PDF option on the case page.`);

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