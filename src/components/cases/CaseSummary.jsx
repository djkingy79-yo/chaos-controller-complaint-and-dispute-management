import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import { Printer, FileText, TrendingUp, AlertCircle, CheckCircle2, Clock, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateChaosDocumentPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";


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

function buildClientContext(caseItem, evidence) {
  return {
    name: caseItem.complainant_name || "",
    address: caseItem.complainant_address || "",
    email: caseItem.complainant_email || "",
    phone: caseItem.complainant_phone || "",
    accounts: caseItem.account_number ? [caseItem.account_number] : [],
  };
}

export default function CaseSummary({ caseItem, evidence, events }) {
  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseItem?.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem.id }),
    enabled: !!caseItem?.id,
  });

  const [executiveSummary, setExecutiveSummary] = useState(null);

  useEffect(() => {
    if (caseItem?.executive_summary) {
      try {
        setExecutiveSummary(JSON.parse(caseItem.executive_summary));
      } catch (e) {
        console.error("Failed to parse executive summary:", e);
      }
    }
  }, [caseItem?.executive_summary]);

  const today = format(new Date(), "d MMMM yyyy");
  const upcomingDeadlines = deadlines
    .filter((d) => d.status === "pending" && d.deadline_date)
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
    .slice(0, 5);

  const handleSummaryPDF = async () => {
    if (!caseItem) {
      toast.error('Case data not available');
      return;
    }
    
    const client = buildClientContext(caseItem, evidence);
    
    const summaryLines = [
      `Organisation: ${String(caseItem.organisation_name || "—")}`,
      `Status: ${String(STATUS_LABELS[caseItem.status] || caseItem.status || "—")}`,
      `Category: ${String(caseItem.category || "—")}`,
      `Priority: ${String(PRIORITY_LABELS[caseItem.priority] || caseItem.priority || "—")}`,
      `Complainant: ${String(client.name || "—")}`,
      `Account #: ${String(caseItem.account_number || "—")}`,
      `Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : "—"}`,
      `Escalation Body: ${String(caseItem.escalation_body || "—")}`,
    ].join("\n");

    const deadlineLines = upcomingDeadlines.length > 0
      ? upcomingDeadlines.map(d => {
          const daysLeft = differenceInDays(new Date(d.deadline_date), new Date());
          const urgency = daysLeft < 0 ? `OVERDUE (${Math.abs(daysLeft)}d)` : daysLeft === 0 ? "TODAY" : `${daysLeft} days`;
          return `${d.title} — Due: ${format(new Date(d.deadline_date), "d MMM yyyy")} | ${urgency}`;
        }).join("\n")
      : "No upcoming deadlines.";

    const body = `CASE DETAILS\n${summaryLines}\n\nISSUE SUMMARY\n${String(caseItem.issue_summary || "—")}\n\nDESIRED OUTCOME\n${String(caseItem.desired_outcome || "—")}\n\nUPCOMING DEADLINES (${upcomingDeadlines.length})\n${deadlineLines}`;

    try {
      const pdfBlob = await generateChaosDocumentPDF({
        documentType: 'general',
        title: 'Case Summary',
        body: String(body || '').trim(),
        includeHeader: true,
        includeFooter: true,
      });
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Case summary PDF downloaded');
    } catch (error) {
      console.error('[CaseSummary] PDF generation failed:', error);
      toast.error('PDF generation failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Case Summary</h3>
        <Button variant="outline" size="sm" onClick={handleSummaryPDF} className="gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" /> PDF
        </Button>
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

      {/* Issue Summary */}
      {caseItem.issue_summary && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Issue Summary</h4>
          <p className="text-sm text-foreground leading-relaxed">{caseItem.issue_summary}</p>
        </div>
      )}

      {/* Desired Outcome */}
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

      {/* AI Executive Summary */}
      {executiveSummary && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-lg text-foreground">AI Case Assessment</h3>
          </div>

          {/* Case Overview */}
          <div className="bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h4 className="font-heading font-bold text-base">Case Overview</h4>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {executiveSummary.summary}
            </p>
          </div>

          {/* Case Strength */}
          {executiveSummary.case_strength_assessment && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h4 className="font-heading font-bold text-base">Case Strength Assessment</h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {executiveSummary.case_strength_assessment}
              </p>
            </div>
          )}

          {/* Key Issues */}
          {executiveSummary.key_issues?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <h4 className="font-heading font-bold text-base">Key Issues</h4>
              </div>
              <ul className="space-y-2">
                {executiveSummary.key_issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-1.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence Analysis */}
          {executiveSummary.evidence_analysis?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h4 className="font-heading font-bold text-base">Evidence Highlights</h4>
              </div>
              <ul className="space-y-2">
                {executiveSummary.evidence_analysis.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Correspondence Summary */}
          {executiveSummary.correspondence_summary && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-primary" />
                <h4 className="font-heading font-bold text-base">Correspondence History</h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {executiveSummary.correspondence_summary}
              </p>
            </div>
          )}

          {/* Next Steps */}
          {executiveSummary.next_steps?.length > 0 && (
            <div className="bg-gradient-to-br from-accent/10 via-card to-primary/5 border border-accent/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <h4 className="font-heading font-bold text-base">Recommended Next Steps</h4>
              </div>
              <ul className="space-y-2">
                {executiveSummary.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Deadlines */}
          {executiveSummary.critical_deadlines?.length > 0 && (
            <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-destructive" />
                <h4 className="font-heading font-bold text-lg text-destructive">Critical Deadlines</h4>
              </div>
              <ul className="space-y-2">
                {executiveSummary.critical_deadlines.map((deadline, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm font-semibold text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{deadline}</span>
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