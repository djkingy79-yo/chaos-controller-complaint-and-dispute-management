import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, CheckSquare, ClipboardList, Download } from "lucide-react";
import { format } from "date-fns";
import { CONTACT } from "./LetterheadBanner";
import { generateChaosDocumentPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

async function printChecklistPDF(caseItem, evidence, events) {
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

  const body = checks.map(c => `${c.done ? "☑" : "☐"} ${c.label} — ${c.done ? "COMPLETE" : "MISSING"}`).join("\n");
  
  try {
    const pdfBlob = await generateChaosDocumentPDF({
      documentType: 'general',
      title: 'Case Checklist',
      body: `CASE CHECKLIST\n\n${body}`,
      includeHeader: true,
      includeFooter: true,
    });
    
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Checklist_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Checklist PDF downloaded');
  } catch (error) {
    toast.error('PDF generation failed: ' + error.message);
  }
}

async function printChecklistItemsPDF(caseItem, checklistItems) {
  const body = checklistItems.map(item => {
    const statusMark = item.status === 'complete' ? '☑' : '☐';
    const statusText = (item.status || '').toUpperCase();
    return `${statusMark} ${item.label}\n   Category: ${(item.category || '').replace(/_/g, ' ')} | Status: ${statusText}`;
  }).join("\n\n");

  try {
    const pdfBlob = await generateChaosDocumentPDF({
      documentType: 'general',
      title: 'Smart Checklist',
      body: `SMART CHECKLIST (${checklistItems.length} items)\n\n${body}`,
      includeHeader: true,
      includeFooter: true,
    });
    
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartChecklist_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Smart checklist PDF downloaded');
  } catch (error) {
    toast.error('PDF generation failed: ' + error.message);
  }
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
          <Button onClick={() => printChecklistPDF(caseItem, evidence, events)} className="gap-2">
            <Download className="w-4 h-4" /> PDF
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
            <Button variant="outline" onClick={() => printChecklistItemsPDF(caseItem, checklistItems)} className="gap-2">
              <Download className="w-4 h-4" /> PDF
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