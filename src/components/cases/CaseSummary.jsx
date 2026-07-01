import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import {
  Printer, FileText, TrendingUp, AlertCircle, CheckCircle2,
  Clock, Mail, Download, ShieldAlert, AlertTriangle, Sparkles, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import ReportDocument from "@/components/reports/ReportDocument";
import { renderDocToBlob } from "@/lib/renderDocToBlob";
import { buildSections } from "@/components/cases/CaseDashboardReport";
import { buildSummarySections } from "@/components/cases/ExecutiveSummaryGenerator";
import { toast } from "sonner";
import { useToast } from "@/components/ui/use-toast";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail } from "@/lib/pdfDiagnostics";

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

// ── Schema helpers ────────────────────────────────────────────────────────────

function parseExecutiveSummary(raw) {
  if (!raw) return null;
  try {
    let parsed = JSON.parse(raw);
    if (parsed?.response && typeof parsed.response === 'object') parsed = parsed.response;
    return parsed;
  } catch {
    return null;
  }
}

function isNewSchema(s) {
  return !!(s?.case_overview || s?.facts || s?.issues_identified || s?.next_actions);
}

// ── Shared PDF action helper — same ReportDocument + renderDocToBlob pathway
// used everywhere else, fed with properly structured (granular) sections so
// pagination splits between rows/bullets/paragraphs, never mid-sentence. ──────

async function runPDFAction({ action, tab, title, subtitle, sections }) {
  pdfDiagStart({ tab, action, hasData: sections?.length > 0 });
  const blob = await renderDocToBlob(
    <ReportDocument
      title={title}
      subtitle={subtitle}
      generatedLabel={`Generated ${format(new Date(), 'd MMMM yyyy')}`}
      sections={sections}
    />
  );
  if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
  pdfDiagBlobCreated({ tab, action, blob });
  pdfDiagSuccess({ tab, action });
  return blob;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CaseSummary({ caseItem, evidence, events }) {
  const { toast: shadToast } = useToast();

  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseItem?.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem.id }),
    enabled: !!caseItem?.id,
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ["checklist", caseItem?.id],
    queryFn: () => base44.entities.ChecklistItem.filter({ case_id: caseItem.id }),
    enabled: !!caseItem?.id,
  });

  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const [genError, setGenError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null); // 'dashboard-dl' | 'dashboard-print' | 'summary-dl' | 'summary-print'

  useEffect(() => {
    setExecutiveSummary(parseExecutiveSummary(caseItem?.executive_summary));
  }, [caseItem?.executive_summary]);

  const upcomingDeadlines = deadlines
    .filter(d => d.status === 'pending' && d.deadline_date)
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
    .slice(0, 5);

  const newSchema = executiveSummary ? isNewSchema(executiveSummary) : false;
  const today = format(new Date(), 'yyyy-MM-dd');

  // ── Generate Case Summary ──────────────────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true);
    setGenElapsed(0);
    setGenError(null);
    const timer = setInterval(() => setGenElapsed(p => p + 1), 1000);
    try {
      const response = await base44.functions.invoke('generateExecutiveSummary', { caseId: caseItem.id });
      clearInterval(timer);
      if (!response.data?.success || !response.data?.summary) {
        throw new Error(response.data?.error || 'Server returned no summary');
      }
      const summaryData = response.data.summary;
      setExecutiveSummary(summaryData);
      shadToast({ title: "✓ Case Summary Generated", description: `Analysis complete in ${genElapsed + 1}s.` });
    } catch (err) {
      clearInterval(timer);
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      setGenError(msg);
      shadToast({ title: "✗ Generation Failed", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // ── Dashboard PDF ─────────────────────────────────────────────────────────

  const handleDashboardDownload = async () => {
    setPdfLoading('dashboard-dl');
    try {
      const sections = buildSections(caseItem, evidence, events, deadlines, checklistItems);
      const blob = await runPDFAction({
        action: 'Download', tab: 'Dashboard PDF',
        title: 'Complete Case Report', subtitle: caseItem.title,
        sections,
      });
      downloadPDFBlob(blob, `Dashboard_${today}.pdf`);
    } catch (err) {
      pdfDiagFail({ tab: 'Dashboard PDF', action: 'Download', error: err });
    } finally {
      setPdfLoading(null);
    }
  };

  const handleDashboardPrint = async () => {
    setPdfLoading('dashboard-print');
    try {
      const sections = buildSections(caseItem, evidence, events, deadlines, checklistItems);
      const blob = await runPDFAction({
        action: 'Print', tab: 'Dashboard PDF',
        title: 'Complete Case Report', subtitle: caseItem.title,
        sections,
      });
      const opened = await openPDFForPrint(blob, `Dashboard_${today}.pdf`);
      if (!opened) {
        toast.warning('Print blocked — downloading instead (Safari/popup blocker).');
        downloadPDFBlob(blob, `Dashboard_${today}.pdf`);
      }
    } catch (err) {
      pdfDiagFail({ tab: 'Dashboard PDF', action: 'Print', error: err });
    } finally {
      setPdfLoading(null);
    }
  };

  // ── AI Summary PDF ────────────────────────────────────────────────────────

  const handleSummaryDownload = async () => {
    if (!executiveSummary) { toast.warning('Generate the AI Summary first.'); return; }
    setPdfLoading('summary-dl');
    try {
      const sections = buildSummarySections(executiveSummary);
      const blob = await runPDFAction({
        action: 'Download', tab: 'AI Summary PDF',
        title: 'AI Case Summary', subtitle: caseItem.title,
        sections,
      });
      downloadPDFBlob(blob, `AI_Summary_${today}.pdf`);
    } catch (err) {
      pdfDiagFail({ tab: 'AI Summary PDF', action: 'Download', error: err });
    } finally {
      setPdfLoading(null);
    }
  };

  const handleSummaryPrint = async () => {
    if (!executiveSummary) { toast.warning('Generate the AI Summary first.'); return; }
    setPdfLoading('summary-print');
    try {
      const sections = buildSummarySections(executiveSummary);
      const blob = await runPDFAction({
        action: 'Print', tab: 'AI Summary PDF',
        title: 'AI Case Summary', subtitle: caseItem.title,
        sections,
      });
      const opened = await openPDFForPrint(blob, `AI_Summary_${today}.pdf`);
      if (!opened) {
        toast.warning('Print blocked — downloading instead (Safari/popup blocker).');
        downloadPDFBlob(blob, `AI_Summary_${today}.pdf`);
      }
    } catch (err) {
      pdfDiagFail({ tab: 'AI Summary PDF', action: 'Print', error: err });
    } finally {
      setPdfLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Action Button Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading font-semibold text-sm text-foreground uppercase tracking-wider">Actions</h3>

        {/* Generate */}
        <div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full sm:w-auto gap-2"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating... ({genElapsed}s)</> : <><Sparkles className="w-4 h-4" /> Generate Case Summary</>}
          </Button>
          {genError && !generating && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {genError}
            </p>
          )}
        </div>

        {/* Dashboard PDF row */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Dashboard PDF — includes all case data, progress tracker, matter strength, deadlines &amp; AI assessment</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDashboardDownload} disabled={!!pdfLoading} className="gap-1.5">
              {pdfLoading === 'dashboard-dl' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download Dashboard PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleDashboardPrint} disabled={!!pdfLoading} className="gap-1.5">
              {pdfLoading === 'dashboard-print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Print Dashboard
            </Button>
          </div>
        </div>

        {/* AI Summary PDF row */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">
            AI Summary PDF — 10-section AI analysis only
            {!executiveSummary && <span className="text-warning ml-1">(generate summary first)</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleSummaryDownload} disabled={!!pdfLoading || !executiveSummary} className="gap-1.5">
              {pdfLoading === 'summary-dl' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download AI Summary PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSummaryPrint} disabled={!!pdfLoading || !executiveSummary} className="gap-1.5">
              {pdfLoading === 'summary-print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Print AI Summary
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
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

      {/* ── Case Details ── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Case Details</h4>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            { label: "Organisation", value: caseItem.organisation_name },
            { label: "Status", value: STATUS_LABELS[caseItem.status] || caseItem.status },
            { label: "Category", value: caseItem.category },
            { label: "Priority", value: PRIORITY_LABELS[caseItem.priority] || caseItem.priority },
            { label: "Account #", value: caseItem.account_number },
            { label: "Incident Date", value: caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMM yyyy") : null },
            { label: "Escalation Body", value: caseItem.escalation_body },
            { label: "Complainant", value: caseItem.complainant_name },
          ].map(({ label, value }) => value ? (
            <div key={label} className="flex gap-2">
              <span className="text-muted-foreground shrink-0 w-28">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
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

      {/* ── Upcoming Deadlines ── */}
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

      {/* ── AI Case Assessment ── */}
      {executiveSummary && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-lg text-foreground">AI Case Assessment</h3>
          </div>

          <SummarySection icon={<TrendingUp className="w-5 h-5 text-primary" />} title="Case Overview" gradient>
            <p className="text-sm text-foreground leading-relaxed">
              {newSchema ? executiveSummary.case_overview : executiveSummary.summary}
            </p>
          </SummarySection>

          {newSchema && executiveSummary.facts?.length > 0 && (
            <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Established Facts">
              <BulletList items={executiveSummary.facts} dotColor="bg-success" />
            </SummarySection>
          )}

          {newSchema && executiveSummary.timeline_summary && (
            <SummarySection icon={<Clock className="w-5 h-5 text-accent" />} title="Timeline Summary">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.timeline_summary}</p>
            </SummarySection>
          )}

          {(newSchema ? executiveSummary.evidence_summary : executiveSummary.evidence_analysis)?.length > 0 && (
            <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Evidence Summary">
              <BulletList items={newSchema ? executiveSummary.evidence_summary : executiveSummary.evidence_analysis} dotColor="bg-success" useCheckIcon />
            </SummarySection>
          )}

          {(newSchema ? executiveSummary.issues_identified : executiveSummary.key_issues)?.length > 0 && (
            <SummarySection icon={<AlertCircle className="w-5 h-5 text-warning" />} title="Issues Identified">
              <BulletList items={newSchema ? executiveSummary.issues_identified : executiveSummary.key_issues} dotColor="bg-warning" />
            </SummarySection>
          )}

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

          {!newSchema && executiveSummary.case_strength_assessment && (
            <SummarySection icon={<TrendingUp className="w-5 h-5 text-accent" />} title="Case Strength Assessment">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.case_strength_assessment}</p>
            </SummarySection>
          )}

          {newSchema && executiveSummary.missing_evidence?.length > 0 && (
            <SummarySection icon={<AlertTriangle className="w-5 h-5 text-warning" />} title="Missing Evidence">
              <BulletList items={executiveSummary.missing_evidence} dotColor="bg-warning" />
            </SummarySection>
          )}

          {!newSchema && executiveSummary.correspondence_summary && (
            <SummarySection icon={<Mail className="w-5 h-5 text-primary" />} title="Correspondence History">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.correspondence_summary}</p>
            </SummarySection>
          )}

          {(newSchema ? executiveSummary.next_actions : executiveSummary.next_steps)?.length > 0 && (
            <SummarySection icon={<CheckCircle2 className="w-5 h-5 text-accent" />} title="Recommended Next Actions" accent>
              <BulletList items={newSchema ? executiveSummary.next_actions : executiveSummary.next_steps} dotColor="bg-accent" />
            </SummarySection>
          )}

          {newSchema && executiveSummary.escalation_path && (
            <SummarySection icon={<TrendingUp className="w-5 h-5 text-primary" />} title="Escalation Path">
              <p className="text-sm text-foreground leading-relaxed">{executiveSummary.escalation_path}</p>
            </SummarySection>
          )}

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

      {/* Generating overlay */}
      {generating && (
        <div className="fixed bottom-6 right-6 bg-card border-2 border-primary/40 rounded-xl p-4 shadow-2xl z-50 min-w-[280px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div>
              <p className="text-sm font-bold text-foreground">Generating Summary...</p>
              <p className="text-xs text-muted-foreground">AI analysing your complete case file</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-lg font-mono font-bold text-primary">{genElapsed}s</span>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-secondary/50 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-linear" style={{ width: `${Math.min((genElapsed / 60) * 100, 95)}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Typically 20–40 seconds</p>
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