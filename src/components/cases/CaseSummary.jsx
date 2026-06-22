import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { Printer, FileText, TrendingUp, AlertCircle, CheckCircle2, Clock, Mail, Download, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateChaosDocumentPDF, downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";

const STATUS_LABELS = {
  draft: "Draft",
  complaint_sent: "Complaint Sent",
  awaiting_response: "Awaiting Response",
  response_received: "Response Received",
  escalation_ready: "Escalation Ready",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "URGENT",
};

// Parse saved executive_summary JSON — handles both old schema and new schema,
// and the old "response" wrapper that some legacy records have.
function parseExecutiveSummary(raw) {
  if (!raw) return null;
  try {
    let parsed = JSON.parse(raw);
    // Unwrap legacy { response: {...} } wrapper
    if (parsed?.response && typeof parsed.response === 'object') parsed = parsed.response;
    return parsed;
  } catch (e) {
    console.error("Failed to parse executive summary:", e);
    return null;
  }
}

// Detect which schema version we have
function isNewSchema(s) {
  return !!(s?.case_overview || s?.facts || s?.issues_identified || s?.next_actions);
}

function buildPDFBody(s, caseItem) {
  if (isNewSchema(s)) {
    const lines = [
      'CASE OVERVIEW', s.case_overview || '—', '',
      'ESTABLISHED FACTS', ...(s.facts || []).map(f => `• ${f}`), '',
      'TIMELINE SUMMARY', s.timeline_summary || '—', '',
      'EVIDENCE SUMMARY', ...(s.evidence_summary || []).map(e => `• ${e}`), '',
      'ISSUES IDENTIFIED', ...(s.issues_identified || []).map(i => `• ${i}`), '',
      'CASE STRENGTHS', ...(s.strengths || []).map(x => `• ${x}`), '',
      'WEAKNESSES / RISKS', ...(s.weaknesses || []).map(x => `• ${x}`), '',
      'MISSING EVIDENCE', ...(s.missing_evidence?.length ? s.missing_evidence.map(x => `• ${x}`) : ['• None identified']), '',
      'RECOMMENDED NEXT ACTIONS', ...(s.next_actions || []).map(x => `• ${x}`), '',
      'ESCALATION PATH', s.escalation_path || '—',
    ];
    return lines.join('\n');
  }
  // Legacy schema fallback
  const lines = [
    'CASE OVERVIEW', s.summary || '—', '',
    'KEY ISSUES', ...(s.key_issues || []).map(x => `• ${x}`), '',
    'EVIDENCE ANALYSIS', ...(s.evidence_analysis || []).map(x => `• ${x}`), '',
    'CORRESPONDENCE SUMMARY', s.correspondence_summary || '—', '',
    'RECOMMENDED NEXT STEPS', ...(s.next_steps || []).map(x => `• ${x}`), '',
    'CASE STRENGTH ASSESSMENT', s.case_strength_assessment || '—',
  ];
  return lines.join('\n');
}

export default function CaseSummary({ caseItem, evidence, events }) {
  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseItem?.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem.id }),
    enabled: !!caseItem?.id,
  });

  const [executiveSummary, setExecutiveSummary] = useState(null);

  useEffect(() => {
    const parsed = parseExecutiveSummary(caseItem?.executive_summary);
    setExecutiveSummary(parsed);
  }, [caseItem?.executive_summary]);

  const upcomingDeadlines = deadlines
    .filter((d) => d.status === "pending" && d.deadline_date)
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
    .slice(0, 5);

  const handleDownloadPDF = async () => {
    pdfDiagStart({ tab: 'Summary', action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!executiveSummary });
    if (!executiveSummary) { pdfDiagMissingData({ tab: 'Summary', action: 'Download PDF', dataName: 'AI summary — generate it first' }); return; }
    try {
      const blob = await generateChaosDocumentPDF({ documentType: 'general', title: `Case Summary — ${caseItem.title}`, body: buildPDFBody(executiveSummary, caseItem), includeHeader: true, includeFooter: true });
      if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
      pdfDiagBlobCreated({ tab: 'Summary', action: 'Download PDF', blob });
      downloadPDFBlob(blob, `Case_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      pdfDiagSuccess({ tab: 'Summary', action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Summary', action: 'Download PDF', error });
    }
  };

  const handlePrintPDF = async () => {
    pdfDiagStart({ tab: 'Summary', action: 'Print PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!executiveSummary });
    if (!executiveSummary) { pdfDiagMissingData({ tab: 'Summary', action: 'Print PDF', dataName: 'AI summary — generate it first' }); return; }
    try {
      const blob = await generateChaosDocumentPDF({ documentType: 'general', title: `Case Summary — ${caseItem.title}`, body: buildPDFBody(executiveSummary, caseItem), includeHeader: true, includeFooter: true });
      if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
      pdfDiagBlobCreated({ tab: 'Summary', action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, `Case_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      if (!opened) { toast.warning('Print blocked — downloading instead (Safari/popup blocker).'); downloadPDFBlob(blob, `Case_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`); }
      pdfDiagSuccess({ tab: 'Summary', action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Summary', action: 'Print PDF', error });
    }
  };

  const newSchema = executiveSummary ? isNewSchema(executiveSummary) : false;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Case Summary</h3>
        {executiveSummary && (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Evidence Files", value: evidence.length, color: "text-primary" },
          { label: "Timeline Events", value: events.length, color: "text-accent" },
          { label: "Upcoming Deadlines", value: upcomingDeadlines.length, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Case Info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Case Details</h4>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            { label: "Organisation", value: caseItem.organisation_name },
            { label: "Status", value: STATUS_LABELS[caseItem.status] || caseItem.status },
            { label: "Category", value: caseItem.category },
            { label: "Priority", value: PRIORITY_LABELS[caseItem.priority] || caseItem.priority },
            { label: "Account #", value: caseItem.account_number, breakWord: true },
            { label: "Incident Date", value: caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMM yyyy") : null },
            { label: "Escalation Body", value: caseItem.escalation_body },
            { label: "Complainant", value: caseItem.complainant_name },
          ].map(({ label, value, breakWord }) => value ? (
            <div key={label} className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-28">{label}</span>
              <span className={`font-medium text-foreground capitalize ${breakWord ? "break-words" : ""}`}>{value}</span>
            </div>
          ) : null)}
        </div>
      </div>

      {caseItem.issue_summary && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Issue Summary</h4>
          <p className="text-sm text-foreground leading-relaxed">{caseItem.issue_summary}</p>
        </div>
      )}

      {caseItem.desired_outcome && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Desired Outcome</h4>
          <p className="text-sm text-foreground leading-relaxed">{caseItem.desired_outcome}</p>
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming Deadlines</h4>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No upcoming deadlines.</p>
        ) : (
          <div className="space-y-2">
            {upcomingDeadlines.map((d) => {
              const daysLeft = differenceInDays(new Date(d.deadline_date), new Date());
              const overdue = daysLeft < 0;
              return (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{(d.deadline_type || "").replace(/_/g, " ")} · {format(new Date(d.deadline_date), "d MMM yyyy")}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${overdue ? "bg-destructive/10 text-destructive" : daysLeft <= 7 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                    {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Case Assessment — renders both new and legacy schema */}
      {executiveSummary && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-lg text-foreground">AI Case Assessment</h3>
          </div>

          {/* Case Overview (new: case_overview, legacy: summary) */}
          <SummarySection icon={<TrendingUp className="w-5 h-5 text-primary" />} title="Case Overview" gradient>
            <p className="text-sm text-foreground leading-relaxed">
              {newSchema ? executiveSummary.case_overview : executiveSummary.summary}
            </p>
          </SummarySection>

          {/* Facts (new only) */}
          {newSchema && executiveSummary.facts?.length > 0 && (
            <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Established Facts">
              <BulletList items={executiveSummary.facts} dotColor="bg-success" />
            </SummarySection>
          )}

          {/* Timeline Summary (new only) */}
          {newSchema && executiveSummary.timeline_summary && (
            <SummarySection icon={<Clock className="w-5 h-5 text-accent" />} title="Timeline Summary">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.timeline_summary}</p>
            </SummarySection>
          )}

          {/* Evidence Summary (new: evidence_summary, legacy: evidence_analysis) */}
          {(newSchema ? executiveSummary.evidence_summary : executiveSummary.evidence_analysis)?.length > 0 && (
            <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Evidence Summary">
              <BulletList
                items={newSchema ? executiveSummary.evidence_summary : executiveSummary.evidence_analysis}
                dotColor="bg-success"
                useCheckIcon
              />
            </SummarySection>
          )}

          {/* Issues Identified (new: issues_identified, legacy: key_issues) */}
          {(newSchema ? executiveSummary.issues_identified : executiveSummary.key_issues)?.length > 0 && (
            <SummarySection icon={<AlertCircle className="w-5 h-5 text-warning" />} title="Issues Identified">
              <BulletList
                items={newSchema ? executiveSummary.issues_identified : executiveSummary.key_issues}
                dotColor="bg-warning"
              />
            </SummarySection>
          )}

          {/* Strengths / Weaknesses (new only, side by side) */}
          {newSchema && (executiveSummary.strengths?.length > 0 || executiveSummary.weaknesses?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {executiveSummary.strengths?.length > 0 && (
                <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Strengths">
                  <BulletList items={executiveSummary.strengths} dotColor="bg-success" />
                </SummarySection>
              )}
              {executiveSummary.weaknesses?.length > 0 && (
                <SummarySection icon={<ShieldAlert className="w-5 h-5 text-destructive" />} title="Weaknesses / Risks">
                  <BulletList items={executiveSummary.weaknesses} dotColor="bg-destructive" />
                </SummarySection>
              )}
            </div>
          )}

          {/* Case Strength Assessment (legacy only) */}
          {!newSchema && executiveSummary.case_strength_assessment && (
            <SummarySection icon={<TrendingUp className="w-5 h-5 text-accent" />} title="Case Strength Assessment">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.case_strength_assessment}</p>
            </SummarySection>
          )}

          {/* Missing Evidence (new only) */}
          {newSchema && executiveSummary.missing_evidence?.length > 0 && (
            <SummarySection icon={<AlertTriangle className="w-5 h-5 text-warning" />} title="Missing Evidence">
              <BulletList items={executiveSummary.missing_evidence} dotColor="bg-warning" />
            </SummarySection>
          )}

          {/* Correspondence Summary (legacy only) */}
          {!newSchema && executiveSummary.correspondence_summary && (
            <SummarySection icon={<Mail className="w-5 h-5 text-primary" />} title="Correspondence History">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.correspondence_summary}</p>
            </SummarySection>
          )}

          {/* Next Actions (new: next_actions, legacy: next_steps) */}
          {(newSchema ? executiveSummary.next_actions : executiveSummary.next_steps)?.length > 0 && (
            <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-accent" />} title="Recommended Next Actions" accent>
              <BulletList
                items={newSchema ? executiveSummary.next_actions : executiveSummary.next_steps}
                dotColor="bg-accent"
              />
            </SummarySection>
          )}

          {/* Escalation Path (new only) */}
          {newSchema && executiveSummary.escalation_path && (
            <SummarySection icon={<TrendingUp className="w-5 h-5 text-primary" />} title="Escalation Path">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.escalation_path}</p>
            </SummarySection>
          )}

          {/* Critical Deadlines (legacy only) */}
          {!newSchema && executiveSummary.critical_deadlines?.length > 0 && (
            <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-destructive" />
                <h4 className="font-heading font-bold text-lg text-destructive">Critical Deadlines</h4>
              </div>
              <ul className="space-y-2">
                {executiveSummary.critical_deadlines.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm font-semibold text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummarySection({ icon, title, children, gradient, accent }) {
  const bg = gradient
    ? "bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/30"
    : accent
    ? "bg-gradient-to-br from-accent/10 via-card to-primary/5 border border-accent/30"
    : "bg-card border border-border";
  return (
    <div className={`rounded-xl p-5 ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-heading font-bold text-base">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, dotColor, useCheckIcon }) {
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
          {useCheckIcon
            ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            : <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mt-1.5`} />
          }
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}