import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Clock, FolderOpen, Package, ClipboardList, Siren } from "lucide-react";
import { format } from "date-fns";
import { buildLetterheadHTML, buildFooterHTML, getLetterPageStyles, LETTERHEAD_URL, CONTINUATION_PAGE_URL } from "./LetterheadBanner";

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
  const client = buildClientContext(caseItem, evidence);
  const content = caseItem[field] || `No ${label} generated yet.`;
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const footerText = `${LETTERHEAD_URL ? '' : ''}www.chaoscontroller.com.au | chaoscontrollerapp@gmail.com | 0413 572 850 &nbsp;|&nbsp; ${caseRef} &nbsp;|&nbsp; ${now}`;
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${label} — ${caseItem.title}</title>
  <style>${getLetterPageStyles()}</style>
  </head><body>
    <div class="letter-page">
      <div class="letter-content">
        <pre>${content}</pre>
      </div>
    </div>
    <div class="letter-footer">${footerText}</div>
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
  <style>${getLetterPageStyles()}</style>
  </head><body>
  <div class="letter-page">
  <div class="letter-header"><img src="${LETTERHEAD_URL}" alt="Chaos Controller" /></div>
  <div class="letter-content">
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
  <style>${getLetterPageStyles()}</style>
  </head><body>
  <div class="letter-page">
  <div class="letter-header"><img src="${LETTERHEAD_URL}" alt="Chaos Controller" /></div>
  <div class="letter-content">
  <h2 class="section-title">Deadline War Room</h2>
  <p style="font-style:italic;color:#444;margin-bottom:4pt;">${caseItem.title}</p>
  <p style="font-size:10pt;color:#666;margin-bottom:10pt;">Printed: ${new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'long',year:'numeric'})}</p>
  <table><thead><tr><th>Deadline</th><th>Date</th><th>Urgency</th><th>Type</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table>
  </div></div></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function printBundle(caseItem, evidence, events, checklistItems) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const evSorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const client = buildClientContext(caseItem, evidence);
  const today = format(new Date(), "d MMMM yyyy");
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const pageBreak = `<div style="page-break-before:always;"></div>`;

  // Which letters exist
  const presentLetters = LETTER_DEFS.filter(ld => caseItem[ld.field]);

  // Build TOC sections list
  const tocSections = [
    { num: 1, title: "Case Summary", sub: "Parties, incident details & desired outcome" },
    { num: 2, title: "Escalation Readiness Checklist", sub: "Completion status of key case steps" },
    { num: 3, title: "Chronological Timeline", sub: `${events.length} recorded events` },
    { num: 4, title: "Evidence Index", sub: `${evidence.length} documents on file` },
    { num: 5, title: "Smart Checklist", sub: `${checklistItems.length} action items` },
    ...presentLetters.map((ld, i) => ({ num: 6 + i, title: ld.label, sub: "Formal correspondence" })),
  ];

  // Case summary rows
  const summaryRows = [
    { label: "Complainant Name", value: client.name },
    { label: "Complainant Address", value: client.address },
    { label: "Complainant Email", value: client.email },
    { label: "Complainant Phone", value: client.phone },
    { label: "Organisation", value: caseItem.organisation_name },
    { label: "Complaints Email", value: caseItem.organisation_complaints_email },
    { label: "Complaint Handler", value: caseItem.complaint_handler_name },
    { label: "Account / Reference No.", value: caseItem.account_number || client.accounts?.join(", ") },
    { label: "Category", value: caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : null },
    { label: "Incident Date", value: caseItem.incident_date ? format(new Date(caseItem.incident_date), "d MMMM yyyy") : null },
    { label: "Case Status", value: (caseItem.status || "").replace(/_/g, " ").toUpperCase() },
    { label: "Priority", value: (caseItem.priority || "").toUpperCase() },
    { label: "Response Deadline", value: caseItem.response_deadline ? format(new Date(caseItem.response_deadline), "d MMMM yyyy") : null },
    { label: "Escalation Body", value: caseItem.escalation_body },
    { label: "Case Reference", value: caseRef },
    { label: "Bundle Generated", value: today },
  ].filter(r => r.value);

  const readinessChecks = [
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
  const readinessPct = Math.round((readinessChecks.filter(c => c.done).length / readinessChecks.length) * 100);

  const sectionHeader = (num, title) => `
    <div style="background:#1a1a2e;color:white;padding:10pt 18pt;margin-bottom:16pt;border-left:5px solid #FFD700;">
      <div style="font-size:9pt;color:#FFD700;font-family:'Times New Roman',Times,serif;letter-spacing:2px;text-transform:uppercase;margin-bottom:2pt;">Section ${num}</div>
      <div style="font-size:15pt;font-weight:bold;font-family:'Times New Roman',Times,serif;">${title}</div>
    </div>`;

  const foot = (pg) => buildFooterHTML(caseItem, client, pg, "");

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Case Bundle — ${caseItem.title}</title>
    <style>
      ${getLetterPageStyles()}
      .cover-page {
        width: 210mm; min-height: 297mm; page-break-after: always;
        background-image: url('${LETTERHEAD_URL}');
        background-size: 100% 100%; background-repeat: no-repeat;
        display: flex; flex-direction: column;
      }
      .toc-page {
        width: 210mm; min-height: 297mm; page-break-after: always;
        background-image: url('${CONTINUATION_PAGE_URL}');
        background-size: 100% 100%; background-repeat: no-repeat;
      }
      .section-page {
        width: 210mm; min-height: 297mm; page-break-before: always;
        background-image: url('${CONTINUATION_PAGE_URL}');
        background-size: 100% 100%; background-repeat: no-repeat;
      }
      .page-body { padding: 38mm 22mm 32mm 22mm; font-family:'Times New Roman',Times,serif; font-size:11pt; color:#111; line-height:1.6; }
      .cover-body { padding: 76mm 22mm 38mm 22mm; font-family:'Times New Roman',Times,serif; font-size:11pt; color:#111; line-height:1.6; }
      table { width:100%; border-collapse:collapse; font-size:10.5pt; margin-top:8pt; }
      th { background:#f4f4f4; text-align:left; padding:5pt 8pt; font-weight:bold; border-bottom:2px solid #ddd; }
      td { padding:4.5pt 8pt; border-bottom:1px solid #eee; vertical-align:top; }
      pre { white-space:pre-wrap; font-family:'Times New Roman',Times,serif; font-size:10.5pt; line-height:1.6; margin:0; }
      .toc-row { display:flex; align-items:baseline; padding:7pt 0; border-bottom:1px dotted #ccc; }
      .toc-num { font-weight:bold; color:#1a1a2e; min-width:28pt; font-size:11pt; }
      .toc-title { font-size:11pt; font-weight:bold; flex:1; }
      .toc-sub { font-size:9pt; color:#666; margin-top:1pt; }
    </style>
  </head><body>

  <!-- ═══════════════════ TITLE PAGE ═══════════════════ -->
  <div class="cover-page">
    <div class="cover-body" style="display:flex;flex-direction:column;justify-content:space-between;min-height:183mm;">
      <!-- Top: case title block -->
      <div>
        <div style="font-size:9pt;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:12pt;font-family:'Times New Roman',Times,serif;">Chaos Controller™ — Formal Case Bundle</div>
        <div style="border-left:5px solid #1a1a2e;padding-left:14pt;margin-bottom:20pt;">
          <div style="font-size:22pt;font-weight:bold;line-height:1.2;margin-bottom:6pt;font-family:'Times New Roman',Times,serif;">${caseItem.title}</div>
          <div style="font-size:13pt;color:#444;font-style:italic;font-family:'Times New Roman',Times,serif;">vs. ${caseItem.organisation_name || "Organisation"}</div>
        </div>
        <div style="background:#f8f8f8;border:1px solid #ddd;padding:12pt 14pt;border-radius:4pt;margin-bottom:20pt;">
          <table style="margin:0;border:none;">
            ${summaryRows.map(r => `<tr>
              <td style="border:none;padding:2pt 12pt 2pt 0;color:#666;font-style:italic;font-size:10pt;white-space:nowrap;width:35%;">${r.label}</td>
              <td style="border:none;padding:2pt 0;font-weight:bold;font-size:10.5pt;">${r.value}</td>
            </tr>`).join("")}
          </table>
        </div>
        ${caseItem.issue_summary ? `<div style="margin-bottom:14pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Issue Summary</div><div style="font-size:11pt;line-height:1.5;">${caseItem.issue_summary}</div></div>` : ""}
        ${caseItem.desired_outcome ? `<div style="margin-bottom:14pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Desired Outcome</div><div style="font-size:11pt;line-height:1.5;">${caseItem.desired_outcome}</div></div>` : ""}
      </div>
      <!-- Bottom: readiness meter -->
      <div style="border-top:1px solid #ddd;padding-top:12pt;">
        <div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:6pt;">Escalation Readiness</div>
        <div style="background:#eee;height:10pt;border-radius:5pt;overflow:hidden;margin-bottom:4pt;">
          <div style="height:10pt;width:${readinessPct}%;background:linear-gradient(to right,#1a1a2e,#FFD700);border-radius:5pt;"></div>
        </div>
        <div style="font-size:10pt;font-weight:bold;color:#1a1a2e;">${readinessPct}% Ready — ${readinessChecks.filter(c=>c.done).length}/${readinessChecks.length} steps complete</div>
        <div style="font-size:9pt;color:#888;margin-top:2pt;">Bundle generated: ${today} · Ref: ${caseRef}</div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════ TABLE OF CONTENTS ═══════════════════ -->
  <div class="toc-page">
    <div class="page-body">
      <div style="font-size:18pt;font-weight:bold;margin-bottom:4pt;font-family:'Times New Roman',Times,serif;">Table of Contents</div>
      <div style="font-size:10pt;color:#888;margin-bottom:20pt;">${caseItem.title} — ${today}</div>
      <div>
        ${tocSections.map(s => `
          <div class="toc-row">
            <div class="toc-num">${s.num}.</div>
            <div style="flex:1;">
              <div class="toc-title">${s.title}</div>
              <div class="toc-sub">${s.sub}</div>
            </div>
          </div>`).join("")}
      </div>
      ${foot(2)}
    </div>
  </div>

  <!-- ═══════════════════ SECTION 1: CASE SUMMARY ═══════════════════ -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(1, "Case Summary")}
      <table>
        <tbody>${summaryRows.map(r=>`<tr><td style="color:#666;font-style:italic;width:35%;">${r.label}</td><td style="font-weight:bold;">${r.value}</td></tr>`).join("")}</tbody>
      </table>
      ${caseItem.issue_summary ? `<div style="margin-top:14pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Issue Summary</div><div>${caseItem.issue_summary}</div></div>` : ""}
      ${caseItem.desired_outcome ? `<div style="margin-top:10pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Desired Outcome</div><div>${caseItem.desired_outcome}</div></div>` : ""}
      ${caseItem.issue_details ? `<div style="margin-top:10pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Full Details</div><div style="font-size:10.5pt;line-height:1.6;">${caseItem.issue_details}</div></div>` : ""}
      ${foot(3)}
    </div>
  </div>

  <!-- ═══════════════════ SECTION 2: READINESS CHECKLIST ═══════════════════ -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(2, "Escalation Readiness Checklist")}
      <p style="font-size:10pt;color:#555;margin-bottom:10pt;">Readiness: <strong>${readinessPct}%</strong> — ${readinessChecks.filter(c=>c.done).length} of ${readinessChecks.length} steps complete</p>
      <table>
        <thead><tr><th style="width:30pt;"></th><th>Item</th><th style="width:80pt;">Status</th></tr></thead>
        <tbody>${readinessChecks.map(c=>`<tr>
          <td style="font-size:14pt;text-align:center;">${c.done?"☑":"☐"}</td>
          <td>${c.label}</td>
          <td style="font-weight:bold;${c.done?"color:green;":"color:#c00;"}">${c.done?"COMPLETE":"MISSING"}</td>
        </tr>`).join("")}</tbody>
      </table>
      ${checklistItems.length > 0 ? `
        <div style="margin-top:18pt;">
          <div style="font-size:10pt;font-weight:bold;margin-bottom:8pt;color:#1a1a2e;">AI-Generated Action Items (${checklistItems.length})</div>
          <table>
            <thead><tr><th></th><th>Action</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>${checklistItems.map(item=>`<tr>
              <td style="font-size:13pt;text-align:center;">${item.status==="complete"?"☑":"☐"}</td>
              <td style="${item.status==="complete"?"text-decoration:line-through;color:#888;":""}">${item.label}</td>
              <td style="text-transform:capitalize;color:#666;">${(item.category||"").replace(/_/g," ")}</td>
              <td style="font-weight:bold;${item.status==="complete"?"color:green;":item.status==="missing"?"color:#c00;":"color:#f90;"}">${(item.status||"").toUpperCase()}</td>
            </tr>`).join("")}</tbody>
          </table>
        </div>` : ""}
      ${foot(4)}
    </div>
  </div>

  <!-- ═══════════════════ SECTION 3: TIMELINE ═══════════════════ -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(3, "Chronological Timeline")}
      ${sorted.length === 0 ? `<p style="color:#888;">No timeline events recorded.</p>` : `
      <table>
        <thead><tr><th style="width:80pt;">Date</th><th style="width:90pt;">Type</th><th>Event</th><th>Details</th></tr></thead>
        <tbody>${sorted.map(ev=>`<tr>
          <td style="white-space:nowrap;">${ev.event_date?format(new Date(ev.event_date),"d MMM yyyy"):"—"}</td>
          <td style="text-transform:capitalize;">${(ev.event_type||"").replace(/_/g," ")}</td>
          <td style="font-weight:bold;">${ev.title}</td>
          <td style="color:#555;">${ev.description||""}</td>
        </tr>`).join("")}</tbody>
      </table>`}
      ${foot(5)}
    </div>
  </div>

  <!-- ═══════════════════ SECTION 4: EVIDENCE INDEX ═══════════════════ -->
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(4, "Evidence Index")}
      <p style="font-size:10pt;color:#555;margin-bottom:10pt;">Total documents on file: <strong>${evidence.length}</strong></p>
      ${evSorted.length === 0 ? `<p style="color:#888;">No evidence uploaded.</p>` : `
      <table>
        <thead><tr><th style="width:22pt;">#</th><th>File Name</th><th style="width:90pt;">Type</th><th style="width:80pt;">Date</th><th>Description / Tags</th></tr></thead>
        <tbody>${evSorted.map((ev,i)=>`<tr>
          <td style="font-weight:bold;text-align:center;">${i+1}</td>
          <td style="font-weight:bold;word-break:break-word;">${ev.file_name}</td>
          <td style="text-transform:capitalize;">${(ev.file_type||"").replace(/_/g," ")}</td>
          <td>${ev.event_date?format(new Date(ev.event_date),"d MMM yyyy"):"—"}</td>
          <td style="color:#555;">${[ev.description, ev.tags?.join(", ")].filter(Boolean).join(" · ")||"—"}</td>
        </tr>`).join("")}</tbody>
      </table>`}
      ${foot(6)}
    </div>
  </div>

  <!-- ═══════════════════ SECTIONS 5+: LETTERS ═══════════════════ -->
  ${presentLetters.map((ld, idx) => `
  <div class="section-page">
    <div class="page-body">
      ${sectionHeader(5 + idx, ld.label)}
      <pre>${caseItem[ld.field]}</pre>
      ${foot(7 + idx)}
    </div>
  </div>`).join("")}

  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
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
      {/* Full Bundle — promoted to top */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary/15 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-foreground">Generate Professional PDF Bundle</p>
            <p className="text-xs text-muted-foreground">Title page · Table of contents · Case summary · Checklist · Timeline · Evidence index · All letters</p>
          </div>
        </div>
        <Button
          onClick={() => printBundle(caseItem, evidence, events, checklistItems)}
          className="w-full gap-2 mb-2 h-10 text-base font-bold"
          size="lg"
        >
          <Printer className="w-4 h-4" />
          Generate & Print Full Bundle
        </Button>
        <p className="text-xs text-muted-foreground text-center bg-muted/40 rounded-lg py-2 px-3">
          💡 In the print dialog, choose <strong>"Save as PDF"</strong> to export — then attach to AFCA, NCAT, TIO or any tribunal submission.
        </p>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Print Individual Sections</h3>
        <p className="text-xs text-muted-foreground">Print specific documents with letterhead and footer.</p>
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


    </div>
  );
}