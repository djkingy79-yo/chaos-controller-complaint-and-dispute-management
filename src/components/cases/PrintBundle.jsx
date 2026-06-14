import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Clock, FolderOpen, Package } from "lucide-react";
import { format } from "date-fns";

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
  return `<h1 style="font-size:17pt;font-weight:bold;margin-bottom:6pt;">${text}</h1>`;
}
function h2(text) {
  return `<h2 style="font-size:14pt;font-style:italic;margin-bottom:4pt;">${text}</h2>`;
}
function footer(caseItem, client) {
  const year = new Date().getFullYear();
  const name = client?.name || caseItem?.complainant_name || "";
  const org = caseItem?.organisation_name || "";
  const title = caseItem?.title || "";
  const text = `Chaos Controller by Deb King ${year}${name ? ` — ${name} vs ${org}` : ""} ${year} — ${title}`;
  return `<div style="font-size:9pt;font-style:italic;border-top:1pt solid #ccc;margin-top:24pt;padding-top:8pt;color:#888;display:flex;justify-content:space-between;">
    <span>${text}</span>
  </div>`;
}

function letterhead(caseItem, client, today) {
  const clientRows = [
    client?.name    ? `<tr><td style="color:#555;padding:2pt 12pt 2pt 0;font-size:11pt;white-space:nowrap;">From:</td><td style="font-weight:bold;font-size:11pt;">${client.name}</td></tr>` : "",
    client?.address ? `<tr><td style="color:#555;padding:2pt 12pt 2pt 0;font-size:11pt;white-space:nowrap;">Address:</td><td style="font-size:11pt;">${client.address}</td></tr>` : "",
    client?.email   ? `<tr><td style="color:#555;padding:2pt 12pt 2pt 0;font-size:11pt;white-space:nowrap;">Email:</td><td style="font-size:11pt;">${client.email}</td></tr>` : "",
    client?.phone   ? `<tr><td style="color:#555;padding:2pt 12pt 2pt 0;font-size:11pt;white-space:nowrap;">Phone:</td><td style="font-size:11pt;">${client.phone}</td></tr>` : "",
    client?.accounts?.length ? `<tr><td style="color:#555;padding:2pt 12pt 2pt 0;font-size:11pt;white-space:nowrap;">Account(s):</td><td style="font-size:11pt;">${client.accounts.join(", ")}</td></tr>` : "",
    client?.policies?.length ? `<tr><td style="color:#555;padding:2pt 12pt 2pt 0;font-size:11pt;white-space:nowrap;">Reference(s):</td><td style="font-size:11pt;">${client.policies.join(", ")}</td></tr>` : "",
  ].filter(Boolean).join("");

  return `
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="padding:10pt 0;">
        <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png" alt="Chaos Controller" style="height:55pt;width:auto;" />
      </td>
      <td style="text-align:right;vertical-align:top;padding-top:10pt;">
        <div style="font-size:10pt;color:#555;">${today}</div>
        <div style="font-size:9pt;color:#999;margin-top:2pt;">chaoscontroller.com.au</div>
      </td>
    </tr>
  </table>
  ${clientRows ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:8pt 12pt;margin-bottom:0;"><table style="border-collapse:collapse;">${clientRows}</table></div>` : ""}
  <hr style="border:none;border-top:2.5px solid #1d4ed8;margin:12pt 0 16pt 0;"/>`;
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

function printLetter(caseItem, evidence) {
  const today = format(new Date(), "d MMMM yyyy");
  const client = buildClientContext(caseItem, evidence);
  const html = `<div style="${baseStyles()}">
    ${letterhead(caseItem, client, today)}
    <pre style="white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.75;">${caseItem.complaint_letter || "No letter generated."}</pre>
    ${footer(caseItem, client)}
  </div>`;
  setPrintArea(html);
  window.print();
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
    ${footer(caseItem, client)}
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
    ${footer(caseItem, client)}
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
    ${footer(caseItem, client)}
  </div>`;
  setPrintArea(html);
  window.print();
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

  const html = `<div style="${baseStyles()}">
    <!-- COVER PAGE: no footer on cover -->
    <div style="text-align:center;padding-top:60pt;">
      <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png" alt="Chaos Controller" style="height:80pt;width:auto;margin-bottom:24pt;" />
      <hr style="border:none;border-top:2.5px solid #1d4ed8;width:60%;margin:0 auto 32pt auto;"/>
      <div style="font-size:20pt;font-weight:bold;margin-bottom:8pt;">${caseItem.title}</div>
      <div style="font-size:14pt;font-style:italic;margin-bottom:8pt;color:#444;">vs. ${caseItem.organisation_name || "Organisation"}</div>
      <div style="font-size:12pt;color:#555;margin-bottom:4pt;">Case Bundle — ${format(new Date(), "d MMMM yyyy")}</div>
      <div style="font-size:11pt;color:#555;text-transform:capitalize;">Category: ${caseItem.category} | Status: ${(caseItem.status || "").replace(/_/g, " ")}</div>
      ${client.name ? `<div style="margin-top:24pt;font-size:11pt;color:#333;">Prepared for: <strong>${client.name}</strong></div>` : ""}
    </div>

    ${pageBreak}

    <!-- SECTION 1: CHECKLIST -->
    ${h1("Section 1 — Case Checklist")}
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
    ${footer(caseItem, client)}

    ${pageBreak}

    <!-- SECTION 2: TIMELINE -->
    ${h1("Section 2 — Chronological Timeline")}
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
    ${footer(caseItem, client)}

    ${pageBreak}

    <!-- SECTION 3: EVIDENCE INDEX -->
    ${h1("Section 3 — Evidence Index")}
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
    ${footer(caseItem, client)}

    ${pageBreak}

    <!-- SECTION 4: COMPLAINT LETTER -->
    ${h1("Section 4 — Complaint Letter")}
    ${letterhead(caseItem, client, format(new Date(), "d MMMM yyyy"))}
    <pre style="white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.75;margin-top:0;">${caseItem.complaint_letter || "No complaint letter generated yet."}</pre>

    ${footer(caseItem, client)}
  </div>`;
  setPrintArea(html);
  window.print();
}

export default function PrintBundle({ caseItem, evidence, events }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Print & Export</h3>
        <p className="text-xs text-muted-foreground">Print individual documents or the full case bundle. All documents use Times New Roman formatting with proper headings, footers, and legal disclaimers.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => printLetter(caseItem, evidence)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm text-foreground">Complaint Letter</span>
            <Printer className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground">Print Letter 1 — formal complaint to the organisation</p>
        </button>

        <button
          onClick={() => printTimeline(caseItem, events)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
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
      </div>

      {/* Full Bundle */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Full Case Bundle</p>
            <p className="text-xs text-muted-foreground">Cover page + all 4 documents in one print-ready file</p>
          </div>
        </div>
        <Button
          onClick={() => printBundle(caseItem, evidence, events)}
          className="w-full gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Complete Bundle
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">Suitable for submission to AFCA, NCAT, TIO, and all tribunals</p>
      </div>
    </div>
  );
}