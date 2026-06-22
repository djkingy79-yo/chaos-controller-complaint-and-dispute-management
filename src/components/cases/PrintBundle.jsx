import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Clock, FolderOpen, Package, ClipboardList, Siren, BarChart2, Download, Loader2, BookOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { generateChaosDocumentPDF, downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";

const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

async function buildBlob({ type, title, body, sections, matter, date }) {
  const blob = await generateChaosDocumentPDF({
    documentType: type || 'general',
    title,
    body,
    sections,
    matter,
    date,
    includeHeader: true,
    includeFooter: true,
  });
  if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
  return blob;
}

async function generateAndDownload({ type, title, body, sections, matter, date }) {
  pdfDiagStart({ tab: 'Bundle', action: `Download: ${title}`, caseId: null, hasCase: true, hasData: !!(body || sections?.length) });
  try {
    const blob = await buildBlob({ type, title, body, sections, matter, date });
    const filename = `${String(title || 'Document').replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdfDiagBlobCreated({ tab: 'Bundle', action: `Download: ${title}`, blob });
    downloadPDFBlob(blob, filename);
    pdfDiagSuccess({ tab: 'Bundle', action: `Download: ${title}` });
  } catch (error) {
    pdfDiagFail({ tab: 'Bundle', action: `Download: ${title}`, error });
  }
}

async function generateAndPrint({ type, title, body, sections, matter, date }) {
  pdfDiagStart({ tab: 'Bundle', action: `Print: ${title}`, caseId: null, hasCase: true, hasData: !!(body || sections?.length) });
  try {
    const blob = await buildBlob({ type, title, body, sections, matter, date });
    const filename = `${String(title || 'Document').replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdfDiagBlobCreated({ tab: 'Bundle', action: `Print: ${title}`, blob });
    const opened = await openPDFForPrint(blob, filename);
    if (!opened) { toast.warning('Print blocked — downloading instead.'); downloadPDFBlob(blob, filename); }
    pdfDiagSuccess({ tab: 'Bundle', action: `Print: ${title}` });
  } catch (error) {
    pdfDiagFail({ tab: 'Bundle', action: `Print: ${title}`, error });
  }
}

// ── Print variants (open in new tab + print) ──────────────────────────────
async function handleTimelinePDFPrint(caseItem, events) {
  if (!events || events.length === 0) { alert('No timeline events to print.'); return; }
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const body = sorted.map(ev => `${ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'Undated'} — ${ev.title}\nType: ${(ev.event_type || '').replace(/_/g, ' ')}\n${ev.description || ''}`).join('\n\n');
  await generateAndPrint({ type: 'general', title: 'Case Timeline', body: `CASE TIMELINE (${sorted.length} events)\n\n${body}` });
}
async function handleEvidencePDFPrint(caseItem, evidence) {
  if (!evidence || evidence.length === 0) { alert('No evidence files to print.'); return; }
  const sorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const body = sorted.map((ev, i) => `${i + 1}. ${ev.file_name}\nType: ${(ev.file_type || '').replace(/_/g, ' ')} | Date: ${ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'No date'}\n${ev.description || ev.extracted_data?.document_summary || ''}`).join('\n\n');
  await generateAndPrint({ type: 'general', title: 'Evidence Index', body: `EVIDENCE INDEX (${sorted.length} files)\n\n${body}` });
}
async function handleChecklistPDFPrint(caseItem, checklistItems) {
  if (!checklistItems || checklistItems.length === 0) { alert('No checklist items to print.'); return; }
  const body = checklistItems.map(item => `${item.status === 'complete' ? '[x]' : '[ ]'} ${item.label}\nCategory: ${(item.category || '').replace(/_/g, ' ')} | Status: ${(item.status || '').toUpperCase()}`).join('\n\n');
  await generateAndPrint({ type: 'general', title: 'Smart Checklist', body: `SMART CHECKLIST (${checklistItems.length} items)\n\n${body}` });
}
async function handleDeadlinesPDFPrint(caseItem, deadlines) {
  if (!deadlines || deadlines.length === 0) { alert('No deadlines to print.'); return; }
  const sorted = [...deadlines].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
  const body = sorted.map(d => {
    const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), new Date()) : null;
    const urgency = daysLeft === null ? 'No date' : daysLeft < 0 ? `OVERDUE by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} days remaining`;
    return `${d.title}\nDue: ${d.deadline_date ? format(new Date(d.deadline_date), 'd MMM yyyy') : 'No date'} | ${urgency}\nType: ${(d.deadline_type || '').replace(/_/g, ' ')} | Status: ${(d.status || '').toUpperCase()}`;
  }).join('\n\n');
  await generateAndPrint({ type: 'general', title: 'Deadline War Room', body: `DEADLINES (${sorted.length} items)\n\n${body}` });
}
async function handleWeeklySnapshotPDFPrint(caseItem, evidence, events, deadlines) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const recentEvents = (events || []).filter(e => e.event_date && new Date(e.event_date) > weekAgo);
  const upcomingDeadlines = (deadlines || []).filter(d => d.deadline_date && new Date(d.deadline_date) > now && new Date(d.deadline_date) < twoWeeksAhead && d.status === 'pending');
  const overdueDeadlines = (deadlines || []).filter(d => d.deadline_date && new Date(d.deadline_date) < now && d.status === 'pending');
  const sections = [
    { title: 'Case Overview', content: `Title: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || '—'}\nStatus: ${(caseItem.status || '').replace(/_/g, ' ')}\nCategory: ${caseItem.category || '—'}` },
    { title: 'Weekly Activity', content: `This Week: ${recentEvents.length} new events\nUpcoming (14 days): ${upcomingDeadlines.length} deadlines\nOverdue: ${overdueDeadlines.length} items\nTotal Evidence: ${(evidence || []).length} files` },
    { title: 'Recent Activity (Last 7 Days)', content: recentEvents.length > 0 ? recentEvents.map(e => `[${e.event_date}] ${e.title}`).join('\n') : 'No new events this week.' },
    { title: 'Upcoming Deadlines', content: upcomingDeadlines.length > 0 ? upcomingDeadlines.map(d => `${d.title} — Due ${d.deadline_date}`).join('\n') : 'No upcoming deadlines in the next 14 days.' },
    { title: 'Overdue Items', content: overdueDeadlines.length > 0 ? overdueDeadlines.map(d => `${d.title} — Was due ${d.deadline_date} (OVERDUE)`).join('\n') : 'No overdue items.' },
  ];
  await generateAndPrint({ type: 'snapshot', title: 'Weekly Case Snapshot', matter: caseItem.title, date: format(now, 'd MMMM yyyy'), sections });
}

async function handleLetterPDF(caseItem, ld) {
  const content = caseItem[ld.field];
  if (!content || !content.trim()) {
    alert(`${ld.label} has not been generated yet. Go to the Letters tab to generate it first.`);
    return;
  }
  await generateAndDownload({ type: 'general', title: ld.label, body: content });
}

async function handleTimelinePDF(caseItem, events) {
  console.log('DASHBOARD PRINT CLICKED', { tab: 'timeline', caseId: caseItem?.id });
  const timelineCount = events?.length || 0;
  console.log('DATA AVAILABLE', { timelineCount });
  if (!events || events.length === 0) {
    alert('No timeline events to export. Add events in the Timeline tab first.');
    return;
  }
  const sorted = [...events].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const body = sorted.map((ev, i) => {
    const dateStr = ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'Undated';
    return `${dateStr} — ${ev.title}\nType: ${(ev.event_type || '').replace(/_/g, ' ')}\n${ev.description || ''}`;
  }).join('\n\n');
  await generateAndDownload({ type: 'general', title: 'Case Timeline', body: `CASE TIMELINE (${sorted.length} events)\n\n${body}` });
}

async function handleEvidencePDF(caseItem, evidence) {
  console.log('DASHBOARD PRINT CLICKED', { tab: 'evidence', caseId: caseItem?.id });
  const evidenceCount = evidence?.length || 0;
  console.log('DATA AVAILABLE', { evidenceCount });
  if (!evidence || evidence.length === 0) {
    alert('No evidence files to export. Upload files in the Evidence tab first.');
    return;
  }
  const sorted = [...evidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const body = sorted.map((ev, i) => {
    const dateStr = ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'No date';
    return `${i + 1}. ${ev.file_name}\nType: ${(ev.file_type || '').replace(/_/g, ' ')} | Date: ${dateStr}\n${ev.description || ev.extracted_data?.document_summary || ''}`;
  }).join('\n\n');
  await generateAndDownload({ type: 'general', title: 'Evidence Index', body: `EVIDENCE INDEX (${sorted.length} files)\n\n${body}` });
}

async function handleChecklistPDF(caseItem, checklistItems) {
  console.log('DASHBOARD PRINT CLICKED', { tab: 'checklist', caseId: caseItem?.id });
  const checklistCount = checklistItems?.length || 0;
  console.log('DATA AVAILABLE', { checklistCount });
  if (!checklistItems || checklistItems.length === 0) {
    alert('No checklist items to export. Generate the checklist first.');
    return;
  }
  const body = checklistItems.map(item => {
    const tick = item.status === 'complete' ? '[x]' : '[ ]';
    return `${tick} ${item.label}\nCategory: ${(item.category || '').replace(/_/g, ' ')} | Status: ${(item.status || '').toUpperCase()}`;
  }).join('\n\n');
  await generateAndDownload({ type: 'general', title: 'Smart Checklist', body: `SMART CHECKLIST (${checklistItems.length} items)\n\n${body}` });
}

async function handleDeadlinesPDF(caseItem, deadlines) {
  console.log('DASHBOARD PRINT CLICKED', { tab: 'deadlines', caseId: caseItem?.id });
  const deadlineCount = deadlines?.length || 0;
  console.log('DATA AVAILABLE', { deadlineCount });
  if (!deadlines || deadlines.length === 0) {
    alert('No deadlines to export. Add deadlines in the Deadlines tab first.');
    return;
  }
  const sorted = [...deadlines].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
  const body = sorted.map(d => {
    const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), new Date()) : null;
    const urgency = daysLeft === null ? 'No date' : daysLeft < 0 ? `OVERDUE by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} days remaining`;
    return `${d.title}\nDue: ${d.deadline_date ? format(new Date(d.deadline_date), 'd MMM yyyy') : 'No date'} | ${urgency}\nType: ${(d.deadline_type || '').replace(/_/g, ' ')} | Status: ${(d.status || '').toUpperCase()}`;
  }).join('\n\n');
  await generateAndDownload({ type: 'general', title: 'Deadline War Room', body: `DEADLINES (${sorted.length} items)\n\n${body}` });
}

function buildSummaryBody(caseItem, evidence, events, deadlines, checklistItems) {
  const now = new Date();
  const allDeadlines = deadlines || [];
  const allEvents = events || [];
  const allEvidence = evidence || [];
  const allChecklist = checklistItems || [];

  const sortedDeadlines = [...allDeadlines].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
  const sortedEvents = [...allEvents].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));
  const sortedEvidence = [...allEvidence].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date));

  const completedChecklist = allChecklist.filter(i => i.status === 'complete');
  const pendingChecklist = allChecklist.filter(i => i.status !== 'complete');
  const overdueDeadlines = sortedDeadlines.filter(d => d.deadline_date && new Date(d.deadline_date) < now && d.status === 'pending');
  const upcomingDeadlines = sortedDeadlines.filter(d => d.deadline_date && new Date(d.deadline_date) >= now && d.status === 'pending');

  // Parse AI summary if available
  let aiSummary = null;
  if (caseItem.executive_summary) {
    try { aiSummary = JSON.parse(caseItem.executive_summary); } catch(e) {}
  }

  const letterStatus = [
    { label: '1st Complaint Letter', field: 'complaint_letter' },
    { label: '2nd Complaint Letter', field: 'complaint_letter_2' },
    { label: '3rd Complaint Letter', field: 'complaint_letter_3' },
    { label: 'Accept Offer Letter', field: 'letter_accept_offer' },
    { label: 'Deny Offer Letter', field: 'letter_deny_offer' },
    { label: 'Escalation Letter', field: 'letter_escalation' },
  ];

  const lines = [
    '========================================',
    'CHAOS CONTROLLER - COMPLETE CASE REPORT',
    '========================================',
    `Generated: ${format(now, 'd MMMM yyyy, h:mm a')}`,
    '',
    '----------------------------------------',
    'SECTION 1 - CASE INFORMATION',
    '----------------------------------------',
    `Case Title: ${caseItem.title || '—'}`,
    `Organisation: ${caseItem.organisation_name || '—'}`,
    `Industry Category: ${(caseItem.category || '—').toUpperCase()}`,
    `Status: ${(caseItem.status || '').replace(/_/g, ' ').toUpperCase()}`,
    `Priority: ${(caseItem.priority || '').toUpperCase()}`,
    `Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), 'd MMMM yyyy') : '—'}`,
    `Response Deadline: ${caseItem.response_deadline ? format(new Date(caseItem.response_deadline), 'd MMMM yyyy') : '—'}`,
    `Escalation Body: ${caseItem.escalation_body || '—'}`,
    `Account/Reference: ${caseItem.account_number || '—'}`,
    '',
    '----------------------------------------',
    'SECTION 2 - COMPLAINANT DETAILS',
    '----------------------------------------',
    `Full Name: ${caseItem.complainant_name || '—'}`,
    `Address: ${caseItem.complainant_address || '—'}`,
    `Email: ${caseItem.complainant_email || '—'}`,
    `Phone: ${caseItem.complainant_phone || '—'}`,
    '',
    '----------------------------------------',
    'SECTION 3 - ORGANISATION DETAILS',
    '----------------------------------------',
    `Organisation: ${caseItem.organisation_name || '—'}`,
    `Complaints Address: ${caseItem.organisation_complaints_address || '—'}`,
    `Complaints Email: ${caseItem.organisation_complaints_email || '—'}`,
    `Complaint Handler: ${caseItem.complaint_handler_name || '—'}`,
    '',
    '----------------------------------------',
    'SECTION 4 - COMPLAINT DETAILS',
    '----------------------------------------',
    'Issue Summary:',
    caseItem.issue_summary || '—',
    '',
    'Full Details:',
    caseItem.issue_details || '—',
    '',
    'Desired Outcome:',
    caseItem.desired_outcome || '—',
    caseItem.notes ? `\nNotes: ${caseItem.notes}` : '',
    '',
    '----------------------------------------',
    'SECTION 5 - DASHBOARD METRICS',
    '----------------------------------------',
    `Evidence Files Uploaded: ${allEvidence.length}`,
    `Timeline Events Recorded: ${allEvents.length}`,
    `Total Deadlines: ${allDeadlines.length}`,
    `Overdue Deadlines: ${overdueDeadlines.length}`,
    `Checklist Items Total: ${allChecklist.length}`,
    `Checklist Complete: ${completedChecklist.length}`,
    `Checklist Pending: ${pendingChecklist.length}`,
    `Letters Generated: ${letterStatus.filter(l => caseItem[l.field]).length} of 6`,
  ].filter(l => l !== undefined);

  // AI Assessment
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('SECTION 6 - AI CASE ASSESSMENT');
  lines.push('----------------------------------------');
  if (aiSummary) {
    if (aiSummary.case_overview) { lines.push('Case Overview:'); lines.push(aiSummary.case_overview); lines.push(''); }
    if (aiSummary.facts?.length) { lines.push('Established Facts:'); aiSummary.facts.forEach(f => lines.push(`- ${f}`)); lines.push(''); }
    if (aiSummary.timeline_summary) { lines.push('Timeline Summary:'); lines.push(aiSummary.timeline_summary); lines.push(''); }
    if (aiSummary.evidence_summary?.length) { lines.push('Evidence Summary:'); aiSummary.evidence_summary.forEach(e => lines.push(`- ${e}`)); lines.push(''); }
    if (aiSummary.strengths?.length) { lines.push('Case Strengths:'); aiSummary.strengths.forEach(s => lines.push(`- ${s}`)); lines.push(''); }
    if (aiSummary.weaknesses?.length) { lines.push('Weaknesses / Risks:'); aiSummary.weaknesses.forEach(w => lines.push(`- ${w}`)); lines.push(''); }
    if (aiSummary.missing_evidence?.length) { lines.push('Missing Evidence:'); aiSummary.missing_evidence.forEach(m => lines.push(`- ${m}`)); lines.push(''); }
    if (aiSummary.next_actions?.length) { lines.push('Recommended Next Actions:'); aiSummary.next_actions.forEach(a => lines.push(`- ${a}`)); lines.push(''); }
    if (aiSummary.escalation_path) { lines.push('Escalation Path:'); lines.push(aiSummary.escalation_path); }
  } else {
    lines.push('AI Case Assessment not yet generated.');
    lines.push('Go to the Summary tab and click Generate Case Summary to produce this section.');
  }

  // Evidence
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('SECTION 7 - EVIDENCE INDEX');
  lines.push('----------------------------------------');
  if (sortedEvidence.length > 0) {
    sortedEvidence.forEach((ev, i) => {
      lines.push(`${i + 1}. ${ev.file_name}`);
      lines.push(`   Type: ${(ev.file_type || 'other').replace(/_/g, ' ')} | Date: ${ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'No date'}`);
      if (ev.description) lines.push(`   Description: ${ev.description}`);
      if (ev.extracted_data?.document_summary) lines.push(`   OCR Summary: ${ev.extracted_data.document_summary.slice(0, 300)}`);
      lines.push('');
    });
  } else {
    lines.push('No evidence files uploaded.');
  }

  // Timeline
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('SECTION 8 - CASE TIMELINE');
  lines.push('----------------------------------------');
  if (sortedEvents.length > 0) {
    sortedEvents.forEach(ev => {
      lines.push(`${ev.event_date ? format(new Date(ev.event_date), 'd MMM yyyy') : 'Undated'} - ${ev.title}`);
      lines.push(`   Type: ${(ev.event_type || '').replace(/_/g, ' ')}${ev.is_action_required ? ' [ACTION REQUIRED]' : ''}`);
      if (ev.description) lines.push(`   ${ev.description}`);
      lines.push('');
    });
  } else {
    lines.push('No timeline events recorded.');
  }

  // Deadlines
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('SECTION 9 - DEADLINES');
  lines.push('----------------------------------------');
  if (sortedDeadlines.length > 0) {
    sortedDeadlines.forEach(d => {
      const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), now) : null;
      const urgency = daysLeft === null ? '' : daysLeft < 0 ? ` [OVERDUE by ${Math.abs(daysLeft)} days]` : daysLeft === 0 ? ' [DUE TODAY]' : ` [${daysLeft} days remaining]`;
      lines.push(`${d.title}`);
      lines.push(`   Due: ${d.deadline_date ? format(new Date(d.deadline_date), 'd MMMM yyyy') : 'No date'}${urgency}`);
      lines.push(`   Type: ${(d.deadline_type || '').replace(/_/g, ' ')} | Status: ${(d.status || '').toUpperCase()} | Responsibility: ${d.responsibility || 'user'}`);
      if (d.notes) lines.push(`   Notes: ${d.notes}`);
      lines.push('');
    });
  } else {
    lines.push('No deadlines recorded.');
  }

  // Checklist
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('SECTION 10 - CHECKLIST');
  lines.push('----------------------------------------');
  if (allChecklist.length > 0) {
    lines.push(`Complete: ${completedChecklist.length} | Pending: ${pendingChecklist.length}`);
    lines.push('');
    allChecklist.forEach(item => {
      const tick = item.status === 'complete' ? 'YES -' : 'NO  -';
      lines.push(`${tick} ${item.label}`);
      lines.push(`       Category: ${(item.category || '').replace(/_/g, ' ')} | Priority: ${item.priority || 'medium'} | Status: ${(item.status || '').toUpperCase()}`);
    });
  } else {
    lines.push('No checklist items. Generate checklist from the Checklist tab.');
  }

  // Letters
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('SECTION 11 - GENERATED LETTERS');
  lines.push('----------------------------------------');
  letterStatus.forEach(lt => {
    const content = caseItem[lt.field];
    if (content) {
      lines.push(`${lt.label}:`);
      lines.push('');
      lines.push(content.replace(/<[^>]*>/g, ''));
      lines.push('');
      lines.push('----------------------------------------');
    } else {
      lines.push(`${lt.label}: Not yet generated.`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

async function handleCaseSummaryPDF(caseItem, evidence, events, deadlines, checklistItems) {
  await generateAndDownload({ type: 'general', title: 'Complete Case Report', body: buildSummaryBody(caseItem, evidence, events, deadlines, checklistItems) });
}

async function handleWeeklySnapshotPDF(caseItem, evidence, events, deadlines) {
  console.log('DASHBOARD PRINT CLICKED', { tab: 'weekly-snapshot', caseId: caseItem?.id });
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const recentEvents = (events || []).filter(e => e.event_date && new Date(e.event_date) > weekAgo);
  const upcomingDeadlines = (deadlines || []).filter(d => d.deadline_date && new Date(d.deadline_date) > now && new Date(d.deadline_date) < twoWeeksAhead && d.status === 'pending');
  const overdueDeadlines = (deadlines || []).filter(d => d.deadline_date && new Date(d.deadline_date) < now && d.status === 'pending');

  console.log('DATA AVAILABLE', { timelineCount: events?.length, deadlineCount: deadlines?.length });

  const sections = [
    {
      title: 'Case Overview',
      content: `Title: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || '—'}\nStatus: ${(caseItem.status || '').replace(/_/g, ' ')}\nCategory: ${caseItem.category || '—'}`,
    },
    {
      title: 'Weekly Activity',
      content: `This Week: ${recentEvents.length} new events\nUpcoming (14 days): ${upcomingDeadlines.length} deadlines\nOverdue: ${overdueDeadlines.length} items\nTotal Evidence: ${(evidence || []).length} files`,
    },
    {
      title: 'Recent Activity (Last 7 Days)',
      content: recentEvents.length > 0
        ? recentEvents.map(e => `[${e.event_date}] ${e.title}`).join('\n')
        : 'No new events this week.',
    },
    {
      title: 'Upcoming Deadlines',
      content: upcomingDeadlines.length > 0
        ? upcomingDeadlines.map(d => `${d.title} — Due ${d.deadline_date}`).join('\n')
        : 'No upcoming deadlines in the next 14 days.',
    },
    {
      title: 'Overdue Items',
      content: overdueDeadlines.length > 0
        ? overdueDeadlines.map(d => `${d.title} — Was due ${d.deadline_date} (OVERDUE)`).join('\n')
        : 'No overdue items.',
    },
  ];

  try {
    console.log('DASHBOARD PDF GENERATOR START', { type: 'snapshot' });
    const blob = await generateChaosDocumentPDF({
      documentType: 'snapshot',
      title: 'Weekly Case Snapshot',
      matter: caseItem.title,
      date: format(now, 'd MMMM yyyy'),
      sections,
      includeHeader: true,
      includeFooter: true,
    });
    if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
    downloadPDFBlob(blob, `Weekly_Snapshot_${format(now, 'yyyy-MM-dd')}.pdf`);
    console.log('PDF GENERATED', { type: 'snapshot' });
    toast.success('Weekly Snapshot PDF downloaded');
  } catch (error) {
    console.error('PDF FAILED', error);
    alert('PDF failed: ' + error.message);
  }
}

export default function PrintBundle({ caseItem, evidence, events }) {
  const [checklistItems, setChecklistItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loadingPDF, setLoadingPDF] = useState(null);

  useEffect(() => {
    if (!caseItem?.id) return;
    base44.entities.ChecklistItem.filter({ case_id: caseItem.id }).then(setChecklistItems).catch(() => {});
    base44.entities.Deadline.filter({ case_id: caseItem.id }).then(setDeadlines).catch(() => {});
  }, [caseItem?.id]);

  const run = async (key, fn) => {
    setLoadingPDF(key);
    try {
      await fn();
    } finally {
      setLoadingPDF(null);
    }
  };

  const PDFButton = ({ id, label, icon: Icon, iconColor, description, onClick, onPrint, fullWidth }) => (
    <div className={`bg-card border border-border rounded-xl p-4 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          {(loadingPDF === id || loadingPDF === id + '_print') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </div>
        <span className="font-medium text-sm text-foreground">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="flex gap-2">
        <button
          onClick={() => run(id, onClick)}
          disabled={!!loadingPDF}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-border rounded-lg py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Download className="w-3 h-3" /> Download PDF
        </button>
        <button
          onClick={() => run(id + '_print', onPrint)}
          disabled={!!loadingPDF}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-border rounded-lg py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Printer className="w-3 h-3" /> Print PDF
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Full Bundle */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-primary/15 rounded-lg">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-foreground">Generate PDF Bundle</p>
            <p className="text-xs text-muted-foreground">Download complete case bundle as PDF</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => run('bundle', () => handleCaseSummaryPDF(caseItem, evidence, events, deadlines, checklistItems))}
            disabled={!!loadingPDF}
            className="flex-1 gap-2 h-10 font-bold"
            size="lg"
          >
            {loadingPDF === 'bundle' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loadingPDF === 'bundle' ? 'Generating...' : 'Download Case Summary PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={() => run('bundle_print', () => generateAndPrint({ type: 'general', title: 'Complete Case Report', body: buildSummaryBody(caseItem, evidence, events, deadlines, checklistItems) }))}
            disabled={!!loadingPDF}
            className="flex-1 gap-2 h-10 font-bold"
            size="lg"
          >
            {loadingPDF === 'bundle_print' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {loadingPDF === 'bundle_print' ? 'Generating...' : 'Print Case Summary PDF'}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Download Individual Sections</h3>
        <p className="text-xs text-muted-foreground mb-3">Each button generates a standalone A4 PDF with Chaos header &amp; footer.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {LETTER_DEFS.map((ld) => (
          <PDFButton
            key={ld.field}
            id={ld.field}
            label={ld.label}
            icon={FileText}
            iconColor="bg-primary/10"
            description={caseItem[ld.field] ? 'Download or print PDF letter' : 'Not yet generated — go to Letters tab'}
            onClick={() => handleLetterPDF(caseItem, ld)}
            onPrint={() => generateAndPrint({ type: 'general', title: ld.label, body: caseItem[ld.field] || '' })}
          />
        ))}

        <PDFButton
          id="timeline"
          label="Chronological Timeline"
          icon={Clock}
          iconColor="bg-warning/10"
          description={`${events?.length || 0} events in date order`}
          onClick={() => handleTimelinePDF(caseItem, events)}
          onPrint={() => handleTimelinePDFPrint(caseItem, events)}
          fullWidth
        />

        <PDFButton
          id="evidence"
          label="Evidence Index"
          icon={FolderOpen}
          iconColor="bg-success/10"
          description={`${evidence?.length || 0} documents indexed`}
          onClick={() => handleEvidencePDF(caseItem, evidence)}
          onPrint={() => handleEvidencePDFPrint(caseItem, evidence)}
        />

        <PDFButton
          id="checklist"
          label="Smart Checklist"
          icon={ClipboardList}
          iconColor="bg-accent/10"
          description={`${checklistItems.length} action items`}
          onClick={() => handleChecklistPDF(caseItem, checklistItems)}
          onPrint={() => handleChecklistPDFPrint(caseItem, checklistItems)}
        />

        <PDFButton
          id="deadlines"
          label="Deadline War Room"
          icon={Siren}
          iconColor="bg-destructive/10"
          description={`${deadlines.length} deadlines with urgency status`}
          onClick={() => handleDeadlinesPDF(caseItem, deadlines)}
          onPrint={() => handleDeadlinesPDFPrint(caseItem, deadlines)}
          fullWidth
        />

        <PDFButton
          id="weekly"
          label="Weekly Snapshot Report"
          icon={BarChart2}
          iconColor="bg-accent/10"
          description="Weekly activity summary & upcoming actions"
          onClick={() => handleWeeklySnapshotPDF(caseItem, evidence, events, deadlines)}
          onPrint={() => handleWeeklySnapshotPDFPrint(caseItem, evidence, events, deadlines)}
          fullWidth
        />
      </div>
    </div>
  );
}