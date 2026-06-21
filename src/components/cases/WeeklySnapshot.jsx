import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Printer, CalendarDays, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, subDays, isAfter, isBefore, addDays } from "date-fns";
import { printDocument, DOCUMENT_CSS } from "@/lib/documentFormatEngine";

const SNAPSHOT_CACHE_KEY = (caseId) => `weekly_snapshot_${caseId}`;

/**
 * Clean and parse AI-generated markdown into clean document sections
 * This MUST run before saving or rendering to remove all markdown symbols
 */
function cleanSnapshotContent(md) {
  if (!md) return { sections: [] };
  
  // Remove all markdown formatting symbols
  let cleaned = md
    .replace(/\*\*/g, '')           // Remove bold markers
    .replace(/\*/g, '')             // Remove italic markers
    .replace(/^##\s+/gm, '')        // Remove ## headings
    .replace(/^###\s+/gm, '')       // Remove ### headings
    .replace(/^- /gm, '')           // Remove bullet points
    .replace(/^\d+\.\s+/gm, '')     // Remove numbered list markers
    .replace(/`/g, '')              // Remove code ticks
    .replace(/^>/gm, '')            // Remove blockquote markers
    .replace(/---/g, '')            // Remove horizontal rules
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text
    .trim();
  
  // Parse into structured sections
  const lines = cleaned.split('\n');
  const sections = [];
  let currentSection = { title: '', content: [] };
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if this looks like a section heading (short line, no period, capitalised)
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

/**
 * Render cleaned sections to HTML for print/PDF
 */
function renderSectionsToHtml(sections) {
  if (!sections || sections.length === 0) return '';
  
  return sections.map(section => {
    const titleHtml = section.title 
      ? `<div style="font-size:11pt;font-weight:bold;margin:14pt 0 6pt 0;color:#000;text-transform:uppercase;letter-spacing:0.5px;">${section.title}</div>`
      : '';
    const contentHtml = section.content
      ? `<div style="font-size:11pt;line-height:1.4;margin:6pt 0;color:#000;white-space:pre-wrap;word-wrap:break-word;">${section.content}</div>`
      : '';
    return titleHtml + contentHtml;
  }).join('');
}

function printSnapshot(caseItem, snapshot) {
  const { sections } = cleanSnapshotContent(snapshot);
  const today = format(new Date(), "d MMMM yyyy");
  
  // Build header in exact required format - NO "Generated:", NO ref, NO timestamp
  const headerHtml = `
    <div style="font-size:9pt;font-weight:bold;text-transform:uppercase;color:#000;margin-bottom:18pt;letter-spacing:1px;">CHAOS CONTROLLER™</div>
    <div style="font-size:14pt;font-weight:bold;color:#000;margin-bottom:4pt;">WEEKLY CASE SNAPSHOT</div>
    <div style="font-size:10pt;color:#000;margin:12pt 0 20pt 0;line-height:1.6;">
      <div style="margin-bottom:3pt;"><strong>Matter:</strong> ${caseItem.title}</div>
      <div style="margin-bottom:3pt;"><strong>Against:</strong> ${caseItem.organisation_name || "Organisation"}</div>
      <div><strong>Date:</strong> ${today}</div>
    </div>
    <div style="border-top:1px solid #000;margin-bottom:16pt;"></div>
  `;
  
  // Render sections
  const contentHtml = sections.map(section => {
    const titleHtml = section.title 
      ? `<div style="font-size:11pt;font-weight:bold;color:#000;margin:14pt 0 6pt 0;text-transform:uppercase;letter-spacing:0.5px;">${section.title}</div>`
      : '';
    const contentHtml = section.content
      ? `<div style="font-size:10.5pt;line-height:1.5;color:#000;margin:6pt 0;white-space:pre-wrap;word-wrap:break-word;">${section.content}</div>`
      : '';
    return titleHtml + contentHtml;
  }).join('');
  
  // Aggressive inline print CSS to kill ALL browser chrome
  const printCss = `
    @page { margin: 25mm 25mm 25mm 25mm !important; size: A4 !important; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
      html { -webkit-print-header: "" !important; -webkit-print-footer: "" !important; }
      body { -webkit-print-header: "" !important; -webkit-print-footer: "" !important; }
      nav, header, footer, aside, button, iframe, [class*="chrome"], [class*="url"], [class*="timestamp"], [class*="browser"], [class*="nav"], [class*="header"], [class*="footer"] { display: none !important; visibility: hidden !important; }
      a[href]:after, a[href] { content: none !important; display: none !important; }
      .no-print { display: none !important; }
    }
  `;
  
  const html = `<!DOCTYPE html><html><head>
    <title>Weekly Snapshot — ${caseItem.title}</title>
    <style>${DOCUMENT_CSS}${printCss}</style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="document-content">${headerHtml}${contentHtml}</div>
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

Generate a concise WEEKLY CASE SNAPSHOT report in Australian English for the following case. Use PLAIN TEXT ONLY — NO markdown symbols.

CRITICAL RULES:
- NO markdown: no ##, no ###, no **, no bullets, no numbered lists with dots
- NO timestamps or "Generated at" lines
- NO developer formatting
- Use UPPERCASE section titles on their own line
- Use normal paragraphs for content
- Australian English spelling

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
              <Button variant="outline" size="sm" onClick={() => printSnapshot(caseItem, snapshot)} className="gap-1.5">
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