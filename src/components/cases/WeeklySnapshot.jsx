import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Download, Printer, CalendarDays, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, subDays, isAfter, isBefore, addDays } from "date-fns";
import { downloadPDFBlob, openPDFForPrint, PRINT_BLOCKED_MESSAGE } from '@/lib/pdfGenerator';
import ReportDocument from '@/components/reports/ReportDocument';
import { renderDocToBlob } from '@/lib/renderDocToBlob';
import { toast } from "sonner";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";

const SNAPSHOT_CACHE_KEY = (caseId) => `weekly_snapshot_${caseId}`;

/**
 * Clean and parse AI-generated markdown into clean document sections
 */
function cleanSnapshotContent(md) {
  if (!md) return { sections: [] };
  
  let cleaned = md
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^##\s+/gm, '')
    .replace(/^###\s+/gm, '')
    .replace(/^- /gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/`/g, '')
    .replace(/^>/gm, '')
    .replace(/---/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  
  const lines = cleaned.split('\n');
  const sections = [];
  let currentSection = { title: '', content: [] };
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.length < 60 && !trimmed.endsWith('.') && trimmed.match(/^[A-Z][A-Za-z\s&]+$/)) {
      if (currentSection.content.length > 0) {
        sections.push({ ...currentSection, content: currentSection.content.join('\n') });
      }
      currentSection = { title: trimmed, content: [] };
    } else {
      currentSection.content.push(trimmed);
    }
  }
  
  if (currentSection.content.length > 0) {
    sections.push({ ...currentSection, content: currentSection.content.join('\n') });
  }
  
  return { sections };
}

export default function WeeklySnapshot({ caseItem, evidence = [], events = [] }) {
  const [snapshot, setSnapshot] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(SNAPSHOT_CACHE_KEY(caseItem.id));
      if (cached) {
        const parsed = JSON.parse(cached);
        setSnapshot(parsed.snapshot);
        setGeneratedAt(parsed.generatedAt);
      }
    } catch (_) {}

    base44.entities.Deadline.filter({ case_id: caseItem.id })
      .then(setDeadlines)
      .catch(() => {});
  }, [caseItem.id]);

  const generateSnapshot = async () => {
    setLoading(true);
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAhead = addDays(now, 14);
    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;

    const recentEvents = events.filter(e => e.event_date && isAfter(new Date(e.event_date), weekAgo));
    const upcomingDeadlines = deadlines.filter(d =>
      d.deadline_date && isAfter(new Date(d.deadline_date), now) && isBefore(new Date(d.deadline_date), twoWeeksAhead) && d.status === "pending"
    );
    const overdueDeadlines = deadlines.filter(d =>
      d.deadline_date && isBefore(new Date(d.deadline_date), now) && d.status === "pending"
    );

    const pathway = caseItem.complaint_pathway || {};
    const prompt = `You are a consumer advocacy case manager for Chaos Controller™, an Australian dispute resolution platform.

Generate a concise WEEKLY CASE SNAPSHOT report in Australian English for the following case. Use PLAIN TEXT ONLY — NO markdown symbols.

CRITICAL RULES:
- NO markdown: no ##, no ###, no **, no bullets, no numbered lists with dots
- NO timestamps or "Generated at" lines
- NO developer formatting
- Use UPPERCASE section titles on their own line
- Use normal paragraphs for content
- Australian English spelling
- Use ONLY the assigned complaint pathway for this case. Do not invent or substitute AFCA, TIO, NCAT, Fair Trading, an ombudsman, tribunal or regulator unless it appears in the assigned complaint pathway. Never write generic placeholders like "relevant ombudsman", "external dispute resolution body", "tribunal or regulator" or "complaint authority" — always name the actual assigned body.

STRUCTURE:
WEEKLY STATUS SUMMARY
[2-3 sentences on where the case stands]

RECENT ACTIVITY
[Date] [Event description]
[Date] [Event description]

UPCOMING ACTIONS
[Action item 1]
[Action item 2]

RISK ASSESSMENT
[Brief risk assessment paragraph]

RECOMMENDED NEXT STEPS
[Numbered steps without dots or markdown]

CASE DETAILS:
- Title: ${caseItem.title}
- Reference: ${caseRef}
- Organisation: ${caseItem.organisation_name || "N/A"}
- Category: ${caseItem.category || "N/A"}
- Current Status: ${(caseItem.status || "N/A").replace(/_/g, " ")}
- Priority: ${caseItem.priority || "N/A"}
- Issue Summary: ${caseItem.issue_summary || "N/A"}
- Desired Outcome: ${caseItem.desired_outcome || "N/A"}
- Escalation Body: ${caseItem.escalation_body || "N/A"}

ASSIGNED COMPLAINT PATHWAY (use ONLY these bodies — never substitute or invent another):
- Internal Complaint: ${pathway.internalComplaint || "not applicable"}
- Regulator: ${pathway.regulator || "not applicable"}
- Ombudsman: ${pathway.ombudsman || "not applicable"}
- Tribunal: ${pathway.tribunal || "not applicable"}
- Court: ${pathway.court || "not applicable"}
- Support Services: ${(pathway.supportServices || []).join(", ") || "none"}

RECENT ACTIVITY (last 7 days — ${recentEvents.length} events):
${recentEvents.length > 0
  ? recentEvents.map(e => `- [${e.event_date}] ${e.event_type}: ${e.title}${e.description ? " — " + e.description : ""}`).join("\n")
  : "No new events recorded this week."}

UPCOMING DEADLINES (next 14 days — ${upcomingDeadlines.length} deadlines):
${upcomingDeadlines.length > 0
  ? upcomingDeadlines.map(d => `- ${d.title} due ${d.deadline_date} (${d.deadline_type || "N/A"})`).join("\n")
  : "No upcoming deadlines in the next 14 days."}

OVERDUE ITEMS (${overdueDeadlines.length} overdue):
${overdueDeadlines.length > 0
  ? overdueDeadlines.map(d => `- ${d.title} was due ${d.deadline_date} — OVERDUE`).join("\n")
  : "No overdue items."}

EVIDENCE ON FILE: ${evidence.length} document(s)
TOTAL TIMELINE EVENTS: ${events.length}

Remember: PLAIN TEXT ONLY. No markdown. No timestamps.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    const ts = format(new Date(), "d MMMM yyyy");
    setSnapshot(result);
    setGeneratedAt(ts);
    try {
      localStorage.setItem(SNAPSHOT_CACHE_KEY(caseItem.id), JSON.stringify({ snapshot: result, generatedAt: ts }));
    } catch (_) {}
    setLoading(false);
  };

  const buildSnapshotBlob = async () => {
    if (!snapshot) throw new Error('Generate the snapshot first before downloading.');
    const { sections: rawSections } = cleanSnapshotContent(snapshot);
    const sections = rawSections
      .map(s => ({ heading: String(s.title || 'Summary'), paragraphs: [String(s.content || '')] }))
      .filter(s => s.paragraphs[0]);
    if (sections.length === 0) throw new Error('No content found in snapshot.');
    const blob = await renderDocToBlob(
      <ReportDocument
        title="Weekly Case Snapshot"
        subtitle={caseItem.title}
        generatedLabel={`Generated ${generatedAt || format(new Date(), 'd MMMM yyyy')}`}
        sections={sections}
      />,
      { caseId: caseItem?.id }
    );
    if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
    return blob;
  };

  const handleDownloadPDF = async () => {
    pdfDiagStart({ tab: 'Weekly Snapshot', action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!snapshot });
    if (!snapshot) { pdfDiagMissingData({ tab: 'Weekly Snapshot', action: 'Download PDF', dataName: 'snapshot (generate it first)' }); return; }
    setPdfGenerating(true);
    try {
      const blob = await buildSnapshotBlob();
      pdfDiagBlobCreated({ tab: 'Weekly Snapshot', action: 'Download PDF', blob });
      downloadPDFBlob(blob, `Weekly_Snapshot_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      pdfDiagSuccess({ tab: 'Weekly Snapshot', action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Weekly Snapshot', action: 'Download PDF', error });
    } finally {
      setPdfGenerating(false);
    }
  };

  const handlePrintPDF = async () => {
    pdfDiagStart({ tab: 'Weekly Snapshot', action: 'Print PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: !!snapshot });
    if (!snapshot) { pdfDiagMissingData({ tab: 'Weekly Snapshot', action: 'Print PDF', dataName: 'snapshot (generate it first)' }); return; }
    setPdfGenerating(true);
    try {
      const blob = await buildSnapshotBlob();
      pdfDiagBlobCreated({ tab: 'Weekly Snapshot', action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, `Weekly_Snapshot_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      if (!opened) { toast.error(PRINT_BLOCKED_MESSAGE); downloadPDFBlob(blob, `Weekly_Snapshot_${format(new Date(), 'yyyy-MM-dd')}.pdf`); }
      pdfDiagSuccess({ tab: 'Weekly Snapshot', action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Weekly Snapshot', action: 'Print PDF', error });
    } finally {
      setPdfGenerating(false);
    }
  };

  const upcomingCount = deadlines.filter(d =>
    d.deadline_date && isAfter(new Date(d.deadline_date), new Date()) &&
    isBefore(new Date(d.deadline_date), addDays(new Date(), 14)) && d.status === "pending"
  ).length;

  const overdueCount = deadlines.filter(d =>
    d.deadline_date && isBefore(new Date(d.deadline_date), new Date()) && d.status === "pending"
  ).length;

  const recentCount = events.filter(e => e.event_date && isAfter(new Date(e.event_date), subDays(new Date(), 7))).length;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">Weekly Case Snapshot</h3>
              <p className="text-xs text-muted-foreground">AI-generated summary of activity, status & upcoming deadlines</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {snapshot && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfGenerating} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  {pdfGenerating ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintPDF} disabled={pdfGenerating} className="gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print PDF
                </Button>
              </>
            )}
            <Button size="sm" onClick={generateSnapshot} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {snapshot ? "Regenerate" : "Generate Snapshot"}
            </Button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">This Week</span>
            </div>
            <div className="text-lg font-bold text-foreground">{recentCount}</div>
            <div className="text-xs text-muted-foreground">new events</div>
          </div>
          <div className={`rounded-lg p-3 text-center ${upcomingCount > 0 ? "bg-warning/10" : "bg-muted/40"}`}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CalendarDays className={`w-3.5 h-3.5 ${upcomingCount > 0 ? "text-warning" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">Upcoming</span>
            </div>
            <div className={`text-lg font-bold ${upcomingCount > 0 ? "text-warning" : "text-foreground"}`}>{upcomingCount}</div>
            <div className="text-xs text-muted-foreground">deadlines (14d)</div>
          </div>
          <div className={`rounded-lg p-3 text-center ${overdueCount > 0 ? "bg-destructive/10" : "bg-muted/40"}`}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <div className={`text-lg font-bold ${overdueCount > 0 ? "text-destructive" : "text-foreground"}`}>{overdueCount}</div>
            <div className="text-xs text-muted-foreground">items</div>
          </div>
        </div>
      </div>

      {/* Snapshot content */}
      {loading && (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Generating your weekly snapshot…</p>
        </div>
      )}

      {!loading && snapshot && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Snapshot ready</span>
            </div>
            <Badge variant="outline" className="text-xs">Week of {format(new Date(), "d MMM yyyy")}</Badge>
          </div>
          <div className="space-y-4 text-sm text-foreground">
            {(() => {
              const { sections } = cleanSnapshotContent(snapshot);
              return sections.map((section, idx) => (
                <div key={idx}>
                  {section.title && (
                    <div className="font-heading font-bold text-xs uppercase tracking-wide text-foreground mb-2">{section.title}</div>
                  )}
                  {section.content && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {!loading && !snapshot && (
        <div className="bg-muted/20 border border-dashed border-border rounded-xl p-8 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No snapshot generated yet</p>
          <p className="text-xs text-muted-foreground mb-4">Generate a snapshot to get an AI summary of this week's activity, status changes, and upcoming deadlines.</p>
          <Button size="sm" onClick={generateSnapshot} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Generate Weekly Snapshot
          </Button>
        </div>
      )}
    </div>
  );
}