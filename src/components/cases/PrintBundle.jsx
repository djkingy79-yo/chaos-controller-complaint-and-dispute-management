import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Clock, FolderOpen, Package, ClipboardList, Siren } from "lucide-react";
import { format } from "date-fns";


const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

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
    if (!merged.name && d.complainant_name) merged.name = d.complainant_name;
    if (!merged.address && d.complainant_address) merged.address = d.complainant_address;
    if (!merged.email && d.complainant_email) merged.email = d.complainant_email;
    if (!merged.phone && d.complainant_phone) merged.phone = d.complainant_phone;
    if (d.account_numbers?.length) merged.accounts = [...merged.accounts, ...d.account_numbers];
    if (d.policy_numbers?.length) merged.policies = [...merged.policies, ...d.policy_numbers];
  }
  for (const k of ["accounts", "policies"]) { if (merged[k]) merged[k] = [...new Set(merged[k])]; }
  return merged;
}

function printLetter(caseItem, evidence, field = "complaint_letter", label = "1st Complaint Letter") {
  const client = buildClientContext(caseItem, evidence);
  const content = caseItem[field] || `No ${label} generated yet.`;
  const lines = content.split('\n');
  // First page: ~45 lines with 1.5 inch margins, continuation: ~55 lines
  const firstPageLines = lines.slice(0, 45);
  const remainingLines = lines.slice(45);
  const continuationPages = [];
  for (let i = 0; i < remainingLines.length; i += 55) {
    continuationPages.push(remainingLines.slice(i, i + 55).join('\n'));
  }
  const continuationHTML = continuationPages.map((chunk, idx) => `
    <div class="letter-continuation">
      <div class="continuation-header"></div>
      <div class="continuation-content">${chunk.replace(/\n/g, '<br>')}</div>
    </div>
  `).join('');
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${label} — ${caseItem.title}</title>
  <style>
    @page { margin: 0; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.6; }
    .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
    .letterhead-header { width: 100%; height: 60px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; background-color: #ffffff; }
    .letterhead-footer { display: none !important; }
    .letter-content { position: relative; padding: 8pt 25mm 20mm 25mm; margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; width: 100%; }
    .letter-content p { margin: 0 0 4pt 0; line-height: 1.2; font-size: 10pt; }
    .letter-content div { line-height: 1.0; }
    .letter-continuation { position: relative; width: 100%; min-height: 297mm; page-break-before: always; background: white; }
    .continuation-header { width: 100%; height: 60px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; margin-bottom: 0; }
    .continuation-content { padding: 0 25mm 20mm 25mm; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.5; }
    .continuation-content p { margin: 0 0 6pt 0; min-height: 14pt; font-size: 11pt; }
    p { margin: 10pt 0; min-height: 18pt; }
  </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <div class="letter-content">${firstPageLines.map(line => `<p>${line || '&nbsp;'}</p>`).join('')}</div>
    </div>
    ${continuationHTML}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function printTimeline(caseItem, events) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const rows = sorted.map((ev) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:10pt;white-space:nowrap;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
      <td style="padding:6pt 8pt;font-size:10pt;text-transform:capitalize;">${ev.event_type.replace("_", " ")}</td>
      <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;">${ev.title}</td>
      <td style="padding:6pt 8pt;font-size:10pt;color:#000;">${ev.description || ""}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>Timeline — ${caseItem.title}</title>
  <style>
    @page { margin: 0; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; }
    .letterhead-header { width: 100%; height: 180px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
    .letterhead-footer { display: none !important; }
    .print-content { padding: 1.5in 1.5in 1.5in 1.5in; }
    h1 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: #000; }
    h2 { font-size: 11pt; font-weight: bold; margin-bottom: 10pt; color: #000; font-style: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; color: #000; }
    td { padding: 3pt 6pt; border-bottom: none; font-size: 10pt; color: #000; }
    .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
  </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <div class="print-content">
        <h1>Case Timeline</h1>
        <h2>${caseItem.title}</h2>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Event</th><th>Details</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function printEvidence(caseItem, evidence) {
  const sorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const allTags = [...new Set(evidence.flatMap((ev) => ev.tags || []))];
  
  const grouped = allTags.length > 0 ? {} : { "All Documents": sorted };
  if (allTags.length > 0) {
    for (const tag of allTags) {
      grouped[tag] = sorted.filter((ev) => ev.tags?.includes(tag));
    }
    const untagged = sorted.filter((ev) => !ev.tags || ev.tags.length === 0);
    if (untagged.length > 0) grouped["Other"] = untagged;
  }

  let tableRows = "";
  let itemNum = 1;
  for (const [groupName, items] of Object.entries(grouped)) {
    tableRows += `<tr style="background:white;"><th colspan="5" style="text-align:left;padding:6pt 8pt;font-size:11pt;border-bottom:2pt solid #000;">${groupName} (${items.length})</th></tr>`;
    tableRows += items.map((ev) => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:6pt 8pt;font-size:10pt;">${itemNum++}</td>
        <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;">${ev.file_name}</td>
        <td style="padding:6pt 8pt;font-size:10pt;text-transform:capitalize;">${(ev.file_type || "").replace("_", " ")}</td>
        <td style="padding:6pt 8pt;font-size:10pt;">${ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : "—"}</td>
        <td style="padding:6pt 8pt;font-size:10pt;color:#000;">${[ev.description, ev.tags?.join(", ")].filter(Boolean).join(" · ") || "—"}</td>
      </tr>
    `).join("");
  }

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>Evidence — ${caseItem.title}</title>
  <style>
    @page { margin: 0; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; }
    .letterhead-header { width: 100%; height: 180px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
    .letterhead-footer { display: none !important; }
    .print-content { padding: 1.5in 1.5in 1.5in 1.5in; }
    h1 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: #000; }
    h2 { font-size: 11pt; font-weight: bold; margin-bottom: 10pt; color: #000; font-style: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; color: #000; }
    td { padding: 3pt 6pt; border-bottom: none; font-size: 10pt; color: #000; }
    .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
  </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <div class="print-content">
        <h1>Evidence Index ${allTags.length > 0 ? "— Grouped by Tags" : ""}</h1>
        <h2>${caseItem.title} — ${caseItem.organisation_name || ""}</h2>
        <p style="font-size:10pt;color:#000;margin-bottom:10pt;font-weight:bold;">Total: <strong>${evidence.length}</strong> documents ${allTags.length > 0 ? `· ${allTags.length} categories` : ""}</p>
        <table>
          <thead><tr><th style="width:25pt;">#</th><th>File Name</th><th style="width:80pt;">Type</th><th style="width:70pt;">Date</th><th>Description / Tags</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
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
    { label: "Complaint sent to organisation", done: ["complaint_sent", "awaiting_response", "response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
    { label: "Response received from organisation", done: ["response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
  ];

  const rows = checks.map((c) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:12pt;">${c.done ? "☑" : "☐"}</td>
      <td style="padding:6pt 8pt;font-size:10pt;">${c.label}</td>
      <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;${c.done ? "color:green;" : "color:#c00;"}">${c.done ? "COMPLETE" : "MISSING"}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>Checklist — ${caseItem.title}</title>
  <style>
    @page { margin: 0; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; }
    .letterhead-header { width: 100%; height: 180px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
    .letterhead-footer { display: none !important; }
    .print-content { padding: 1.5in 1.5in 1.5in 1.5in; }
    h1 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: #000; }
    h2 { font-size: 11pt; font-weight: bold; margin-bottom: 10pt; color: #000; font-style: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; color: #000; }
    td { padding: 3pt 6pt; border-bottom: none; font-size: 10pt; color: #000; }
    .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
  </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <div class="print-content">
        <h1>Case Checklist</h1>
        <h2>${caseItem.title}</h2>
        <table>
          <thead><tr><th style="width:30pt;"></th><th>Item</th><th style="width:80pt;">Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function printChecklistItems(caseItem, checklistItems) {
  const rows = checklistItems.map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:12pt;">${item.status === 'complete' ? '☑' : '☐'}</td>
      <td style="padding:6pt 8pt;font-size:10pt;${item.status === 'complete' ? 'text-decoration:line-through;color:#888;' : ''}">${item.label}</td>
      <td style="padding:6pt 8pt;font-size:10pt;text-transform:capitalize;">${(item.category || '').replace(/_/g, ' ')}</td>
      <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;${item.status === 'complete' ? 'color:green;' : item.status === 'missing' ? 'color:#c00;' : 'color:#f90;'}">${(item.status || '').replace('_', ' ').toUpperCase()}</td>
    </tr>`).join('');
  
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Smart Checklist — ${caseItem.title}</title>
  <style>
    @page { margin: 0; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; }
    .letterhead-header { width: 100%; height: 180px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
    .letterhead-footer { display: none !important; }
    .print-content { padding: 1.5in 1.5in 1.5in 1.5in; }
    h1 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: #000; }
    h2 { font-size: 11pt; font-weight: bold; margin-bottom: 10pt; color: #000; font-style: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; color: #000; }
    td { padding: 3pt 6pt; border-bottom: none; font-size: 10pt; color: #000; }
    .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
  </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <div class="print-content">
        <h1>Smart Checklist</h1>
        <h2>${caseItem.title} · ${checklistItems.length} items</h2>
        <table>
          <thead><tr><th style="width:30pt;"></th><th>Action</th><th style="width:80pt;">Category</th><th style="width:70pt;">Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function printDeadlineItems(caseItem, deadlines) {
  const sorted = [...deadlines].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
  const rows = sorted.map(d => {
    const daysLeft = d.deadline_date ? Math.round((new Date(d.deadline_date) - new Date()) / 86400000) : null;
    const urgency = daysLeft === null ? '—' : daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'TODAY' : `${daysLeft} days`;
    const color = daysLeft !== null && daysLeft < 0 ? '#c00' : daysLeft !== null && daysLeft <= 7 ? '#f90' : '#060';
    return `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;">${d.title}</td>
      <td style="padding:6pt 8pt;font-size:10pt;">${d.deadline_date ? format(new Date(d.deadline_date), 'd MMM yyyy') : '—'}</td>
      <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;color:${color};">${urgency}</td>
      <td style="padding:6pt 8pt;font-size:10pt;text-transform:capitalize;">${(d.deadline_type || '').replace(/_/g, ' ')}</td>
      <td style="padding:6pt 8pt;font-size:10pt;font-weight:bold;${d.status === 'completed' ? 'color:green;' : 'color:#c00;'}">${(d.status || '').toUpperCase()}</td>
    </tr>`;
  }).join('');
  
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Deadlines — ${caseItem.title}</title>
  <style>
    @page { margin: 0; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; }
    .letterhead-header { width: 100%; height: 180px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center top; }
    .letterhead-footer { display: none !important; }
    .print-content { padding: 1.5in 1.5in 1.5in 1.5in; }
    h1 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: #000; }
    h2 { font-size: 11pt; font-weight: bold; margin-bottom: 10pt; color: #000; font-style: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; color: #000; }
    td { padding: 3pt 6pt; border-bottom: none; font-size: 10pt; color: #000; }
    .letter-page { position: relative; width: 100%; min-height: 297mm; background: white; }
  </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <div class="print-content">
        <h1>Deadline War Room</h1>
        <h2>${caseItem.title} · ${deadlines.length} deadlines</h2>
        <table>
          <thead><tr><th>Deadline</th><th style="width:80pt;">Date</th><th style="width:70pt;">Urgency</th><th style="width:90pt;">Type</th><th style="width:70pt;">Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function printBundle(caseItem, evidence, events, checklistItems) {
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const evSorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const allTags = [...new Set(evidence.flatMap((ev) => ev.tags || []))];
  const client = buildClientContext(caseItem, evidence);
  const today = format(new Date(), "d MMMM yyyy");
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const presentLetters = LETTER_DEFS.filter(ld => caseItem[ld.field]);

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
    { label: "Complaint sent to organisation", done: ["complaint_sent", "awaiting_response", "response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
    { label: "Response received from organisation", done: ["response_received", "escalation_ready", "escalated", "resolved"].includes(caseItem.status) },
  ];
  const readinessPct = Math.round((readinessChecks.filter(c => c.done).length / readinessChecks.length) * 100);

  const tocSections = [
    { num: 1, title: "Case Summary" },
    { num: 2, title: "Escalation Readiness Checklist" },
    { num: 3, title: "Chronological Timeline" },
    { num: 4, title: "Evidence Index" },
    { num: 5, title: "Smart Checklist" },
    ...presentLetters.map((ld, i) => ({ num: 6 + i, title: ld.label })),
  ];

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Case Bundle — ${caseItem.title}</title>
    <style>
      @page { margin: 25mm 20mm 20mm 20mm; size: A4; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; line-height: 1.6; }
      
      .page { page-break-after: always; padding: 0; }
      .page:last-child { page-break-after: auto; }
      
      .cover-title { font-size: 8pt; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 10pt; }
      .cover-main { font-size: 12pt; font-weight: bold; line-height: 1.3; margin-bottom: 6pt; color: #1a1a2e; }
      .cover-sub { font-size: 10pt; color: #666; font-style: italic; margin-bottom: 14pt; }
      
      .summary-box { background: #f8f8f8; border: 1px solid #ddd; padding: 10pt 12pt; border-radius: 4pt; margin-bottom: 12pt; }
      .summary-row td { border: none; padding: 2pt 10pt 2pt 0; font-size: 10pt; }
      .summary-row td:first-child { color: #666; font-style: italic; white-space: nowrap; width: 35%; }
      .summary-row td:last-child { font-weight: bold; }
      
      .section-title { font-size: 12pt; font-weight: bold; color: #1a1a2e; margin-bottom: 10pt; border-bottom: 2px solid #1a1a2e; padding-bottom: 4pt; }
      .section-subtitle { font-size: 10pt; color: #666; margin-bottom: 8pt; }
      
      table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10pt; }
      th { background: #f4f4f4; text-align: left; padding: 5pt 8pt; font-weight: bold; border-bottom: 2px solid #ddd; font-size: 10pt; }
      td { padding: 4.5pt 8pt; border-bottom: 1px solid #eee; vertical-align: top; font-size: 10pt; }
      
      .toc-item { display: flex; align-items: baseline; padding: 5pt 0; border-bottom: 1px dotted #ccc; }
      .toc-num { font-weight: bold; color: #1a1a2e; min-width: 25pt; font-size: 10pt; }
      .toc-title { font-size: 10pt; font-weight: bold; flex: 1; }
      
      p { margin: 6pt 0; min-height: 14pt; font-family: 'Times New Roman', Times, serif; font-size: 10pt; line-height: 1.6; }
      
      .footer { margin-top: 25pt; padding-top: 6pt; border-top: 0.5pt solid #ccc; font-size: 8pt; color: #888; display: flex; justify-content: space-between; font-family: 'Times New Roman', Times, serif; }
      
      .progress-bar { background: #eee; height: 8pt; border-radius: 4pt; overflow: hidden; margin: 6pt 0; }
      .progress-fill { height: 100%; background: linear-gradient(to right, #1a1a2e, #FFD700); border-radius: 4pt; }
    </style>
  </head><body>
    
    <!-- COVER PAGE -->
    <div class="page">
      <div class="cover-title" style="font-size:8pt;">Chaos Controller™ — Formal Case Bundle</div>
      <div style="border-left: 4px solid #1a1a2e; padding-left: 12pt; margin-bottom: 18pt;">
        <div class="cover-main" style="font-size:12pt;">${caseItem.title}</div>
        <div class="cover-sub" style="font-size:10pt;">vs. ${caseItem.organisation_name || "Organisation"}</div>
      </div>
      
      <div class="summary-box">
        <table class="summary-row">
          <tbody>${summaryRows.map(r => `<tr><td style="font-size:10pt;">${r.label}</td><td style="font-size:10pt;">${r.value}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      
      ${caseItem.issue_summary ? `<div style="margin-bottom:10pt;"><div style="font-size:8pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Issue Summary</div><div style="font-size:10pt;line-height:1.5;">${caseItem.issue_summary}</div></div>` : ""}
      ${caseItem.desired_outcome ? `<div style="margin-bottom:10pt;"><div style="font-size:8pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Desired Outcome</div><div style="font-size:10pt;line-height:1.5;">${caseItem.desired_outcome}</div></div>` : ""}
      
      <div style="margin-top: 14pt; padding-top: 10pt; border-top: 1px solid #ddd;">
        <div style="font-size:8pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Escalation Readiness</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${readinessPct}%"></div></div>
        <div style="font-size:10pt;font-weight:bold;color:#1a1a2e;">${readinessPct}% Ready — ${readinessChecks.filter(c=>c.done).length}/${readinessChecks.length} steps complete</div>
        <div style="font-size:8pt;color:#888;margin-top:4pt;">Generated: ${today} · Ref: ${caseRef}</div>
      </div>
      
    </div>
    
    <!-- TABLE OF CONTENTS -->
    <div class="page">
      <div class="section-title">Table of Contents</div>
      <div class="section-subtitle">${caseItem.title} — ${today}</div>
      <div style="margin-top:12pt;">
        ${tocSections.map(s => `
          <div class="toc-item">
            <div class="toc-num">${s.num}.</div>
            <div class="toc-title">${s.title}</div>
          </div>`).join("")}
      </div>
      </div>

      <!-- SECTION 1: CASE SUMMARY -->
    <div class="page">
      <div class="section-title">1. Case Summary</div>
      <table class="summary-row" style="margin-top:8pt;">
        <tbody>${summaryRows.map(r=>`<tr><td>${r.label}</td><td>${r.value}</td></tr>`).join("")}</tbody>
      </table>
      ${caseItem.issue_details ? `<div style="margin-top:14pt;"><div style="font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4pt;">Full Details</div><div style="font-size:10.5pt;line-height:1.6;">${caseItem.issue_details}</div></div>` : ""}
      </div>

      <!-- SECTION 2: READINESS CHECKLIST -->
    <div class="page">
      <div class="section-title">2. Escalation Readiness Checklist</div>
      <div class="section-subtitle">Readiness: <strong>${readinessPct}%</strong> — ${readinessChecks.filter(c=>c.done).length} of ${readinessChecks.length} complete</div>
      <table>
        <thead><tr><th style="width:30pt;"></th><th>Item</th><th style="width:80pt;">Status</th></tr></thead>
        <tbody>${readinessChecks.map(c=>`<tr>
          <td style="font-size:14pt;text-align:center;">${c.done?"☑":"☐"}</td>
          <td>${c.label}</td>
          <td style="font-weight:bold;${c.done?"color:green;":"color:#c00;"}">${c.done?"COMPLETE":"MISSING"}</td>
        </tr>`).join("")}</tbody>
      </table>
      ${checklistItems.length > 0 ? `
        <div style="margin-top:16pt;">
          <div style="font-size:10pt;font-weight:bold;margin-bottom:6pt;color:#1a1a2e;">AI-Generated Action Items (${checklistItems.length})</div>
          <table>
            <thead><tr><th style="width:30pt;"></th><th>Action</th><th>Category</th><th style="width:70pt;">Status</th></tr></thead>
            <tbody>${checklistItems.map(item=>`<tr>
              <td style="font-size:13pt;text-align:center;">${item.status==="complete"?"☑":"☐"}</td>
              <td style="${item.status==="complete"?"text-decoration:line-through;color:#888;":""}">${item.label}</td>
              <td style="text-transform:capitalize;color:#666;">${(item.category||"").replace(/_/g," ")}</td>
              <td style="font-weight:bold;${item.status==="complete"?"color:green;":item.status==="missing"?"color:#c00;":"color:#f90;"}">${(item.status||"").toUpperCase()}</td>
            </tr>`).join("")}</tbody>
          </table>
        </div>` : ""}
      </div>

      <!-- SECTION 3: TIMELINE -->
    <div class="page">
      <div class="section-title">3. Chronological Timeline</div>
      ${sorted.length === 0 ? `<p style="color:#888;font-style:italic;">No timeline events recorded.</p>` : `
      <table>
        <thead><tr><th style="width:70pt;">Date</th><th style="width:80pt;">Type</th><th>Event</th><th>Details</th></tr></thead>
        <tbody>${sorted.map(ev=>`<tr>
          <td style="white-space:nowrap;">${ev.event_date?format(new Date(ev.event_date),"d MMM yyyy"):"—"}</td>
          <td style="text-transform:capitalize;">${(ev.event_type||"").replace(/_/g," ")}</td>
          <td style="font-weight:bold;">${ev.title}</td>
          <td style="color:#555;">${ev.description||""}</td>
        </tr>`).join("")}</tbody>
      </table>`}
      </div>

      <!-- SECTION 4: EVIDENCE INDEX -->
    <div class="page">
      <div class="section-title">4. Evidence Index ${allTags.length > 0 ? `— ${allTags.length} tag categories` : ""}</div>
      <div class="section-subtitle">Total documents: <strong>${evidence.length}</strong></div>
      ${evSorted.length === 0 ? `<p style="color:#888;font-style:italic;">No evidence uploaded.</p>` : `
      <table>
        <thead><tr><th style="width:25pt;">#</th><th>File Name</th><th style="width:70pt;">Type</th><th style="width:60pt;">Date</th><th>Description / Tags</th></tr></thead>
        <tbody>${evSorted.map((ev,i)=>`<tr>
          <td style="font-weight:bold;text-align:center;">${i+1}</td>
          <td style="font-weight:bold;word-break:break-word;">${ev.file_name}</td>
          <td style="text-transform:capitalize;">${(ev.file_type||"").replace(/_/g," ")}</td>
          <td>${ev.event_date?format(new Date(ev.event_date),"d MMM yyyy"):"—"}</td>
          <td style="color:#555;">${[ev.description, ev.tags?.join(", ")].filter(Boolean).join(" · ")||"—"}</td>
        </tr>`).join("")}</tbody>
      </table>`}
      </div>

      <!-- SECTION 5: SMART CHECKLIST -->
    <div class="page">
      <div class="section-title">5. Smart Checklist</div>
      <div class="section-subtitle">${checklistItems.length} AI-generated action items</div>
      ${checklistItems.length === 0 ? `<p style="color:#888;font-style:italic;">No action items generated yet.</p>` : `
      <table>
        <thead><tr><th style="width:30pt;"></th><th>Action</th><th>Category</th><th style="width:70pt;">Status</th></tr></thead>
        <tbody>${checklistItems.map(item=>`<tr>
          <td style="font-size:13pt;text-align:center;">${item.status==="complete"?"☑":"☐"}</td>
          <td style="${item.status==="complete"?"text-decoration:line-through;color:#888;":""}">${item.label}</td>
          <td style="text-transform:capitalize;color:#666;">${(item.category||"").replace(/_/g," ")}</td>
          <td style="font-weight:bold;${item.status==="complete"?"color:green;":item.status==="missing"?"color:#c00;":"color:#f90;"}">${(item.status||"").toUpperCase()}</td>
        </tr>`).join("")}</tbody>
      </table>`}
      </div>

      <!-- LETTERS -->
    ${presentLetters.map((ld, idx) => {
    const letterLines = (caseItem[ld.field] || '').split('\n');
    return `
    <div class="page">
    <div class="section-title">${ld.label}</div>
    <div style="margin-top:6pt;">${letterLines.map(line => `<p style="margin:0 0 6pt 0;font-size:11pt;line-height:1.5">${line || '&nbsp;'}</p>`).join('')}</div>
    </div>`;
    }).join("")}
    
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
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary/15 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-foreground">Generate Professional PDF Bundle</p>
            <p className="text-xs text-muted-foreground">Clean, professional case bundle for tribunal submissions</p>
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
          💡 Choose <strong>"Save as PDF"</strong> in the print dialog for tribunal submissions
        </p>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Print Individual Sections</h3>
        <p className="text-xs text-muted-foreground">Print specific documents with clean formatting.</p>
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
              {caseItem[ld.field] ? "Print formal letter" : "Not yet generated"}
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
          <p className="text-xs text-muted-foreground">Print every event in date order</p>
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
          <p className="text-xs text-muted-foreground">Print indexed evidence list with tags</p>
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
          <p className="text-xs text-muted-foreground">Print completion checklist</p>
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
          <p className="text-xs text-muted-foreground">Print AI-generated action items ({checklistItems.length})</p>
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
          <p className="text-xs text-muted-foreground">Print all deadlines with urgency ({deadlines.length})</p>
        </button>
      </div>
    </div>
  );
}