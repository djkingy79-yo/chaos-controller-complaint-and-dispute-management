import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Clock, FolderOpen, Package, ClipboardList, Siren, BarChart2, Download, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { generateChaosDocumentPDF, downloadPDFBlob } from "@/lib/pdfGenerator";
import { toast } from "sonner";

const LETTER_DEFS = [
  { field: "complaint_letter", label: "1st Complaint Letter" },
  { field: "complaint_letter_2", label: "2nd Complaint Letter" },
  { field: "complaint_letter_3", label: "3rd Complaint Letter" },
  { field: "letter_accept_offer", label: "Acceptance of Offer" },
  { field: "letter_deny_offer", label: "Rejection of Offer" },
  { field: "letter_escalation", label: "Escalation Letter" },
];

async function generateAndDownload({ type, title, body, sections, matter, date }) {
  console.log('DASHBOARD PRINT CLICKED', { type, title });
  console.log('DASHBOARD PDF GENERATOR START', { type });
  try {
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
    const filename = `${String(title || 'Document').replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    downloadPDFBlob(blob, filename);
    console.log('PDF GENERATED', { type, title });
    if (blob._warnings?.length) toast.warning('PDF generated but branding image failed to load.');
    else toast.success(`${title} downloaded`);
  } catch (error) {
    console.error('PDF FAILED', error);
    alert('PDF failed: ' + error.message);
  }
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

async function handleCaseSummaryPDF(caseItem, evidence, events, deadlines) {
  console.log('DASHBOARD PRINT CLICKED', { tab: 'summary', caseId: caseItem?.id });
  const hasSummary = !!caseItem?.issue_summary;
  const timelineCount = events?.length || 0;
  const evidenceCount = evidence?.length || 0;
  const deadlineCount = deadlines?.length || 0;
  console.log('DATA AVAILABLE', { hasSummary, timelineCount, evidenceCount, deadlineCount });

  const upcomingDeadlines = (deadlines || [])
    .filter(d => d.status === 'pending' && d.deadline_date)
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
    .slice(0, 5);

  const deadlineLines = upcomingDeadlines.length > 0
    ? upcomingDeadlines.map(d => {
        const daysLeft = differenceInDays(new Date(d.deadline_date), new Date());
        const urgency = daysLeft < 0 ? `OVERDUE (${Math.abs(daysLeft)}d)` : daysLeft === 0 ? 'TODAY' : `${daysLeft} days`;
        return `${d.title} — Due: ${format(new Date(d.deadline_date), 'd MMM yyyy')} | ${urgency}`;
      }).join('\n')
    : 'No upcoming deadlines.';

  const body = [
    'CASE DETAILS',
    `Organisation: ${caseItem.organisation_name || '—'}`,
    `Status: ${(caseItem.status || '').replace(/_/g, ' ').toUpperCase()}`,
    `Category: ${caseItem.category || '—'}`,
    `Priority: ${(caseItem.priority || '').toUpperCase()}`,
    `Complainant: ${caseItem.complainant_name || '—'}`,
    `Account #: ${caseItem.account_number || '—'}`,
    `Incident Date: ${caseItem.incident_date ? format(new Date(caseItem.incident_date), 'd MMMM yyyy') : '—'}`,
    `Escalation Body: ${caseItem.escalation_body || '—'}`,
    '',
    'ISSUE SUMMARY',
    caseItem.issue_summary || '—',
    '',
    'DESIRED OUTCOME',
    caseItem.desired_outcome || '—',
    '',
    `STATISTICS`,
    `Evidence Files: ${evidenceCount}`,
    `Timeline Events: ${timelineCount}`,
    `Upcoming Deadlines: ${deadlineCount}`,
    '',
    `UPCOMING DEADLINES`,
    deadlineLines,
  ].join('\n');

  await generateAndDownload({ type: 'general', title: 'Case Summary Report', body });
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

  const PDFButton = ({ id, label, icon: Icon, iconColor, description, onClick, fullWidth }) => (
    <button
      onClick={() => run(id, onClick)}
      disabled={loadingPDF === id}
      className={`bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group disabled:opacity-60 ${fullWidth ? 'col-span-full' : ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          {loadingPDF === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </div>
        <span className="font-medium text-sm text-foreground">{label}</span>
        <Download className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
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
        <Button
          onClick={() => run('bundle', () => handleCaseSummaryPDF(caseItem, evidence, events, deadlines))}
          disabled={loadingPDF === 'bundle'}
          className="w-full gap-2 mb-2 h-10 text-base font-bold"
          size="lg"
        >
          {loadingPDF === 'bundle' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loadingPDF === 'bundle' ? 'Generating PDF...' : 'Download Case Summary PDF'}
        </Button>
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
            description={caseItem[ld.field] ? 'Download PDF letter' : 'Not yet generated — go to Letters tab'}
            onClick={() => handleLetterPDF(caseItem, ld)}
          />
        ))}

        <PDFButton
          id="timeline"
          label="Chronological Timeline"
          icon={Clock}
          iconColor="bg-warning/10"
          description={`Download all ${events?.length || 0} events in date order`}
          onClick={() => handleTimelinePDF(caseItem, events)}
          fullWidth
        />

        <PDFButton
          id="evidence"
          label="Evidence Index"
          icon={FolderOpen}
          iconColor="bg-success/10"
          description={`Download indexed list of ${evidence?.length || 0} documents`}
          onClick={() => handleEvidencePDF(caseItem, evidence)}
        />

        <PDFButton
          id="checklist"
          label="Smart Checklist"
          icon={ClipboardList}
          iconColor="bg-accent/10"
          description={`Download ${checklistItems.length} AI-generated action items`}
          onClick={() => handleChecklistPDF(caseItem, checklistItems)}
        />

        <PDFButton
          id="deadlines"
          label="Deadline War Room"
          icon={Siren}
          iconColor="bg-destructive/10"
          description={`Download all ${deadlines.length} deadlines with urgency status`}
          onClick={() => handleDeadlinesPDF(caseItem, deadlines)}
          fullWidth
        />

        <PDFButton
          id="weekly"
          label="Weekly Snapshot Report"
          icon={BarChart2}
          iconColor="bg-accent/10"
          description="Download weekly activity summary & upcoming actions"
          onClick={() => handleWeeklySnapshotPDF(caseItem, evidence, events, deadlines)}
          fullWidth
        />
      </div>
    </div>
  );
}