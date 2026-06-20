import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, CheckSquare, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { CONTACT } from "./LetterheadBanner";

function printChecklist(caseItem, evidence, events) {
  const checks = [
    { label: "Issue summary documented", done: !!(caseItem.issue_summary) },
    { label: "Full issue details recorded", done: !!(caseItem.issue_details) },
    { label: "Desired outcome stated", done: !!(caseItem.desired_outcome) },
    { label: "Complaint letter drafted", done: !!(caseItem.complaint_letter) },
    { label: "Evidence uploaded (1+ files)", done: evidence.length > 0 },
    { label: "Timeline started (1+ events)", done: events.length > 0 },
    { label: "Response deadline set", done: !!(caseItem.response_deadline) },
    { label: "Escalation body identified", done: !!(caseItem.escalation_body) },
    { label: "Complaint sent to organisation", done: ["complaint_sent", "awaiting_response", "response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
    { label: "Response received from organisation", done: ["response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
  ];

  const rows = checks.map((c) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:14pt;">${c.done ? "☑" : "☐"}</td>
      <td style="padding:6pt 8pt;font-size:12pt;">${c.label}</td>
      <td style="padding:6pt 8pt;font-size:11pt;font-weight:bold;${c.done ? "color:green;" : "color:#c00;"}">${c.done ? "COMPLETE" : "MISSING"}</td>
    </tr>
  `).join("");

  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>Checklist — ${caseItem.title}</title>
  <style>
    @page { margin: 25mm 20mm 20mm 20mm; size: A4; }
    body { margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; }
    h1 { font-size: 16pt; font-weight: bold; margin-bottom: 4pt; }
    h2 { font-size: 12pt; font-style: italic; color: #666; margin-bottom: 12pt; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
    th { text-align: left; padding: 5pt 8pt; font-size: 10pt; font-weight: bold; border-bottom: 2px solid #ddd; }
    td { padding: 4.5pt 8pt; border-bottom: 1px solid #eee; }
    .footer { margin-top: 30pt; padding-top: 8pt; border-top: 0.5pt solid #ccc; font-size: 8pt; color: #888; display: flex; justify-content: space-between; }
  </style>
  </head><body>
    <h1>Case Checklist</h1>
    <h2>${caseItem.title}</h2>
    <table>
      <thead><tr><th style="width:30pt;"></th><th>Item</th><th style="width:80pt;">Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>${CONTACT.website} | ${CONTACT.email}</span>
      <span>${caseRef} | ${now}</span>
    </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function printChecklistItems(caseItem, checklistItems) {
  const rows = checklistItems.map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:14pt;">${item.status === 'complete' ? '☑' : '☐'}</td>
      <td style="padding:6pt 8pt;font-size:12pt;${item.status === 'complete' ? 'text-decoration:line-through;color:#888;' : ''}">${item.label}</td>
      <td style="padding:6pt 8pt;font-size:11pt;text-transform:capitalize;">${(item.category || '').replace(/_/g, ' ')}</td>
      <td style="padding:6pt 8pt;font-size:11pt;font-weight:bold;${item.status === 'complete' ? 'color:green;' : item.status === 'missing' ? 'color:#c00;' : 'color:#f90;'}">${(item.status || '').replace('_', ' ').toUpperCase()}</td>
    </tr>`).join('');
  
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Smart Checklist — ${caseItem.title}</title>
  <style>
    @page { margin: 25mm 20mm 20mm 20mm; size: A4; }
    body { margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; }
    h1 { font-size: 16pt; font-weight: bold; margin-bottom: 4pt; }
    h2 { font-size: 12pt; font-style: italic; color: #666; margin-bottom: 12pt; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
    th { text-align: left; padding: 5pt 8pt; font-size: 10pt; font-weight: bold; border-bottom: 2px solid #ddd; }
    td { padding: 4.5pt 8pt; border-bottom: 1px solid #eee; }
    .footer { margin-top: 30pt; padding-top: 8pt; border-top: 0.5pt solid #ccc; font-size: 8pt; color: #888; display: flex; justify-content: space-between; }
  </style>
  </head><body>
    <h1>Smart Checklist</h1>
    <h2>${caseItem.title} · ${checklistItems.length} items</h2>
    <table>
      <thead><tr><th style="width:30pt;"></th><th>Action</th><th style="width:80pt;">Category</th><th style="width:70pt;">Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>${CONTACT.website} | ${CONTACT.email}</span>
      <span>${caseRef} | ${now}</span>
    </div>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

export default function CaseChecklist({ caseItem, evidence, events, checklistItems }) {


  const checks = [
    { label: "Issue summary documented", done: !!(caseItem.issue_summary) },
    { label: "Full issue details recorded", done: !!(caseItem.issue_details) },
    { label: "Desired outcome stated", done: !!(caseItem.desired_outcome) },
    { label: "Complaint letter drafted", done: !!(caseItem.complaint_letter) },
    { label: "Evidence uploaded (1+ files)", done: evidence.length > 0 },
    { label: "Timeline started (1+ events)", done: events.length > 0 },
    { label: "Response deadline set", done: !!(caseItem.response_deadline) },
    { label: "Escalation body identified", done: !!(caseItem.escalation_body) },
    { label: "Complaint sent to organisation", done: ["complaint_sent", "awaiting_response", "response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
    { label: "Response received from organisation", done: ["response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
  ];

  const readinessPct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-accent/30 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/15 rounded-lg">
              <CheckSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-heading font-bold text-base text-foreground">Case Checklist</p>
              <p className="text-xs text-muted-foreground">Track your case completion progress</p>
            </div>
          </div>
          <Button onClick={() => printChecklist(caseItem, evidence, events)} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>

        <div className="space-y-2">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${check.done ? 'border-success bg-success/10' : 'border-muted-foreground'}`}>
                  {check.done && <CheckSquare className="w-3 h-3 text-success" />}
                </div>
                <span className={`text-sm ${check.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{check.label}</span>
              </div>
              <span className={`text-xs font-semibold ${check.done ? 'text-success' : 'text-destructive'}`}>
                {check.done ? 'COMPLETE' : 'MISSING'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/40 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{readinessPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-primary" style={{ width: `${readinessPct}%` }} />
          </div>
        </div>
      </div>

      {checklistItems.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <ClipboardList className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">AI-Generated Action Items</p>
                <p className="text-xs text-muted-foreground">{checklistItems.length} tasks identified</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => printChecklistItems(caseItem, checklistItems)} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>

          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${item.status === 'complete' ? 'border-success bg-success/10' : item.status === 'missing' ? 'border-destructive' : 'border-warning'}`}>
                    {item.status === 'complete' && <CheckSquare className="w-3 h-3 text-success" />}
                  </div>
                  <span className={`text-sm flex-1 ${item.status === 'complete' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground capitalize">{item.category?.replace(/_/g, ' ')}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === 'complete' ? 'bg-success/10 text-success' : item.status === 'missing' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {item.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}