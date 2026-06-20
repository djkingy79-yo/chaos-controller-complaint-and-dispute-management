import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Clock, FolderOpen, Package, ClipboardList, Siren } from "lucide-react";
import { format } from "date-fns";
import { buildLetterheadHTML, buildFooterHTML, getLetterPageStyles, LETTERHEAD_URL } from "./LetterheadBanner";

// Times New Roman print styles injected once
const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #print-area, #print-area * { visibility: visible !important; }
    #print-area { position: fixed; left: 0; top: 0; width: 100%; }
    @page { margin: 2cm; }
  }
`;

function injectStyles() {
  if (!document.getElementById("chaos-print-styles")) {
    const style = document.createElement("style");
    style.id = "chaos-print-styles";
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
  }
}

function setPrintArea(html) {
  injectStyles();
  let area = document.getElementById("print-area");
  if (!area) {
    area = document.createElement("div");
    area.id = "print-area";
    document.body.appendChild(area);
  }
  area.innerHTML = html;
}

function baseStyles() {
  return `font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;line-height:1.6;`;
}

function h1(text) {
  return `<h1 style="font-size:17pt;font-weight:bold;margin-bottom:6pt;font-family:'Times New Roman',Times,serif;">${text}</h1>`;
}
function h2(text) {
  return `<h2 style="font-size:14pt;font-style:italic;margin-bottom:4pt;font-family:'Times New Roman',Times,serif;">${text}</h2>`;
}
// Use shared footer and letterhead from LetterheadBanner
function footer(caseItem, client, pageNum) {
  return buildFooterHTML(caseItem, client, pageNum);
}
function letterhead(caseItem, client, today) {
  return buildLetterheadHTML(caseItem, client, today);
}

function buildClientContext(caseItem, evidence) {
  const merged = {
    name: caseItem?.complainant_name || "",
    address: caseItem?.complainant_address || "",
    email: caseItem?.complainant_email || "",
    phone: caseItem?.complainant_phone || "",
    accounts: caseItem?.account_number ? [caseItem.account_number] : [],
    policies: [],
  };
  for (const ev of (evidence || [])) {
    const d = ev.extracted_data;
    if (!d) continue;
    if (!merged.name && d.complainant_name)       merged.name    = d.complainant_name;
    if (!merged.address && d.complainant_address) merged.address = d.complainant_address;
    if (!merged.email && d.complainant_email)     merged.email   = d.complainant_email;
    if (!merged.phone && d.complainant_phone)     merged.phone   = d.complainant_phone;
    if (d.account_numbers?.length)  merged.accounts = [...merged.accounts, ...d.account_numbers];
    if (d.policy_numbers?.length)   merged.policies = [...merged.policies, ...d.policy_numbers];
  }
  for (const k of ["accounts","policies"]) { if (merged[k]) merged[k] = [...new Set(merged[k])]; }
  return merged;
}

const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

function printLetter(caseItem, evidence, field = "complaint_letter", label = "1st Complaint Letter") {
  const today = format(new Date(), "d MMMM yyyy");
  const client = buildClientContext(caseItem, evidence);
  const content = caseItem[field] || `No ${label} generated yet.`;
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${label} — ${caseItem.title}</title>
  <style>${getLetterPageStyles()}</style>
  </head><body>
    <div class="letter-page">
      <div class="letter-content">
        <pre>${content}</pre>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function printTimeline(caseItem, events) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const rows = sorted.map((ev, i) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:11pt;white-space:nowrap;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
      <td style="padding:6pt 8pt;font-size:11pt;text-transform:capitalize;">${ev.event_type.replace("_", " ")}</td>
      <td style="padding:6pt 8pt;font-size:12pt;font-weight:bold;">${ev.title}</td>
      <td style="padding:6pt 8pt;font-size:11pt;color:#444;">${ev.description || ""}</td>
    </tr>
  `).join("");

  const client = buildClientContext(caseItem, []);
  const html = `<div style="${baseStyles()}">
    ${h1("Case Timeline — Chronological Order")}
    ${h2(caseItem.title)}
    <table style="width:100%;border-collapse:collapse;margin-top:12pt;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Date</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Type</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Event</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Details</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${footer(caseItem, client, 1)}
  </div>`;
  setPrintArea(html);
  window.print();
}

function printEvidence(caseItem, evidence) {
  const sorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const rows = sorted.map((ev, i) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:11pt;">${i + 1}</td>
      <td style="padding:6pt 8pt;font-size:12pt;font-weight:bold;">${ev.file_name}</td>
      <td style="padding:6pt 8pt;font-size:11pt;text-transform:capitalize;">${(ev.file_type || "").replace("_", " ")}</td>
      <td style="padding:6pt 8pt;font-size:11pt;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
      <td style="padding:6pt 8pt;font-size:11pt;color:#444;">${ev.description || ""}</td>
    </tr>
  `).join("");

  const client = buildClientContext(caseItem, evidence);
  const html = `<div style="${baseStyles()}">
    ${h1("Evidence Index")}
    ${h2(caseItem.title + " — " + (caseItem.organisation_name || ""))}
    <p style="font-size:11pt;margin-bottom:12pt;">Total evidence items: <strong>${evidence.length}</strong></p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">#</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">File Name</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Type</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Date</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Description</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${footer(caseItem, client, 1)}
  </div>`;
  setPrintArea(html);
  window.print();
}

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
    { label: "Complaint sent to organisation", done: ["complaint_sent","awaiting_response","response_received","escalation_ready","escalated","resolved"].includes(caseItem.status) },
    { label: "Response received from organisation", done: ["response_received","escalation_ready","escalated","resolved"].includes(caseItem.status) },
  ];

  const rows = checks.map((c) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:14pt;">${c.done ? "☑" : "☐"}</td>
      <td style="padding:6pt 8pt;font-size:12pt;${c.done ? "" : "color:#c00;"}">${c.label}</td>
      <td style="padding:6pt 8pt;font-size:11pt;font-weight:bold;${c.done ? "color:green;" : "color:#c00;"}">${c.done ? "COMPLETE" : "MISSING"}</td>
    </tr>
  `).join("");

  const client = buildClientContext(caseItem, evidence);
  const html = `<div style="${baseStyles()}">
    ${h1("Case Checklist")}
    ${h2(caseItem.title)}
    <table style="width:100%;border-collapse:collapse;margin-top:12pt;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="padding:6pt 8pt;font-size:11pt;"></th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Item</th>
          <th style="text-align:left;padding:6pt 8pt;font-size:11pt;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${footer(caseItem, client, 1)}
  </div>`;
  setPrintArea(html);
  window.print();
}

function printChecklistItems(caseItem, checklistItems) {
  const rows = checklistItems.map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:14pt;">${item.status === 'complete' ? '☑' : '☐'}</td>
      <td style="padding:6pt 8pt;font-size:12pt;${item.status === 'complete' ? 'text-decoration:line-through;color:#888;' : ''}">${item.label}</td>
      <td style="padding:6pt 8pt;font-size:11pt;text-transform:capitalize;">${(item.category||'').replace(/_/g,' ')}</td>
      <td style="padding:6pt 8pt;font-size:11pt;font-weight:bold;${item.status === 'complete' ? 'color:green;' : item.status === 'missing' ? 'color:#c00;' : 'color:#f90;'}">${(item.status||'').replace('_',' ').toUpperCase()}</td>
    </tr>`).join('');
  const client = buildClientContext(caseItem, []);
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Smart Checklist — ${caseItem.title}</title>
  <style>${getLetterPageStyles()}table{width:100%;border-collapse:collapse;margin-top:16pt;}th{background:#f0f0f0;text-align:left;padding:6pt 8pt;font-size:11pt;}</style>
  </head><body>
  <div class="letter-page"><div class="letter-content">
  <h2 class="section-title">Smart Checklist</h2>
  <p style="font-style:italic;color:#444;margin-bottom:4pt;">${caseItem.title}</p>
  <p style="font-size:10pt;color:#666;margin-bottom:10pt;">Printed: ${new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'long',year:'numeric'})}</p>
  <table><thead><tr><th></th><th>Item</th><th>Category</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table>
  </div></div></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function printDeadlineItems(caseItem, deadlines) {
  const sorted = [...deadlines].sort((a,b) => new Date(a.deadline_date||0) - new Date(b.deadline_date||0));
  const rows = sorted.map(d => {
    const daysLeft = d.deadline_date ? Math.round((new Date(d.deadline_date) - new Date()) / 86400000) : null;
    const urgency = daysLeft === null ? '—' : daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'TODAY' : `${daysLeft} days`;
    const color = daysLeft !== null && daysLeft < 0 ? '#c00' : daysLeft !== null && daysLeft <= 7 ? '#f90' : '#060';
    return `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:12pt;font-weight:bold;">${d.title}</td>
      <td style="padding:6pt 8pt;font-size:11pt;">${d.deadline_date ? format(new Date(d.deadline_date),'d MMM yyyy') : '—'}</td>
      <td style="padding:6pt 8pt;font-size:11pt;font-weight:bold;color:${color};">${urgency}</td>
      <td style="padding:6pt 8pt;font-size:11pt;text-transform:capitalize;">${(d.deadline_type||'').replace(/_/g,' ')}</td>
      <td style="padding:6pt 8pt;font-size:11pt;font-weight:bold;${d.status==='completed'?'color:green;':'color:#c00;'}">${(d.status||'').toUpperCase()}</td>
    </tr>`;
  }).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Deadlines — ${caseItem.title}</title>
  <style>${getLetterPageStyles()}table{width:100%;border-collapse:collapse;margin-top:16pt;}th{background:#f0f0f0;text-align:left;padding:6pt 8pt;font-size:11pt;}</style>
  </head><body>
  <div class="letter-page"><div class="letter-content">
  <h2 class="section-title">Deadline War Room</h2>
  <p style="font-style:italic;color:#444;margin-bottom:4pt;">${caseItem.title}</p>
  <p style="font-size:10pt;color:#666;margin-bottom:10pt;">Printed: ${new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'long',year:'numeric'})}</p>
  <table><thead><tr><th>Deadline</th><th>Date</th><th>Urgency</th><th>Type</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table>
  </div></div></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function printBundle(caseItem, evidence, events) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const evSorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const client = buildClientContext(caseItem, evidence);

  const checks = [
    { label: "Issue summary documented", done: !!(caseItem.issue_summary) },
    { label: "Full issue details recorded", done: !!(caseItem.issue_details) },
    { label: "Desired outcome stated", done: !!(caseItem.desired_outcome) },
    { label: "Complaint letter drafted", done: !!(caseItem.complaint_letter) },
    { label: "Evidence uploaded (1+ files)", done: evidence.length > 0 },
    { label: "Timeline started (1+ events)", done: events.length > 0 },
    { label: "Response deadline set", done: !!(caseItem.response_deadline) },
    { label: "Escalation body identified", done: !!(caseItem.escalation_body) },
    { label: "Complaint sent to organisation", done: ["complaint_sent","awaiting_response","response_received","escalation_ready","escalated","resolved"].includes(caseItem.status) },
    { label: "Response received from organisation", done: ["response_received","escalation_ready","escalated","resolved"].includes(caseItem.status) },
  ];

  const pageBreak = `<div style="page-break-before:always;"></div>`;

  const today = format(new Date(), "d MMMM yyyy");
  const docDate = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Build case summary rows — only show fields that have data
  const summaryRows = [
    { label: "Complainant Name", value: client.name },
    { label: "Complainant Address", value: client.address },
    { label: "Complainant Email", value: client.email },
    { label: "Complainant Phone", value: client.phone },
    { label: "Organisation", value: caseItem.organisation_name },
    { label: "Complaints Address", value: caseItem.organisation_complaints_address },
    { label: "Complaints Email", value: caseItem.organisation_complaints_email },
    { label: "Complaint Handler", value: caseItem.complaint_handler_name },
    { label: "Account / Reference No.", value: caseItem.account_number || (client.accounts?.length ? client.accounts.join(", ") : null) },
    { label: "Industry / Category", value: caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : null },
    { label: "Incident Date", value: caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : null },
    { label: "Case Status", value: (caseItem.status || "").replace(/_/g, " ") },
    { label: "Priority", value: caseItem.priority },
    { label: "Response Deadline", value: caseItem.response_deadline ? format(new Date(caseItem.response_deadline), "d MMMM yyyy") : null },
    { label: "Escalation Body", value: caseItem.escalation_body },
  ].filter(r => r.value);

  const summaryTableRows = summaryRows.map(r => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:5pt 8pt;font-size:11pt;color:#555;width:35%;font-style:italic;">${r.label}</td>
      <td style="padding:5pt 8pt;font-size:12pt;font-weight:bold;word-break:break-word;">${r.value}</td>
    </tr>
  `).join("");

  const html = `<div style="${baseStyles()}">
    <!-- COVER PAGE -->
    <div style="background:#000;line-height:0;">
      <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9d65d2d51_IMG_6994.jpeg" style="width:100%;display:block;max-height:120px;object-fit:cover;" />
    </div>

    <!-- Blue header bar with case info -->
    <div style="background:#1d4ed8;color:white;padding:20pt 2cm;margin:0;">
      <div style="font-size:24pt;font-weight:bold;margin-bottom:8pt;font-family:'Times New Roman',Times,serif;">ESCALATION BUNDLE</div>
      <div style="font-size:12pt;margin-bottom:4pt;font-family:'Times New Roman',Times,serif;">${today}</div>
      <div style="font-size:12pt;font-family:'Times New Roman',Times,serif;">chaoscontroller.com.au</div>
    </div>

    <div style="padding:32pt 2cm 0 2cm;">
      <hr style="border:none;border-top:2.5px solid #1d4ed8;margin-bottom:20pt;"/>
      <div style="font-size:22pt;font-weight:bold;margin-bottom:6pt;font-family:'Times New Roman',Times,serif;">${caseItem.title}</div>
      <div style="font-size:14pt;font-style:italic;margin-bottom:20pt;color:#444;font-family:'Times New Roman',Times,serif;">vs. ${caseItem.organisation_name || "Organisation"}</div>
      <hr style="border:none;border-top:1px solid #ccc;margin-bottom:20pt;"/>

      <div style="font-size:14pt;font-weight:bold;margin-bottom:12pt;font-family:'Times New Roman',Times,serif;">Case Summary</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24pt;">
        <tbody>${summaryTableRows}</tbody>
      </table>

      ${caseItem.issue_summary ? `
        <div style="margin-bottom:12pt;">
          <div style="font-size:12pt;font-weight:bold;margin-bottom:4pt;font-family:'Times New Roman',Times,serif;">Issue Summary</div>
          <div style="font-size:12pt;color:#333;">${caseItem.issue_summary}</div>
        </div>` : ""}
      ${caseItem.desired_outcome ? `
        <div style="margin-bottom:20pt;">
          <div style="font-size:12pt;font-weight:bold;margin-bottom:4pt;font-family:'Times New Roman',Times,serif;">Desired Outcome</div>
          <div style="font-size:12pt;color:#333;">${caseItem.desired_outcome}</div>
        </div>` : ""}

      <hr style="border:none;border-top:1px solid #ccc;margin-bottom:12pt;"/>
      <div style="font-size:11pt;font-style:italic;color:#555;margin-bottom:6pt;font-family:'Times New Roman',Times,serif;"><strong>Bundle Contents:</strong></div>
      <ul style="font-size:11pt;color:#333;margin:0;padding-left:20pt;font-family:'Times New Roman',Times,serif;">
        <li style="margin-bottom:4pt;">Section 1 — Escalation Readiness Checklist</li>
        <li style="margin-bottom:4pt;">Section 2 — Chronological Timeline</li>
        <li style="margin-bottom:4pt;">Section 3 — Evidence Index</li>
        <li style="margin-bottom:4pt;">Section 4 — Complaint Letter</li>
      </ul>
    </div>

    ${buildFooterHTML(caseItem, client, "", "")}

    ${pageBreak}

    <!-- SECTION 1: CHECKLIST -->
    <div style="background:#1d4ed8;color:white;padding:12pt 2cm;margin:0 -2cm;margin-bottom:20pt;">
      <div style="font-size:16pt;font-weight:bold;font-family:'Times New Roman',Times,serif;">Section 1 — Escalation Readiness Checklist</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:12pt;">
      <thead><tr style="background:#f0f0f0;">
        <th style="padding:6pt 8pt;font-size:11pt;"></th>
        <th style="text-align:left;padding:6pt 8pt;">Item</th>
        <th style="text-align:left;padding:6pt 8pt;">Status</th>
      </tr></thead>
      <tbody>${checks.map(c => `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:6pt 8pt;font-size:14pt;">${c.done ? "☑" : "☐"}</td>
        <td style="padding:6pt 8pt;font-size:12pt;">${c.label}</td>
        <td style="padding:6pt 8pt;font-weight:bold;${c.done ? "color:green;" : "color:#c00;"}">${c.done ? "COMPLETE" : "MISSING"}</td>
      </tr>`).join("")}</tbody>
    </table>
    ${buildFooterHTML(caseItem, client, 2, 5)}

    ${pageBreak}

    <!-- SECTION 2: TIMELINE -->
    <div style="background:#1d4ed8;color:white;padding:12pt 2cm;margin:0 -2cm;margin-bottom:20pt;">
      <div style="font-size:16pt;font-weight:bold;font-family:'Times New Roman',Times,serif;">Section 2 — Chronological Timeline</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:12pt;">
      <thead><tr style="background:#f0f0f0;">
        <th style="text-align:left;padding:6pt 8pt;">Date</th>
        <th style="text-align:left;padding:6pt 8pt;">Type</th>
        <th style="text-align:left;padding:6pt 8pt;">Event</th>
        <th style="text-align:left;padding:6pt 8pt;">Details</th>
      </tr></thead>
      <tbody>${sorted.map(ev => `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:6pt 8pt;white-space:nowrap;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
        <td style="padding:6pt 8pt;text-transform:capitalize;">${(ev.event_type||"").replace(/_/g," ")}</td>
        <td style="padding:6pt 8pt;font-weight:bold;">${ev.title}</td>
        <td style="padding:6pt 8pt;color:#444;">${ev.description || ""}</td>
      </tr>`).join("")}</tbody>
    </table>
    ${buildFooterHTML(caseItem, client, 3, 5)}

    ${pageBreak}

    <!-- SECTION 3: EVIDENCE INDEX -->
    <div style="background:#1d4ed8;color:white;padding:12pt 2cm;margin:0 -2cm;margin-bottom:20pt;">
      <div style="font-size:16pt;font-weight:bold;font-family:'Times New Roman',Times,serif;">Section 3 — Evidence Index</div>
    </div>
    <p style="margin-bottom:12pt;">Total items: <strong>${evidence.length}</strong></p>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f0f0f0;">
        <th style="text-align:left;padding:6pt 8pt;">#</th>
        <th style="text-align:left;padding:6pt 8pt;">File</th>
        <th style="text-align:left;padding:6pt 8pt;">Type</th>
        <th style="text-align:left;padding:6pt 8pt;">Date</th>
        <th style="text-align:left;padding:6pt 8pt;">Description</th>
      </tr></thead>
      <tbody>${evSorted.map((ev, i) => `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:6pt 8pt;">${i + 1}</td>
        <td style="padding:6pt 8pt;font-weight:bold;">${ev.file_name}</td>
        <td style="padding:6pt 8pt;text-transform:capitalize;">${(ev.file_type||"").replace(/_/g," ")}</td>
        <td style="padding:6pt 8pt;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
        <td style="padding:6pt 8pt;color:#444;">${ev.description || ""}</td>
      </tr>`).join("")}</tbody>
    </table>
    ${buildFooterHTML(caseItem, client, 4, 5)}

    ${pageBreak}

    ${LETTER_DEFS.map((ld, idx) => {
      const content = caseItem[ld.field];
      if (!content) return "";
      const sectionNum = idx + 4;
      return `${pageBreak}
    <div style="position:relative;width:210mm;min-height:297mm;background-image:url('${LETTERHEAD_URL}');background-size:100% 100%;background-repeat:no-repeat;font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;">
      <div style="padding:52mm 18mm 42mm 18mm;min-height:297mm;">
        <h2 class="section-title">Section ${sectionNum} — ${ld.label}</h2>
        <pre>${content}</pre>
      </div>
    </div>`;
    }).join("")}
  </div>`;
  setPrintArea(html);
  window.print();
}

export default function PrintBundle({ caseItem, evidence, events }) {
  const [checklistItems, setChecklistItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    if (!caseItem?.id) return;
    base44.entities.ChecklistItem.filter({ case_id: caseItem.id }).then(setChecklistItems).catch(() => {});
    base44.entities.Deadline.filter({ case_id: caseItem.id }).then(setDeadlines).catch(() => {});
  }, [caseItem?.id]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Print & Export</h3>
        <p className="text-xs text-muted-foreground">Print individual documents or the full case bundle. All documents use Times New Roman formatting with proper headings, footers, and legal disclaimers.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {LETTER_DEFS.map((ld) => (
          <button
            key={ld.field}
            onClick={() => printLetter(caseItem, evidence, ld.field, ld.label)}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-sm text-foreground">{ld.label}</span>
              <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground">
              {caseItem[ld.field] ? "Print letter with letterhead & footer" : "Not yet generated"}
            </p>
          </button>
        ))}

        <button
          onClick={() => printTimeline(caseItem, events)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
          style={{gridColumn: "1 / -1"}}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <span className="font-medium text-sm text-foreground">Chronological Timeline</span>
            <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground">Print every event in date order — the accountability record</p>
        </button>

        <button
          onClick={() => printEvidence(caseItem, evidence)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <FolderOpen className="w-4 h-4 text-success" />
            </div>
            <span className="font-medium text-sm text-foreground">Evidence Index</span>
            <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground">Print the indexed evidence list with dates and descriptions</p>
        </button>

        <button
          onClick={() => printChecklist(caseItem, evidence, events)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            <span className="font-medium text-sm text-foreground">Case Checklist</span>
            <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground">Print completion checklist — what's done, what's missing</p>
        </button>

        <button
          onClick={() => printChecklistItems(caseItem, checklistItems)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/20 rounded-lg">
              <ClipboardList className="w-4 h-4 text-accent" />
            </div>
            <span className="font-medium text-sm text-foreground">Smart Checklist</span>
            <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground">Print AI-generated action items ({checklistItems.length} items)</p>
        </button>

        <button
          onClick={() => printDeadlineItems(caseItem, deadlines)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
          style={{gridColumn: "1 / -1"}}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Siren className="w-4 h-4 text-destructive" />
            </div>
            <span className="font-medium text-sm text-foreground">Deadline War Room</span>
            <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground">Print all deadlines with urgency status ({deadlines.length} deadlines)</p>
        </button>

      </div>

      {/* Full Bundle */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Full Case Bundle — Formal Submission PDF</p>
            <p className="text-xs text-muted-foreground">Cover page · Summary · Timeline · Evidence Index · All letters — ready to print or save as PDF for email submission</p>
          </div>
        </div>
        <Button
          onClick={() => printBundle(caseItem, evidence, events)}
          className="w-full gap-2 mb-2"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
        <p className="text-xs text-muted-foreground text-center bg-muted/40 rounded-lg py-2 px-3">
          💡 <strong>To save as PDF:</strong> In the print dialog, choose <strong>"Save as PDF"</strong> as the destination — then attach the file to your email submission to AFCA, NCAT, TIO or any tribunal.
        </p>
      </div>
    </div>
  );
}