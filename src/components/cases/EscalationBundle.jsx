import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Download, Loader2, CheckCircle2, FileText, Clock, FolderOpen, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png";
const BLUE = [29, 78, 216];
const BLACK = [0, 0, 0];
const GREY = [80, 80, 80];
const LIGHT_GREY = [240, 242, 246];
const RED_COLOR = [180, 0, 0];
const GREEN_COLOR = [22, 140, 75];

function buildClientContext(evidence) {
  const merged = {};
  for (const ev of (evidence || [])) {
    const d = ev.extracted_data;
    if (!d) continue;
    if (d.complainant_name && !merged.name) merged.name = d.complainant_name;
    if (d.complainant_address && !merged.address) merged.address = d.complainant_address;
    if (d.complainant_email && !merged.email) merged.email = d.complainant_email;
    if (d.complainant_phone && !merged.phone) merged.phone = d.complainant_phone;
    if (d.account_numbers?.length) merged.accounts = [...(merged.accounts || []), ...d.account_numbers];
    if (d.policy_numbers?.length) merged.policies = [...(merged.policies || []), ...d.policy_numbers];
  }
  for (const k of ["accounts", "policies"]) {
    if (merged[k]) merged[k] = [...new Set(merged[k])];
  }
  return merged;
}

async function loadImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addPageFooter(doc, pageNum) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "italic");
  doc.text(`Page ${pageNum}`, pageW - 14, pageH - 6, { align: "right" });
  doc.text("Chaos Controller™ — Organisational purposes only. Not legal advice.", 14, pageH - 6);
}

function drawHRule(doc, y, r, g, b) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setDrawColor(r || BLUE[0], g || BLUE[1], b || BLUE[2]);
  doc.setLineWidth(0.7);
  doc.line(14, y, pageW - 14, y);
}

function sectionHeader(doc, text, y) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.rect(14, y, pageW - 28, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text(text, 18, y + 6.5);
  return y + 13;
}

export default function EscalationBundle({ caseItem, evidence, events }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const checks = [
    { label: "Issue summary documented", done: !!(caseItem.issue_summary) },
    { label: "Full issue details recorded", done: !!(caseItem.issue_details) },
    { label: "Desired outcome stated", done: !!(caseItem.desired_outcome) },
    { label: "Complaint letter drafted", done: !!(caseItem.complaint_letter) },
    { label: "Evidence uploaded (1+ files)", done: evidence.length > 0 },
    { label: "Timeline started (1+ events)", done: events.length > 0 },
    { label: "Response deadline set", done: !!(caseItem.response_deadline) },
    { label: "Escalation body identified", done: !!(caseItem.escalation_body) },
    { label: "Complaint sent", done: ["complaint_sent","awaiting_response","response_received","escalation_ready","escalated","resolved"].includes(caseItem.status) },
    { label: "Response received", done: ["response_received","escalation_ready","escalated","resolved"].includes(caseItem.status) },
  ];
  const completedCount = checks.filter((c) => c.done).length;
  const readinessScore = Math.round((completedCount / checks.length) * 100);

  const generatePDF = async () => {
    setGenerating(true);
    setDone(false);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const today = format(new Date(), "d MMMM yyyy");
    const client = buildClientContext(evidence);
    let pageNum = 1;

    const logoData = await loadImageAsBase64(LOGO_URL);

    // ─── PAGE 1: COVER ───
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(0, 0, pageW, 42, "F");

    if (logoData) {
      doc.addImage(logoData, "PNG", margin, 6, 50, 28);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("ESCALATION BUNDLE", pageW - margin, 14, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(today, pageW - margin, 22, { align: "right" });
    doc.text("chaoscontroller.com.au", pageW - margin, 29, { align: "right" });

    let y = 58;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    const titleLines = doc.splitTextToSize(caseItem.title, pageW - 28);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 9 + 4;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(13);
    doc.setTextColor(GREY[0], GREY[1], GREY[2]);
    doc.text(`vs. ${caseItem.organisation_name || "Organisation"}`, margin, y);
    y += 8;

    drawHRule(doc, y);
    y += 8;

    // Meta grid
    const meta = [
      ["Category", caseItem.category || "—"],
      ["Status", (caseItem.status || "").replace(/_/g, " ")],
      ["Priority", caseItem.priority || "medium"],
      ["Escalation Body", caseItem.escalation_body || "N/A"],
      ["Response Deadline", caseItem.response_deadline ? format(new Date(caseItem.response_deadline), "d MMM yyyy") : "N/A"],
      ["Evidence Files", String(evidence.length)],
    ];
    doc.setFontSize(10);
    meta.forEach(([label, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? margin : pageW / 2 + 4;
      const ry = y + row * 8;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(label + ":", x, ry);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
      const labelW = doc.getTextWidth(label + ": ");
      const capVal = val.charAt(0).toUpperCase() + val.slice(1);
      doc.text(capVal, x + labelW, ry);
    });
    y += Math.ceil(meta.length / 2) * 8 + 8;

    // Client box
    if (client.name) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      const clientFields = [
        client.name && ["Name", client.name],
        client.address && ["Address", client.address],
        client.email && ["Email", client.email],
        client.phone && ["Phone", client.phone],
        client.accounts?.length && ["Account(s)", client.accounts.join(", ")],
        client.policies?.length && ["Reference(s)", client.policies.join(", ")],
      ].filter(Boolean);
      const boxH = clientFields.length * 6 + 10;
      doc.roundedRect(margin, y, pageW - 28, boxH, 2, 2, "FD");
      let cy = y + 7;
      clientFields.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(lbl + ":", margin + 4, cy);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        doc.text(String(val), margin + 32, cy);
        cy += 6;
      });
      y = cy + 6;
    }

    // Readiness
    drawHRule(doc, y);
    y += 8;
    const badgeR = readinessScore >= 80 ? GREEN_COLOR[0] : readinessScore >= 50 ? 180 : RED_COLOR[0];
    const badgeG = readinessScore >= 80 ? GREEN_COLOR[1] : readinessScore >= 50 ? 120 : RED_COLOR[1];
    const badgeB = readinessScore >= 80 ? GREEN_COLOR[2] : readinessScore >= 50 ? 0 : RED_COLOR[2];
    doc.setFillColor(badgeR, badgeG, badgeB);
    doc.roundedRect(margin, y, 80, 12, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Readiness: ${readinessScore}%  (${completedCount}/${checks.length} complete)`, margin + 40, y + 8, { align: "center" });
    y += 18;

    // TOC
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    doc.text("Bundle Contents:", margin, y);
    y += 6;
    const toc = [
      "Section 1 — Escalation Readiness Checklist",
      "Section 2 — Chronological Timeline",
      "Section 3 — Evidence Index",
      "Section 4 — Complaint Letter",
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(GREY[0], GREY[1], GREY[2]);
    toc.forEach((t) => { doc.text("• " + t, margin + 4, y); y += 6; });

    addPageFooter(doc, pageNum++);

    // ─── PAGE 2: CHECKLIST ───
    doc.addPage();
    y = sectionHeader(doc, "Section 1 — Escalation Readiness Checklist", 14);

    checks.forEach((c, i) => {
      if (y > pageH - 20) { addPageFooter(doc, pageNum++); doc.addPage(); y = 14; }
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(margin, y - 4, pageW - 28, 8, "F");
      const cr = c.done ? GREEN_COLOR[0] : RED_COLOR[0];
      const cg = c.done ? GREEN_COLOR[1] : RED_COLOR[1];
      const cb = c.done ? GREEN_COLOR[2] : RED_COLOR[2];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(cr, cg, cb);
      doc.text(c.done ? "✓" : "✗", margin + 2, y + 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
      doc.text(c.label, margin + 10, y + 1);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(cr, cg, cb);
      doc.text(c.done ? "COMPLETE" : "MISSING", pageW - margin, y + 1, { align: "right" });
      y += 9;
    });

    addPageFooter(doc, pageNum++);

    // ─── PAGE 3: TIMELINE ───
    doc.addPage();
    y = sectionHeader(doc, "Section 2 — Chronological Timeline", 14);

    const sortedEvts = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));

    if (sortedEvts.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text("No timeline events recorded.", margin, y + 6);
    } else {
      // Header row
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.rect(margin, y, pageW - 28, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Date", margin + 2, y + 5.5);
      doc.text("Type", margin + 28, y + 5.5);
      doc.text("Event", margin + 60, y + 5.5);
      doc.text("Details", margin + 115, y + 5.5);
      y += 10;

      sortedEvts.forEach((ev, i) => {
        const descLines = doc.splitTextToSize(ev.description || "", 58);
        const rowH = Math.max(8, descLines.length * 4.5 + 4);
        if (y + rowH > pageH - 16) { addPageFooter(doc, pageNum++); doc.addPage(); y = 14; }
        doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        doc.rect(margin, y - 2, pageW - 28, rowH, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        doc.text(ev.event_date ? format(new Date(ev.event_date), "d MMM yy") : "—", margin + 2, y + 3);
        doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
        doc.text((ev.event_type || "").replace(/_/g, " "), margin + 28, y + 3);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        const evtTitleLines = doc.splitTextToSize(ev.title || "", 50);
        doc.text(evtTitleLines, margin + 60, y + 3);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(descLines, margin + 115, y + 3);
        y += rowH + 1;
      });
    }

    addPageFooter(doc, pageNum++);

    // ─── PAGE 4: EVIDENCE INDEX ───
    doc.addPage();
    y = sectionHeader(doc, "Section 3 — Evidence Index", 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(GREY[0], GREY[1], GREY[2]);
    doc.text(`Total items: ${evidence.length}`, margin, y);
    y += 8;

    const sortedEv = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));

    if (sortedEv.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text("No evidence uploaded.", margin, y + 6);
    } else {
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.rect(margin, y, pageW - 28, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("#", margin + 2, y + 5.5);
      doc.text("File Name", margin + 10, y + 5.5);
      doc.text("Type", margin + 88, y + 5.5);
      doc.text("Date", margin + 116, y + 5.5);
      doc.text("Description", margin + 142, y + 5.5);
      y += 10;

      sortedEv.forEach((ev, i) => {
        const descLines = doc.splitTextToSize(ev.description || "", 40);
        const rowH = Math.max(8, descLines.length * 4.5 + 4);
        if (y + rowH > pageH - 16) { addPageFooter(doc, pageNum++); doc.addPage(); y = 14; }
        doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        doc.rect(margin, y - 2, pageW - 28, rowH, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(String(i + 1), margin + 2, y + 3);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        const nameLines = doc.splitTextToSize(ev.file_name || "", 74);
        doc.text(nameLines, margin + 10, y + 3);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
        doc.text((ev.file_type || "").replace(/_/g, " "), margin + 88, y + 3);
        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        doc.text(ev.event_date ? format(new Date(ev.event_date), "d MMM yy") : "—", margin + 116, y + 3);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(descLines, margin + 142, y + 3);
        y += rowH + 1;
      });
    }

    addPageFooter(doc, pageNum++);

    // ─── PAGE 5: COMPLAINT LETTER ───
    doc.addPage();

    // Letterhead band
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(0, 0, pageW, 22, "F");
    if (logoData) {
      doc.addImage(logoData, "PNG", margin, 2, 36, 18);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(today, pageW - margin, 10, { align: "right" });
    doc.text("Section 4 — Complaint Letter", pageW - margin, 17, { align: "right" });
    y = 30;

    if (client.name) {
      const clientFields2 = [
        client.name && ["From", client.name],
        client.address && ["Address", client.address],
        client.email && ["Email", client.email + (client.phone ? "  |  " + client.phone : "")],
        client.accounts?.length && ["Account(s)", client.accounts.join(", ")],
      ].filter(Boolean);
      const boxH2 = clientFields2.length * 6 + 8;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageW - 28, boxH2, 2, 2, "FD");
      let cy2 = y + 6;
      clientFields2.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(lbl + ":", margin + 4, cy2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        doc.text(String(val), margin + 26, cy2);
        cy2 += 6;
      });
      y = cy2 + 4;
    }

    drawHRule(doc, y);
    y += 8;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    const letterText = caseItem.complaint_letter || "No complaint letter has been generated for this case.";
    const letterLines = doc.splitTextToSize(letterText, pageW - 28);
    letterLines.forEach((line) => {
      if (y > pageH - 18) { addPageFooter(doc, pageNum++); doc.addPage(); y = 14; }
      doc.text(line, margin, y);
      y += 5.5;
    });

    addPageFooter(doc, pageNum);

    const fileName = `CC-Bundle-${caseItem.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);

    setGenerating(false);
    setDone(true);
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Escalation PDF Bundle</h3>
        <p className="text-xs text-muted-foreground">
          Generates a professional, multi-section PDF ready for submission to AFCA, NCAT, TIO, or any tribunal.
        </p>
      </div>

      {/* Readiness */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Bundle Readiness</span>
          <span className={`text-sm font-bold ${readinessScore >= 80 ? "text-success" : readinessScore >= 50 ? "text-warning" : "text-destructive"}`}>
            {readinessScore}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${readinessScore >= 80 ? "bg-success" : readinessScore >= 50 ? "bg-warning" : "bg-destructive"}`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5">
              {c.done
                ? <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                : <AlertCircle className="w-3 h-3 text-muted-foreground shrink-0" />}
              <span className={`text-[10px] ${c.done ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: FileText, label: "Readiness Checklist", desc: "Section 1", color: "text-accent" },
          { icon: Clock, label: "Chronological Timeline", desc: "Section 2", color: "text-warning" },
          { icon: FolderOpen, label: "Evidence Index", desc: "Section 3", color: "text-success" },
          { icon: FileText, label: "Complaint Letter", desc: "Section 4", color: "text-primary" },
        ].map((item) => (
          <div key={item.label} className="bg-secondary/30 border border-border rounded-lg p-3 flex items-center gap-2">
            <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
            <div>
              <p className="text-xs font-medium text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Download button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={generatePDF}
          disabled={generating}
          className="w-full gap-2 h-12 text-sm font-semibold"
          size="lg"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF Bundle...</>
          ) : done ? (
            <><CheckCircle2 className="w-4 h-4" /> PDF Downloaded!</>
          ) : (
            <><Download className="w-4 h-4" /> Download Escalation Bundle (PDF)</>
          )}
        </Button>
      </motion.div>

      <p className="text-[10px] text-muted-foreground text-center">
        Suitable for AFCA, NCAT, TIO, EWON, Energy Ombudsman &amp; all Australian tribunals
      </p>
    </div>
  );
}