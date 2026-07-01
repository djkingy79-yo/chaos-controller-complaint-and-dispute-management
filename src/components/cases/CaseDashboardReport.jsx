import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2, Package } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { captureDocumentPDF, downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import ReportDocument, { ReportPreviewWrapper } from "@/components/reports/ReportDocument";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail } from "@/lib/pdfDiagnostics";

const LETTER_DEFS = [
  { field: "first_complaint_letter", label: "1st Complaint Letter" },
  { field: "second_complaint_letter", label: "2nd Complaint Letter" },
  { field: "third_complaint_letter", label: "3rd Complaint Letter" },
  { field: "accept_offer_letter", label: "Accept Offer Letter" },
  { field: "deny_offer_letter", label: "Deny Offer Letter" },
  { field: "escalation_letter", label: "Escalation Letter" },
];

export function buildSections(caseItem, evidence, events, deadlines, checklistItems) {
  const now = new Date();
  const sortedEvidence = [...(evidence || [])].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const sortedEvents = [...(events || [])].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const sortedDeadlines = [...(deadlines || [])].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
  const allChecklist = checklistItems || [];
  const completedChecklist = allChecklist.filter(i => i.status === 'complete');

  let aiSummary = null;
  if (caseItem.executive_summary) {
    try { aiSummary = JSON.parse(caseItem.executive_summary); } catch (e) { /* ignore malformed */ }
  }

  const sections = [];

  sections.push({
    heading: 'Case Information',
    rows: [
      { label: 'Case Title', value: caseItem.title },
      { label: 'Organisation', value: caseItem.organisation_name },
      { label: 'Industry Category', value: (caseItem.category || '').toUpperCase() },
      { label: 'Status', value: (caseItem.status || '').replace(/_/g, ' ').toUpperCase() },
      { label: 'Priority', value: (caseItem.priority || '').toUpperCase() },
      { label: 'Incident Date', value: caseItem.incident_date ? format(new Date(caseItem.incident_date), 'd MMMM yyyy') : null },
      { label: 'Response Deadline', value: caseItem.response_deadline ? format(new Date(caseItem.response_deadline), 'd MMMM yyyy') : null },
      { label: 'State/Territory', value: caseItem.state },
      { label: 'Escalation Body', value: caseItem.escalation_body },
      { label: 'Account/Reference', value: caseItem.account_number },
    ],
  });

  if (caseItem.complaint_pathway) {
    const cp = caseItem.complaint_pathway;
    sections.push({
      heading: 'Complaint Pathway',
      rows: [
        { label: 'Internal Complaint', value: cp.internalComplaint },
        { label: 'Regulator', value: cp.regulator },
        { label: 'Ombudsman', value: cp.ombudsman },
        { label: 'Tribunal', value: cp.tribunal },
        { label: 'Court', value: cp.court },
        { label: 'Support Services', value: (cp.supportServices || []).join(', ') },
        { label: 'Notes', value: cp.notes },
      ],
    });
  }

  sections.push({
    heading: 'Complainant Details',
    rows: [
      { label: 'Full Name', value: caseItem.complainant_name },
      { label: 'Address', value: caseItem.complainant_address },
      { label: 'Email', value: caseItem.complainant_email },
      { label: 'Phone', value: caseItem.complainant_phone },
    ],
  });

  sections.push({
    heading: 'Organisation Details',
    rows: [
      { label: 'Organisation', value: caseItem.organisation_name },
      { label: 'Complaints Address', value: caseItem.organisation_complaints_address },
      { label: 'Complaints Email', value: caseItem.organisation_complaints_email },
      { label: 'Complaint Handler', value: caseItem.complaint_handler_name },
    ],
  });

  sections.push({
    heading: 'Complaint Details',
    paragraphs: [
      caseItem.issue_summary ? `Issue Summary: ${caseItem.issue_summary}` : null,
      caseItem.issue_details,
      caseItem.desired_outcome ? `Desired Outcome: ${caseItem.desired_outcome}` : null,
      caseItem.notes ? `Notes: ${caseItem.notes}` : null,
    ],
  });

  sections.push({
    heading: 'Dashboard Metrics',
    rows: [
      { label: 'Evidence Files', value: String(sortedEvidence.length) },
      { label: 'Timeline Events', value: String(sortedEvents.length) },
      { label: 'Total Deadlines', value: String(sortedDeadlines.length) },
      { label: 'Overdue Deadlines', value: String(sortedDeadlines.filter(d => d.deadline_date && new Date(d.deadline_date) < now && d.status === 'pending').length) },
      { label: 'Checklist Complete', value: `${completedChecklist.length} of ${allChecklist.length}` },
      { label: 'Letters Generated', value: `${LETTER_DEFS.filter(l => caseItem[l.field]).length} of 6` },
    ],
  });

  if (aiSummary) {
    sections.push({ heading: 'AI Case Assessment — Overview', paragraphs: [aiSummary.case_overview] });
    if (aiSummary.facts?.length) sections.push({ heading: 'Established Facts', bullets: aiSummary.facts });
    if (aiSummary.timeline_summary) sections.push({ heading: 'Timeline Summary', paragraphs: [aiSummary.timeline_summary] });
    if (aiSummary.evidence_summary?.length) sections.push({ heading: 'Evidence Summary', bullets: aiSummary.evidence_summary });
    if (aiSummary.issues_identified?.length) sections.push({ heading: 'Issues Identified', bullets: aiSummary.issues_identified });
    if (aiSummary.strengths?.length) sections.push({ heading: 'Case Strengths', bullets: aiSummary.strengths });
    if (aiSummary.weaknesses?.length) sections.push({ heading: 'Weaknesses / Risks', bullets: aiSummary.weaknesses });
    if (aiSummary.missing_evidence?.length) sections.push({ heading: 'Missing Evidence', bullets: aiSummary.missing_evidence });
    if (aiSummary.next_actions?.length) sections.push({ heading: 'Recommended Next Actions', bullets: aiSummary.next_actions });
    if (aiSummary.escalation_path) sections.push({ heading: 'Escalation Path', paragraphs: [aiSummary.escalation_path] });
  } else {
    sections.push({ heading: 'AI Case Assessment', empty: 'Not yet generated. Use "Generate Case Summary" above to add AI analysis to this report.' });
  }

  sections.push({
    heading: `Evidence Index (${sortedEvidence.length})`,
    bullets: sortedEvidence.length
      ? sortedEvidence.map(ev => `${ev.file_name} — ${(ev.file_type || 'other').replace(/_/g, ' ')} — ${ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'no date'}${ev.description ? ' — ' + ev.description : ''}`)
      : undefined,
    empty: 'No evidence files uploaded.',
  });

  sections.push({
    heading: `Case Timeline (${sortedEvents.length})`,
    bullets: sortedEvents.length
      ? sortedEvents.map(ev => `${ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'Undated'} — ${ev.title}${ev.description ? ': ' + ev.description : ''}`)
      : undefined,
    empty: 'No timeline events recorded.',
  });

  sections.push({
    heading: `Deadlines (${sortedDeadlines.length})`,
    bullets: sortedDeadlines.length
      ? sortedDeadlines.map(d => {
          const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), now) : null;
          const urgency = daysLeft === null ? '' : daysLeft < 0 ? ` [OVERDUE by ${Math.abs(daysLeft)}d]` : daysLeft === 0 ? ' [DUE TODAY]' : ` [${daysLeft}d left]`;
          return `${d.title} — Due ${d.deadline_date ? format(new Date(d.deadline_date), 'd MMM yyyy') : 'no date'}${urgency} — ${(d.status || '').toUpperCase()}`;
        })
      : undefined,
    empty: 'No deadlines recorded.',
  });

  sections.push({
    heading: `Smart Checklist (${allChecklist.length})`,
    bullets: allChecklist.length
      ? allChecklist.map(item => `${item.status === 'complete' ? '[DONE]' : '[PENDING]'} ${item.label} — ${(item.category || '').replace(/_/g, ' ')}`)
      : undefined,
    empty: 'No checklist items generated.',
  });

  LETTER_DEFS.forEach(ld => {
    const content = caseItem[ld.field];
    sections.push({
      heading: ld.label,
      paragraphs: content ? [content.replace(/<[^>]*>/g, '')] : undefined,
      empty: 'Not yet generated.',
    });
  });

  return sections;
}

export default function CaseDashboardReport({ caseItem, evidence, events }) {
  const [checklistItems, setChecklistItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [busy, setBusy] = useState(null);
  const reportRef = useRef(null);

  // Load checklist + deadlines BEFORE allowing Download/Print — guarantees the
  // exported PDF always matches what's shown in the on-page preview below,
  // instead of racing ahead and capturing an incomplete report.
  useEffect(() => {
    if (!caseItem?.id) return;
    setDataLoaded(false);
    Promise.all([
      base44.entities.ChecklistItem.filter({ case_id: caseItem.id }).catch(() => []),
      base44.entities.Deadline.filter({ case_id: caseItem.id }).catch(() => []),
    ]).then(([checklist, dl]) => {
      setChecklistItems(checklist);
      setDeadlines(dl);
      setDataLoaded(true);
    });
  }, [caseItem?.id]);

  const sections = buildSections(caseItem, evidence, events, deadlines, checklistItems);
  const filename = `Case_Report_${String(caseItem.title || 'case').replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  const handleDownload = async () => {
    pdfDiagStart({ tab: 'Dashboard Report', action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: true });
    if (!reportRef.current) return;
    setBusy('download');
    try {
      const blob = await captureDocumentPDF(reportRef.current, { caseId: caseItem?.id });
      pdfDiagBlobCreated({ tab: 'Dashboard Report', action: 'Download PDF', blob });
      downloadPDFBlob(blob, filename);
      pdfDiagSuccess({ tab: 'Dashboard Report', action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Dashboard Report', action: 'Download PDF', error });
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    pdfDiagStart({ tab: 'Dashboard Report', action: 'Print PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: true });
    if (!reportRef.current) return;
    setBusy('print');
    try {
      const blob = await captureDocumentPDF(reportRef.current, { caseId: caseItem?.id });
      pdfDiagBlobCreated({ tab: 'Dashboard Report', action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, filename);
      if (!opened) { toast.warning('Print blocked — downloading instead.'); downloadPDFBlob(blob, filename); }
      pdfDiagSuccess({ tab: 'Dashboard Report', action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Dashboard Report', action: 'Print PDF', error });
      toast.error('Failed to print PDF: ' + error.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary/15 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-foreground">Complete Case Report</p>
            <p className="text-xs text-muted-foreground">Every section of this case — details, evidence, timeline, deadlines, checklist, AI analysis and all letters — in one PDF.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={!!busy || !dataLoaded} className="flex-1 gap-2 h-10 font-bold" size="lg">
            {busy === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {busy === 'download' ? 'Generating…' : !dataLoaded ? 'Loading case data…' : 'Download Case Report PDF'}
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!!busy || !dataLoaded} className="flex-1 gap-2 h-10 font-bold" size="lg">
            {busy === 'print' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {busy === 'print' ? 'Generating…' : !dataLoaded ? 'Loading case data…' : 'Print Case Report PDF'}
          </Button>
        </div>
      </div>

      <ReportPreviewWrapper>
        <div ref={reportRef}>
          <ReportDocument
            title="Complete Case Report"
            subtitle={caseItem.title}
            generatedLabel={`Generated ${format(new Date(), 'd MMMM yyyy, h:mm a')}`}
            sections={sections}
          />
        </div>
      </ReportPreviewWrapper>
    </div>
  );
}