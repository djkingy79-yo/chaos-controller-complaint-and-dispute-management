import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Printer, CalendarDays, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, subDays, isAfter, isBefore, addDays } from "date-fns";
import ReactMarkdown from "react-markdown";
import { printDocument, DOCUMENT_CSS } from "@/lib/documentFormatEngine";

const SNAPSHOT_CACHE_KEY = (caseId) => `weekly_snapshot_${caseId}`;

function renderMarkdownToHtml(md) {
  if (!md) return "";
  let html = md
    .replace(/^## (.*$)/gm, '<h2 style="font-size:12pt;font-weight:bold;margin:10pt 0 6pt 0;color:#000;">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size:11pt;font-weight:bold;margin:8pt 0 4pt 0;color:#000;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li style="margin-bottom:3pt;line-height:1.2;">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li style="margin-bottom:3pt;line-height:1.2;">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin:4pt 0 6pt;line-height:1.2;">')
    .replace(/\n/g, '<br/>');
  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li.*>.*<\/li>(<br\/>)?)+/g, (match) => '<ul style="margin:4pt 0 6pt 18pt;padding:0;">' + match + '</ul>');
  return '<p style="margin:4pt 0 6pt;line-height:1.2;">' + html + '</p>';
}

function printSnapshot(caseItem, snapshot, generatedAt) {
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const cleanSnapshot = snapshot.replace(/<[^>]*>/g, '');
  const header = `<div style="font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:#000;margin-bottom:10pt;font-weight:bold;">Chaos Controller™ — Weekly Case Snapshot</div>
  <div style="font-size:14pt;font-weight:bold;margin-bottom:10pt;color:#000;">${caseItem.title}</div>
  <div style="font-size:10pt;color:#666;margin-bottom:12pt;">vs. ${caseItem.organisation_name || "Organisation"} | Ref: ${caseRef} | Generated: ${generatedAt}</div>`;
  const content = `<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:'Times New Roman',Times,serif;font-size:11pt;line-height:1.3;width:100%;max-width:100%;">${cleanSnapshot}</pre>`;
  const html = `<!DOCTYPE html><html><head><title>Weekly Snapshot — ${caseItem.title}</title>
  <style>${DOCUMENT_CSS}</style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="document-content" style="padding: 0 17.5mm;">${header}${content}</div>
    <div class="letterhead-footer"></div>
  </body></html>`;
  printDocument(html);
}

export default function WeeklySnapshot({ caseItem, evidence = [], events = [] }) {
  const [snapshot, setSnapshot] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    // Load cached snapshot
    try {
      const cached = localStorage.getItem(SNAPSHOT_CACHE_KEY(caseItem.id));
      if (cached) {
        const parsed = JSON.parse(cached);
        setSnapshot(parsed.snapshot);
        setGeneratedAt(parsed.generatedAt);
      }
    } catch (_) {}

    // Load deadlines
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

    const prompt = `You are a consumer advocacy case manager for Chaos Controller™, an Australian dispute resolution platform.

Generate a concise WEEKLY CASE SNAPSHOT report in Australian English for the following case. Format it clearly with headings using markdown (##, ###, bullet points). Be factual, professional, and actionable.

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

Please generate the snapshot with these sections:
## Weekly Status Summary
(2-3 sentences on where the case stands this week)

## Recent Activity
(bullet points of key developments in the past 7 days, or note if quiet)

## Upcoming Deadlines & Actions
(bullet points of what needs attention in the next 14 days)

## Risk Assessment
(brief assessment of any risks, overdue items, or escalation considerations)

## Recommended Next Steps
(3-5 concrete, numbered action items the user should take this week)`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    const ts = format(new Date(), "d MMM yyyy, h:mm a");
    setSnapshot(result);
    setGeneratedAt(ts);
    try {
      localStorage.setItem(SNAPSHOT_CACHE_KEY(caseItem.id), JSON.stringify({ snapshot: result, generatedAt: ts }));
    } catch (_) {}
    setLoading(false);
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
              <Button variant="outline" size="sm" onClick={() => printSnapshot(caseItem, snapshot, generatedAt)} className="gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
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
              <span className="text-xs text-muted-foreground">Generated: {generatedAt}</span>
            </div>
            <Badge variant="outline" className="text-xs">Week of {format(new Date(), "d MMM yyyy")}</Badge>
          </div>
          <div className="prose prose-sm max-w-none text-foreground [&>h2]:font-heading [&>h2]:font-bold [&>h2]:text-base [&>h2]:mt-5 [&>h2]:mb-2 [&>h3]:font-heading [&>h3]:font-semibold [&>h3]:text-sm [&>h3]:mt-4 [&>h3]:mb-1 [&>ul]:space-y-1 [&>ol]:space-y-1">
            <ReactMarkdown>{snapshot}</ReactMarkdown>
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