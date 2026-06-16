import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildLetterheadHTML, buildFooterHTML } from "./LetterheadBanner";

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
    queryKey: ["deadlines", caseItem.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem.id }),
  });

  const today = format(new Date(), "d MMMM yyyy");
  const upcomingDeadlines = deadlines
    .filter((d) => d.status === "pending" && d.deadline_date)
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
    .slice(0, 5);

  const handlePrint = () => {
    const client = buildClientContext(caseItem, evidence);

    const deadlineRows = upcomingDeadlines.length
      ? upcomingDeadlines.map((d) => {
          const daysLeft = differenceInDays(new Date(d.deadline_date), new Date());
          const overdue = daysLeft < 0;
          return `<tr style="border-bottom:1px solid #eee;">
            <td style="padding:5pt 8pt;font-size:11pt;font-weight:bold;">${d.title}</td>
            <td style="padding:5pt 8pt;font-size:11pt;">${format(new Date(d.deadline_date), "d MMM yyyy")}</td>
            <td style="padding:5pt 8pt;font-size:10pt;text-transform:capitalize;">${(d.deadline_type || "").replace(/_/g, " ")}</td>
            <td style="padding:5pt 8pt;font-size:11pt;font-weight:bold;color:${overdue ? "#c00" : daysLeft <= 7 ? "#d97706" : "#166534"};">
              ${overdue ? `OVERDUE (${Math.abs(daysLeft)}d)` : daysLeft === 0 ? "TODAY" : `${daysLeft} days`}
            </td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" style="padding:8pt;font-size:11pt;color:#888;font-style:italic;">No upcoming deadlines.</td></tr>`;

    const html = `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;line-height:1.6;">
      ${buildLetterheadHTML(caseItem, client, today)}

      <h1 style="font-size:17pt;font-weight:bold;margin-bottom:4pt;">Case Summary</h1>
      <h2 style="font-size:14pt;font-style:italic;margin-bottom:16pt;">${caseItem.title}</h2>

      <!-- Case Info Grid -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:18pt;">
        <tr>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;width:30%;">Organisation</td>
          <td style="padding:5pt 8pt;font-size:11pt;font-weight:bold;">${caseItem.organisation_name || "—"}</td>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;width:20%;">Status</td>
          <td style="padding:5pt 8pt;font-size:11pt;font-weight:bold;">${STATUS_LABELS[caseItem.status] || caseItem.status}</td>
        </tr>
        <tr>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;">Category</td>
          <td style="padding:5pt 8pt;font-size:11pt;text-transform:capitalize;">${caseItem.category}</td>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;">Priority</td>
          <td style="padding:5pt 8pt;font-size:11pt;">${PRIORITY_LABELS[caseItem.priority] || caseItem.priority || "—"}</td>
        </tr>
        <tr>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;">Complainant</td>
          <td style="padding:5pt 8pt;font-size:11pt;">${client.name || "—"}</td>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;">Account #</td>
          <td style="padding:5pt 8pt;font-size:11pt;word-break:break-word;">${caseItem.account_number || "—"}</td>
        </tr>
        <tr>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;">Incident Date</td>
          <td style="padding:5pt 8pt;font-size:11pt;">${caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : "—"}</td>
          <td style="padding:5pt 8pt;background:#f8fafc;font-size:10pt;color:#555;">Escalation Body</td>
          <td style="padding:5pt 8pt;font-size:11pt;">${caseItem.escalation_body || "—"}</td>
        </tr>
      </table>

      <!-- Stats Row -->
      <div style="display:flex;gap:16pt;margin-bottom:18pt;">
        <div style="flex:1;border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt 14pt;text-align:center;">
          <div style="font-size:22pt;font-weight:bold;color:#1d4ed8;">${evidence.length}</div>
          <div style="font-size:9pt;color:#555;margin-top:2pt;">Evidence Files</div>
        </div>
        <div style="flex:1;border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt 14pt;text-align:center;">
          <div style="font-size:22pt;font-weight:bold;color:#7c3aed;">${events.length}</div>
          <div style="font-size:9pt;color:#555;margin-top:2pt;">Timeline Events</div>
        </div>
        <div style="flex:1;border:1pt solid #e2e8f0;border-radius:6pt;padding:10pt 14pt;text-align:center;">
          <div style="font-size:22pt;font-weight:bold;color:#d97706;">${upcomingDeadlines.length}</div>
          <div style="font-size:9pt;color:#555;margin-top:2pt;">Upcoming Deadlines</div>
        </div>
      </div>

      <!-- Issue Summary -->
      ${caseItem.issue_summary ? `
      <h3 style="font-size:13pt;font-weight:bold;font-style:italic;margin-bottom:4pt;">Issue Summary</h3>
      <p style="font-size:11pt;margin-bottom:16pt;">${caseItem.issue_summary}</p>` : ""}

      <!-- Desired Outcome -->
      ${caseItem.desired_outcome ? `
      <h3 style="font-size:13pt;font-weight:bold;font-style:italic;margin-bottom:4pt;">Desired Outcome</h3>
      <p style="font-size:11pt;margin-bottom:16pt;">${caseItem.desired_outcome}</p>` : ""}

      <!-- Upcoming Deadlines -->
      <h3 style="font-size:13pt;font-weight:bold;font-style:italic;margin-bottom:6pt;">Upcoming Deadlines</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18pt;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="text-align:left;padding:5pt 8pt;font-size:10pt;">Title</th>
            <th style="text-align:left;padding:5pt 8pt;font-size:10pt;">Due Date</th>
            <th style="text-align:left;padding:5pt 8pt;font-size:10pt;">Type</th>
            <th style="text-align:left;padding:5pt 8pt;font-size:10pt;">Days Remaining</th>
          </tr>
        </thead>
        <tbody>${deadlineRows}</tbody>
      </table>

      ${buildFooterHTML(caseItem, client, 1)}
    </div>`;

    if (!document.getElementById("cc-summary-print-style")) {
      const s = document.createElement("style");
      s.id = "cc-summary-print-style";
      s.innerHTML = `@media print { body * { visibility:hidden !important; } #cc-summary-print, #cc-summary-print * { visibility:visible !important; } #cc-summary-print { position:fixed;left:0;top:0;width:100%; } @page { margin:2cm; } }`;
      document.head.appendChild(s);
    }
    let area = document.getElementById("cc-summary-print");
    if (!area) { area = document.createElement("div"); area.id = "cc-summary-print"; document.body.appendChild(area); }
    area.innerHTML = html;
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Case Summary</h3>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
          <Printer className="w-3.5 h-3.5" /> Print Summary
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
    </div>
  );
}