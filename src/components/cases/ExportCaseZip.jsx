import React, { useState } from "react";
import JSZip from "jszip";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { generateChaosDocumentPDF, downloadPDFBlob } from "@/lib/pdfGenerator";
import { toast } from "sonner";

// ── Letter definitions ────────────────────────────────────────────────────────
const LETTER_DEFS = [
  { field: "complaint_letter",   label: "Internal_Complaint",  title: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "Second_Complaint",    title: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "Final_Complaint",     title: "3rd and Final Complaint Letter" },
  { field: "letter_escalation",  label: "Escalation_Letter",   title: "Escalation Letter" },
  { field: "letter_accept_offer",label: "Accept_Offer",        title: "Acceptance of Settlement Offer" },
  { field: "letter_deny_offer",  label: "Deny_Offer",          title: "Rejection of Settlement Offer" },
];

const STATUS_LABELS = {
  draft: "Draft", complaint_sent: "Complaint Sent", awaiting_response: "Awaiting Response",
  response_received: "Response Received", escalation_ready: "Escalation Ready",
  escalated: "Escalated", resolved: "Resolved", closed: "Closed",
};

const STAGES = ["Draft","Complaint Sent","Awaiting Response","Response Received","Escalation Ready","Escalated","Resolved"];
const STATUS_INDEX = { draft:0,complaint_sent:1,awaiting_response:2,response_received:3,escalation_ready:4,escalated:5,resolved:6,closed:6 };

const NO_DATA = "No data recorded for this section.";

// ── PDF helpers ───────────────────────────────────────────────────────────────

async function makePDF(title, body) {
  const blob = await generateChaosDocumentPDF({
    documentType: "general",
    title,
    body,
    includeHeader: true,
    includeFooter: true,
  });
  if (!blob || blob.size === 0) throw new Error(`Empty PDF: ${title}`);
  return blob;
}

// ── Body builders — each returns a plain-text string ─────────────────────────

function buildDashboardBody(caseItem, evidence, events, deadlines) {
  const currentStageIndex = STATUS_INDEX[caseItem.status] ?? 0;

  // Matter strength
  let score = 0;
  const scoreLines = [];
  if (caseItem.issue_summary && caseItem.issue_details) { score += 20; scoreLines.push("YES - Issue documented"); } else { scoreLines.push("NO  - Issue not fully documented"); }
  if (caseItem.complaint_letter) { score += 20; scoreLines.push("YES - Complaint letter drafted"); } else { scoreLines.push("NO  - No complaint letter"); }
  if (evidence.length > 0) { score += 20; scoreLines.push(`YES - ${evidence.length} evidence file(s) uploaded`); } else { scoreLines.push("NO  - No evidence uploaded"); }
  if (events.length > 0) { score += 20; scoreLines.push("YES - Timeline recorded"); } else { scoreLines.push("N/A - No timeline events"); }
  const hasResponse = ["response_received","escalation_ready","escalated","resolved"].includes(caseItem.status);
  if (hasResponse) { score += 20; scoreLines.push("YES - Response received / escalated"); } else { scoreLines.push("N/A - Awaiting / no response yet"); }

  const upcoming = (deadlines || []).filter(d => d.status === "pending" && d.deadline_date)
    .sort((a,b) => new Date(a.deadline_date) - new Date(b.deadline_date)).slice(0,10);

  const lines = [
    `Case: ${caseItem.title || "-"}`,
    `Ref: CC-${caseItem.id.slice(0,8).toUpperCase()}`,
    `Generated: ${format(new Date(), "d MMMM yyyy")}`,
    "",
    "----------------------------------------",
    "CASE DETAILS",
    "----------------------------------------",
    `Organisation:      ${caseItem.organisation_name || "-"}`,
    `Category:          ${caseItem.category || "-"}`,
    `Status:            ${STATUS_LABELS[caseItem.status] || caseItem.status || "-"}`,
    `Priority:          ${(caseItem.priority || "-").toUpperCase()}`,
    `Account #:         ${caseItem.account_number || "-"}`,
    `Incident Date:     ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : "-"}`,
    `Escalation Body:   ${caseItem.escalation_body || "-"}`,
    "",
    "COMPLAINANT",
    `Name:    ${caseItem.complainant_name || "-"}`,
    `Address: ${caseItem.complainant_address || "-"}`,
    `Email:   ${caseItem.complainant_email || "-"}`,
    `Phone:   ${caseItem.complainant_phone || "-"}`,
    "",
    "----------------------------------------",
    "DISPUTE PROGRESS TRACKER",
    "----------------------------------------",
    ...STAGES.map((stage, i) => {
      const mark = i < currentStageIndex ? "[COMPLETE]" : i === currentStageIndex ? "[CURRENT] " : "[PENDING] ";
      return `  ${mark} ${stage}`;
    }),
    "",
    "----------------------------------------",
    "MATTER STRENGTH",
    "----------------------------------------",
    `Overall Score: ${score}%`,
    "",
    ...scoreLines,
    "",
    "----------------------------------------",
    "ISSUE SUMMARY",
    "----------------------------------------",
    caseItem.issue_summary || NO_DATA,
    "",
    "----------------------------------------",
    "DESIRED OUTCOME",
    "----------------------------------------",
    caseItem.desired_outcome || NO_DATA,
    "",
  ];

  if (upcoming.length > 0) {
    lines.push("----------------------------------------");
    lines.push("UPCOMING DEADLINES");
    lines.push("----------------------------------------");
    upcoming.forEach(d => {
      const daysLeft = differenceInDays(new Date(d.deadline_date), new Date());
      const tag = daysLeft < 0 ? `OVERDUE ${Math.abs(daysLeft)}d` : daysLeft === 0 ? "TODAY" : `${daysLeft}d remaining`;
      lines.push(`  ${d.title}`);
      lines.push(`    Due: ${format(new Date(d.deadline_date), "d MMM yyyy")} | ${tag}`);
    });
    lines.push("");
  }

  lines.push(`Evidence Files:     ${evidence.length}`);
  lines.push(`Timeline Events:    ${events.length}`);
  lines.push(`Total Deadlines:    ${(deadlines||[]).length}`);

  return lines.join("\n");
}

function buildAISummaryBody(raw) {
  if (!raw) return NO_DATA;
  let s;
  try {
    s = JSON.parse(raw);
    if (s?.response && typeof s.response === "object") s = s.response;
  } catch { return NO_DATA; }

  const isNew = !!(s?.case_overview || s?.facts || s?.issues_identified || s?.next_actions);
  if (isNew) {
    return [
      "CASE OVERVIEW", s.case_overview || "-", "",
      "ESTABLISHED FACTS", ...(s.facts||[]).map(f => `• ${f}`), "",
      "TIMELINE SUMMARY", s.timeline_summary || "-", "",
      "EVIDENCE SUMMARY", ...(s.evidence_summary||[]).map(e => `• ${e}`), "",
      "ISSUES IDENTIFIED", ...(s.issues_identified||[]).map(i => `• ${i}`), "",
      "CASE STRENGTHS", ...(s.strengths||[]).map(x => `• ${x}`), "",
      "WEAKNESSES / RISKS", ...(s.weaknesses||[]).map(x => `• ${x}`), "",
      "MISSING EVIDENCE", ...(s.missing_evidence?.length ? s.missing_evidence.map(x => `• ${x}`) : ["• None identified"]), "",
      "RECOMMENDED NEXT ACTIONS", ...(s.next_actions||[]).map(x => `• ${x}`), "",
      "ESCALATION PATH", s.escalation_path || "-",
    ].join("\n");
  }
  // Legacy schema
  return [
    "CASE OVERVIEW", s.summary || "-", "",
    "KEY ISSUES", ...(s.key_issues||[]).map(x => `• ${x}`), "",
    "EVIDENCE ANALYSIS", ...(s.evidence_analysis||[]).map(x => `• ${x}`), "",
    "CORRESPONDENCE SUMMARY", s.correspondence_summary || "-", "",
    "RECOMMENDED NEXT STEPS", ...(s.next_steps||[]).map(x => `• ${x}`), "",
    "CASE STRENGTH ASSESSMENT", s.case_strength_assessment || "-",
  ].join("\n");
}

function buildWeeklySnapshotBody(caseItem, evidence, events, deadlines) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
  const twoWeeksAhead = new Date(now.getTime() + 14*24*60*60*1000);
  const recent = events.filter(e => e.event_date && new Date(e.event_date) > weekAgo);
  const upcoming = deadlines.filter(d => d.deadline_date && new Date(d.deadline_date) > now && new Date(d.deadline_date) < twoWeeksAhead && d.status === "pending");
  const overdue = deadlines.filter(d => d.deadline_date && new Date(d.deadline_date) < now && d.status === "pending");

  const lines = [
    `Case: ${caseItem.title}`,
    `Organisation: ${caseItem.organisation_name || "-"}`,
    `Status: ${(caseItem.status||"").replace(/_/g," ").toUpperCase()}`,
    `Category: ${caseItem.category || "-"}`,
    `Generated: ${format(now, "d MMMM yyyy")}`,
    "",
    "----------------------------------------",
    "WEEKLY ACTIVITY SUMMARY",
    "----------------------------------------",
    `This Week:           ${recent.length} new events`,
    `Upcoming (14 days):  ${upcoming.length} deadlines`,
    `Overdue:             ${overdue.length} items`,
    `Total Evidence:      ${evidence.length} files`,
    `Total Timeline:      ${events.length} events`,
    "",
    "----------------------------------------",
    "RECENT ACTIVITY (LAST 7 DAYS)",
    "----------------------------------------",
    ...(recent.length > 0 ? recent.map(e => `[${e.event_date}] ${e.title}${e.description ? " - "+e.description : ""}`) : [NO_DATA]),
    "",
    "----------------------------------------",
    "UPCOMING DEADLINES (NEXT 14 DAYS)",
    "----------------------------------------",
    ...(upcoming.length > 0 ? upcoming.map(d => `${d.title} - Due: ${d.deadline_date}`) : [NO_DATA]),
    "",
    "----------------------------------------",
    "OVERDUE ITEMS",
    "----------------------------------------",
    ...(overdue.length > 0 ? overdue.map(d => `${d.title} - Was due: ${d.deadline_date} [OVERDUE]`) : ["No overdue items."]),
  ];
  return lines.join("\n");
}

function buildTimelineBody(events) {
  if (!events.length) return NO_DATA;
  const sorted = [...events].sort((a,b) => new Date(a.event_date||a.created_date) - new Date(b.event_date||b.created_date));
  return [
    `Total events: ${sorted.length}`,
    "",
    ...sorted.map(ev => {
      const d = ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "Undated";
      return `${d} -- [${(ev.event_type||"").replace(/_/g," ").toUpperCase()}] ${ev.title}${ev.description ? "\n  "+ev.description : ""}`;
    })
  ].join("\n");
}

function buildDeadlinesBody(deadlines) {
  if (!deadlines.length) return NO_DATA;
  const sorted = [...deadlines].sort((a,b) => new Date(a.deadline_date||0) - new Date(b.deadline_date||0));
  return [
    `Total deadlines: ${sorted.length}`,
    "",
    ...sorted.map(d => {
      const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), new Date()) : null;
      const tag = daysLeft === null ? "No date" : daysLeft < 0 ? `OVERDUE by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? "DUE TODAY" : `${daysLeft} days remaining`;
      return `${d.title}\n  Due: ${d.deadline_date ? format(new Date(d.deadline_date),"d MMM yyyy") : "-"} | ${tag}\n  Type: ${(d.deadline_type||"").replace(/_/g," ")} | Status: ${(d.status||"").toUpperCase()}${d.notes ? "\n  Notes: "+d.notes : ""}`;
    })
  ].join("\n\n");
}

function buildChecklistBody(items) {
  if (!items.length) return NO_DATA;
  return [
    `Total items: ${items.length}`,
    `Complete: ${items.filter(i => i.status === "complete").length}`,
    `Missing: ${items.filter(i => i.status !== "complete").length}`,
    "",
    ...items.map(item => {
      const tick = item.status === "complete" ? "[x]" : "[ ]";
      const pri = (item.priority || "medium").toUpperCase();
      return `${tick} [${pri}] ${item.label}\n  Category: ${(item.category||"").replace(/_/g," ")} | Status: ${(item.status||"").toUpperCase()}${item.notes ? "\n  "+item.notes : ""}`;
    })
  ].join("\n\n");
}

function buildEvidenceIndexBody(evidence) {
  if (!evidence.length) return NO_DATA;
  const sorted = [...evidence].sort((a,b) => new Date(a.event_date||a.created_date) - new Date(b.event_date||b.created_date));
  return [
    `Total files: ${sorted.length}`,
    "",
    ...sorted.map((ev, i) => {
      const d = ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "No date";
      return `${i+1}. ${ev.file_name}\n  Type: ${(ev.file_type||"").replace(/_/g," ")} | Date: ${d}\n  ${ev.description || ev.extracted_data?.document_summary || "-"}`;
    })
  ].join("\n\n");
}

function buildUploadedDocsIndexBody(evidence) {
  if (!evidence.length) return NO_DATA;
  const sorted = [...evidence].sort((a,b) => new Date(a.created_date) - new Date(b.created_date));
  return [
    `Total uploaded documents: ${sorted.length}`,
    "",
    ...sorted.map((ev, i) => {
      return `${i+1}. ${ev.file_name}\n  Uploaded: ${ev.created_date ? format(new Date(ev.created_date), "d MMM yyyy") : "-"}\n  URL: ${ev.file_url || "-"}${ev.drive_backup_url ? "\n  Drive Backup: "+ev.drive_backup_url : ""}`;
    })
  ].join("\n\n");
}

function buildOCRBody(evidence) {
  const scanned = evidence.filter(ev => ev.scan_status === "complete" && ev.extracted_data);
  if (!scanned.length) return NO_DATA;
  return scanned.map((ev, i) => {
    const d = ev.extracted_data;
    const lines = [
      `${i+1}. ${ev.file_name}`,
      `  Document Summary: ${d.document_summary || "-"}`,
    ];
    if (d.merchant_name) lines.push(`  Organisation Detected: ${d.merchant_name}`);
    if (d.dates_mentioned?.length) lines.push(`  Dates Detected: ${d.dates_mentioned.join(", ")}`);
    if (d.key_amounts?.length) lines.push(`  Key Amounts: ${d.key_amounts.join(", ")}`);
    if (d.account_numbers?.length) lines.push(`  Account Numbers: ${d.account_numbers.join(", ")}`);
    if (ev.extracted_text) lines.push(`  Extracted Text (first 500 chars):\n  ${ev.extracted_text.slice(0,500).replace(/\n/g,"\n  ")}`);
    return lines.join("\n");
  }).join("\n\n----------------------------------------\n\n");
}

function buildReadme(caseItem, filesIncluded) {
  const caseRef = `CC-${caseItem.id.slice(0,8).toUpperCase()}`;
  const now = new Date().toLocaleString("en-AU");
  return [
    `CASE EXPORT — ${caseItem.title}`,
    `Ref: ${caseRef}`,
    `Generated: ${now}`,
    `vs. ${caseItem.organisation_name || "Organisation"}`,
    "",
    "=".repeat(60),
    "FILES INCLUDED IN THIS EXPORT",
    "=".repeat(60),
    "",
    ...filesIncluded.map(f => `  ${f}`),
    "",
    "=".repeat(60),
    "HOW TO USE",
    "=".repeat(60),
    "",
    "1. Open PDF files in any PDF viewer.",
    "2. Use 01_Dashboard_Report.pdf for a full case overview.",
    "3. Use 09_Letters/ folder for individual formal letters.",
    "4. Submit 02_AI_Case_Assessment.pdf to tribunal as evidence of analysis.",
    "5. 10_OCR_Text_Summary.pdf contains AI-extracted text from scanned documents.",
    "",
    "All PDFs are formatted for tribunal submission (A4, Times New Roman).",
    "",
    "=".repeat(60),
    "EXPORT COMPLETE",
    "=".repeat(60),
  ].join("\n");
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExportCaseZip({ caseItem, evidence = [], events = [] }) {
  const [exporting, setExporting] = useState(false);

  const handleExportZip = async () => {
    setExporting(true);
    toast.info("Building complete case export — this may take 30–60 seconds...", { duration: 8000 });

    try {
      // Fetch data not passed as props
      const [deadlines, checklistItems] = await Promise.all([
        base44.entities.Deadline.filter({ case_id: caseItem.id }).catch(() => []),
        base44.entities.ChecklistItem.filter({ case_id: caseItem.id }).catch(() => []),
      ]);

      const zip = new JSZip();
      const lettersFolder = zip.folder("09_Letters");
      const filesIncluded = [];

      // 01 — Dashboard Report
      try {
        const body = buildDashboardBody(caseItem, evidence, events, deadlines);
        const blob = await makePDF("Case Dashboard Report", body);
        zip.file("01_Dashboard_Report.pdf", blob);
        filesIncluded.push("01_Dashboard_Report.pdf — Case details, progress tracker, matter strength, deadlines");
      } catch (err) { console.error("[ZIP] 01 Dashboard failed:", err); }

      // 02 — AI Case Assessment
      try {
        const body = buildAISummaryBody(caseItem.executive_summary);
        const blob = await makePDF("AI Case Assessment", body);
        zip.file("02_AI_Case_Assessment.pdf", blob);
        filesIncluded.push("02_AI_Case_Assessment.pdf — 10-section AI analysis (generate in Summary tab first)");
      } catch (err) { console.error("[ZIP] 02 AI Summary failed:", err); }

      // 03 — Weekly Case Snapshot
      try {
        const body = buildWeeklySnapshotBody(caseItem, evidence, events, deadlines);
        const blob = await makePDF("Weekly Case Snapshot", body);
        zip.file("03_Weekly_Case_Snapshot.pdf", blob);
        filesIncluded.push("03_Weekly_Case_Snapshot.pdf — Weekly activity summary and upcoming actions");
      } catch (err) { console.error("[ZIP] 03 Snapshot failed:", err); }

      // 04 — Timeline
      try {
        const body = buildTimelineBody(events);
        const blob = await makePDF("Case Timeline", body);
        zip.file("04_Timeline.pdf", blob);
        filesIncluded.push("04_Timeline.pdf — Chronological event log");
      } catch (err) { console.error("[ZIP] 04 Timeline failed:", err); }

      // 05 — Deadlines
      try {
        const body = buildDeadlinesBody(deadlines);
        const blob = await makePDF("Deadline War Room", body);
        zip.file("05_Deadlines.pdf", blob);
        filesIncluded.push("05_Deadlines.pdf — All deadlines with urgency status");
      } catch (err) { console.error("[ZIP] 05 Deadlines failed:", err); }

      // 06 — Checklist
      try {
        const body = buildChecklistBody(checklistItems);
        const blob = await makePDF("Smart Checklist", body);
        zip.file("06_Checklist.pdf", blob);
        filesIncluded.push("06_Checklist.pdf — Action checklist with priority and status");
      } catch (err) { console.error("[ZIP] 06 Checklist failed:", err); }

      // 07 — Evidence Index
      try {
        const body = buildEvidenceIndexBody(evidence);
        const blob = await makePDF("Evidence Index", body);
        zip.file("07_Evidence_Index.pdf", blob);
        filesIncluded.push("07_Evidence_Index.pdf — Indexed list of all evidence files with descriptions");
      } catch (err) { console.error("[ZIP] 07 Evidence failed:", err); }

      // 08 — Uploaded Documents Index (with URLs)
      try {
        const body = buildUploadedDocsIndexBody(evidence);
        const blob = await makePDF("Uploaded Documents Index", body);
        zip.file("08_Uploaded_Documents_Index.pdf", blob);
        filesIncluded.push("08_Uploaded_Documents_Index.pdf — File names, upload dates, and direct URLs");
      } catch (err) { console.error("[ZIP] 08 Docs Index failed:", err); }

      // 09 — Letters folder
      const letterFilesIncluded = [];
      for (const ld of LETTER_DEFS) {
        const content = caseItem[ld.field];
        const pdfLabel = `09_Letters/${ld.label}.pdf`;
        try {
          const body = content && content.trim()
            ? String(content).replace(/<[^>]*>/g, "").trim()
            : `No data recorded for this section.\n\nThis letter has not been generated yet.\nGo to the Letters tab in the case to generate ${ld.title}.`;
          const blob = await makePDF(ld.title, body);
          lettersFolder.file(`${ld.label}.pdf`, blob);
          letterFilesIncluded.push(pdfLabel);
        } catch (err) { console.error(`[ZIP] Letter ${ld.label} failed:`, err); }
      }
      filesIncluded.push(...letterFilesIncluded.map(f => `${f} — Formal letter`));

      // 10 — OCR Text Summary
      try {
        const body = buildOCRBody(evidence);
        const blob = await makePDF("OCR Text Summary", body);
        zip.file("10_OCR_Text_Summary.pdf", blob);
        filesIncluded.push("10_OCR_Text_Summary.pdf — AI-extracted text, dates, organisations from scanned documents");
      } catch (err) { console.error("[ZIP] 10 OCR failed:", err); }

      // 11 — README
      zip.file("11_README.txt", buildReadme(caseItem, filesIncluded));
      filesIncluded.push("11_README.txt — This file");

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const safeName = (caseItem.title || "case").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_complete_export_${format(new Date(), "yyyy-MM-dd")}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Complete case export downloaded — ${filesIncluded.length} files`);
    } catch (err) {
      console.error("[ZIP] Export failed:", err);
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
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
  );
}