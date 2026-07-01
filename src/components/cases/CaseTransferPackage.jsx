import React, { useState } from "react";
import JSZip from "jszip";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ReportDocument from "@/components/reports/ReportDocument";
import LetterDocument from "@/components/letters/LetterDocument";
import { renderDocToBlob } from "@/lib/renderDocToBlob";
import { buildLetterHeaderData } from "@/components/cases/LetterHeader.jsx";
import { LETTER_FIELD_MAP, LETTER_LABELS, getLetterReSubject } from "@/lib/disputeStageLogic";
import { scoreFromCase } from "@/components/cases/ChaosScore";
import { buildSections as buildCompleteCaseReportSections } from "@/components/cases/CaseDashboardReport";
import { buildSummarySections as buildAiAnalysisSections } from "@/components/cases/ExecutiveSummaryGenerator";
import {
  buildReadMeSections, buildTimelineSections, buildWeeklySnapshotSections,
  buildDeadlinesSections, buildMerchantResponsesSections, buildEvidenceIndexSections,
  buildEmailCorrespondenceSections, buildNotesSections, buildContactsSections,
  buildAuditTrailSections, buildLegislationSections, buildStatisticsSections,
} from "@/lib/caseTransferSections";

function sanitize(part) {
  return String(part || "").replace(/[\\/:*?"<>|]/g, "").trim();
}

/**
 * CASE TRANSFER PACKAGE — the ONE export for a case.
 * Every PDF in this ZIP is built through LetterDocument / ReportDocument via
 * captureDocumentPDF (see src/lib/renderDocToBlob.js) — the same pipeline as
 * the letter preview/download/print/email and dashboard/AI-analysis exports.
 */
export default function CaseTransferPackage({ caseItem, evidence = [], events = [] }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");

  const handleExport = async () => {
    setExporting(true);
    const generatedDate = format(new Date(), "d MMMM yyyy");
    const caseId = caseItem.id;

    try {
      setProgress("Gathering case records…");
      const [deadlines, checklistItems, merchantResponses, emailLogs, organisations] = await Promise.all([
        base44.entities.Deadline.filter({ case_id: caseId }).catch(() => []),
        base44.entities.ChecklistItem.filter({ case_id: caseId }).catch(() => []),
        base44.entities.MerchantResponse.filter({ case_id: caseId }).catch(() => []),
        base44.entities.EmailLog.filter({ case_id: caseId }).catch(() => []),
        caseItem.organisation_name ? base44.entities.Organisation.filter({ name: caseItem.organisation_name }).catch(() => []) : Promise.resolve([]),
      ]);
      const organisation = organisations[0];
      const { score: matterStrength } = scoreFromCase(caseItem, evidence, events);

      const zip = new JSZip();
      const pkg = {}; // path -> blob, so folder 16 can reuse already-built PDFs

      const addDoc = async (path, sections, title) => {
        setProgress(`Building ${title}…`);
        const blob = await renderDocToBlob(
          <ReportDocument title={title} subtitle={caseItem.title} generatedLabel={`Generated ${generatedDate}`} sections={sections} />,
          { caseId, generatedDate }
        );
        zip.file(path, blob);
        pkg[path] = blob;
        return blob;
      };

      // 00 — Read Me First
      await addDoc(
        "00 - READ ME FIRST.pdf",
        buildReadMeSections(caseItem, {
          matterStrength,
          currentStage: caseItem.progress_stage,
          regulator: caseItem.escalation_body,
          advocacyService: organisation?.notes,
        }),
        "Read Me First"
      );

      // 01 — Executive Summary
      let aiSummary = null;
      try { aiSummary = caseItem.executive_summary ? JSON.parse(caseItem.executive_summary) : null; } catch { /* ignore malformed */ }
      const execSections = [
        {
          heading: "Case Overview",
          rows: [
            { label: "Case Title", value: caseItem.title },
            { label: "Case Number", value: `CC-${String(caseId).slice(0, 8).toUpperCase()}` },
            { label: "Industry", value: (caseItem.category || "").toUpperCase() },
            { label: "Organisation Complained About", value: caseItem.organisation_name },
            { label: "Status", value: (caseItem.status || "").replace(/_/g, " ").toUpperCase() },
            { label: "Matter Strength", value: `${matterStrength}%` },
            { label: "Current Stage", value: (caseItem.progress_stage || "").replace(/_/g, " ") },
            { label: "Assigned Regulator", value: caseItem.escalation_body },
          ],
        },
        {
          heading: "Recommended Next Action",
          paragraphs: [aiSummary?.next_actions?.[0] || "Continue building the case — see the Matter Strength breakdown in the Complete Case Report."],
        },
        aiSummary
          ? { heading: "AI Executive Summary", paragraphs: [aiSummary.case_overview] }
          : { heading: "AI Executive Summary", empty: "Not yet generated." },
      ];
      await addDoc("01 - Executive Summary.pdf", execSections, "Executive Summary");

      // 02 — Complete Case Report (reuses the exact section builder as the dashboard report)
      await addDoc("02 - Complete Case Report.pdf", buildCompleteCaseReportSections(caseItem, evidence, events, deadlines, checklistItems), "Complete Case Report");

      // 03 — AI Case Analysis (reuses the exact section builder as the AI analysis export)
      const aiSections = aiSummary ? buildAiAnalysisSections(aiSummary) : [{ heading: "AI Case Analysis", empty: 'Not yet generated. Use "Generate Case Summary" on the case dashboard first.' }];
      await addDoc("03 - AI Case Analysis.pdf", aiSections, "AI Case Analysis");

      // 04 — Matter Timeline
      await addDoc("04 - Matter Timeline.pdf", buildTimelineSections(caseItem, events), "Matter Timeline");

      // 05 — Weekly Case Snapshot
      await addDoc("05 - Weekly Case Snapshot.pdf", buildWeeklySnapshotSections(caseItem, evidence, events, deadlines), "Weekly Case Snapshot");

      // 06 — Deadlines Calendar
      await addDoc("06 - Deadlines Calendar.pdf", buildDeadlinesSections(deadlines), "Deadlines Calendar");

      // 07 — Complaint Letters — LetterDocument ONLY, using ONLY the current letter fields
      const letterEntries = Object.entries(LETTER_FIELD_MAP);
      for (const [key, field] of letterEntries) {
        const content = caseItem[field];
        if (!content) continue;
        setProgress(`Building ${LETTER_LABELS[key]} letter…`);
        const client = {
          name: caseItem.complainant_name || "", address: caseItem.complainant_address || "",
          email: caseItem.complainant_email || "", phone: caseItem.complainant_phone || "",
        };
        const { receiverLines, senderLines, today } = buildLetterHeaderData(caseItem, client);
        const path = `07 - Complaint Letters/${LETTER_LABELS[key].replace(/\s+/g, "_")}.pdf`;
        const blob = await renderDocToBlob(
          <LetterDocument
            receiverLines={receiverLines}
            senderLines={senderLines}
            today={today}
            reSubject={getLetterReSubject(key, caseItem.organisation_name)}
            bodyText={content}
          />,
          { caseId, generatedDate }
        );
        zip.file(path, blob);
        pkg[path] = blob;
      }

      // 08 — Merchant Responses
      await addDoc("08 - Merchant Responses/Merchant_Responses.pdf", buildMerchantResponsesSections(merchantResponses), "Merchant Responses");

      // 09 — Evidence (index + original files)
      await addDoc("09 - Evidence/Evidence_Index.pdf", buildEvidenceIndexSections(evidence), "Evidence Index");
      const fetchedFiles = [];
      setProgress("Fetching evidence files…");
      for (const ev of evidence) {
        try {
          const res = await fetch(ev.file_url);
          const blob = await res.blob();
          const safeName = `${fetchedFiles.length + 1}_${sanitize(ev.file_name) || "file"}`;
          zip.file(`09 - Evidence/${safeName}`, blob);
          fetchedFiles.push({ name: safeName, blob });
        } catch (err) { console.error("[Transfer Package] Evidence fetch failed:", ev.file_name, err); }
      }

      // 10 — Email Correspondence
      await addDoc("10 - Email Correspondence/Email_Correspondence.pdf", buildEmailCorrespondenceSections(emailLogs), "Email Correspondence");

      // 11 — Uploaded Documents (original files only — reuses the already-fetched blobs)
      fetchedFiles.forEach(f => zip.file(`11 - Uploaded Documents/${f.name}`, f.blob));

      // 12 — Notes & Chronology
      await addDoc("12 - Notes & Chronology.pdf", buildNotesSections(caseItem, events), "Notes & Chronology");

      // 13 — Contacts & Organisations
      await addDoc("13 - Contacts & Organisations.pdf", buildContactsSections(caseItem, organisation), "Contacts & Organisations");

      // 14 — Reports (copies of the reports above)
      if (pkg["02 - Complete Case Report.pdf"]) zip.file("14 - Reports/Complete Case Report.pdf", pkg["02 - Complete Case Report.pdf"]);
      if (pkg["01 - Executive Summary.pdf"]) zip.file("14 - Reports/Executive Summary.pdf", pkg["01 - Executive Summary.pdf"]);

      // 15 — Audit Trail
      await addDoc("15 - Audit Trail.pdf", buildAuditTrailSections(caseItem, evidence, events, emailLogs), "Audit Trail");

      // 17 — Legislation & Authorities
      await addDoc("17 - Legislation & Authorities.pdf", buildLegislationSections(caseItem), "Legislation & Authorities");

      // 18 — Case Statistics
      await addDoc("18 - Case Statistics.pdf", buildStatisticsSections(caseItem, evidence, events, deadlines, merchantResponses, emailLogs), "Case Statistics");

      // 16 — Ready For Solicitor Or Tribunal (reuses the blobs already built above)
      setProgress("Assembling solicitor/tribunal bundle…");
      const bundleMap = [
        ["01 - Executive Summary.pdf", "Executive Summary.pdf"],
        ["02 - Complete Case Report.pdf", "Complete Case Report.pdf"],
        ["03 - AI Case Analysis.pdf", "AI Case Analysis.pdf"],
        ["04 - Matter Timeline.pdf", "Matter Timeline.pdf"],
        ["09 - Evidence/Evidence_Index.pdf", "Evidence Index.pdf"],
        ["08 - Merchant Responses/Merchant_Responses.pdf", "Merchant Responses.pdf"],
        ["06 - Deadlines Calendar.pdf", "Deadlines Calendar.pdf"],
        ["05 - Weekly Case Snapshot.pdf", "Weekly Case Snapshot.pdf"],
        ["13 - Contacts & Organisations.pdf", "Contacts & Organisations.pdf"],
        ["15 - Audit Trail.pdf", "Audit Trail.pdf"],
      ];
      bundleMap.forEach(([src, destName]) => { if (pkg[src]) zip.file(`16 - Ready For Solicitor Or Tribunal/${destName}`, pkg[src]); });
      letterEntries.forEach(([key]) => {
        const src = `07 - Complaint Letters/${LETTER_LABELS[key].replace(/\s+/g, "_")}.pdf`;
        if (pkg[src]) zip.file(`16 - Ready For Solicitor Or Tribunal/Letters/${LETTER_LABELS[key].replace(/\s+/g, "_")}.pdf`, pkg[src]);
      });

      // Compress & download
      setProgress("Compressing package…");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const filename = `Chaos Controller - ${sanitize(caseItem.organisation_name) || "Organisation"} - ${sanitize(caseItem.title)} - ${sanitize(caseItem.complainant_name) || "Client"} - ${format(new Date(), "yyyy-MM-dd")}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Case Transfer Package downloaded");
    } catch (err) {
      console.error("[Case Transfer Package] Failed:", err);
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
      setProgress("");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-2">
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
      <span className="hidden sm:inline">{exporting ? (progress || "Building package…") : "Case Transfer Package"}</span>
    </Button>
  );
}