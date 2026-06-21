import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function graphRequest(accessToken, path, options = {}, retryCount = 0) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
  });
  if (res.status === 429 && retryCount < 3) {
    const retryAfter = parseInt(res.headers.get('Retry-After')) || Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return graphRequest(accessToken, path, options, retryCount + 1);
  }
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getExistingOutlookEventSubjects(accessToken) {
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?$select=subject&$top=500&$filter=startsWith(subject,'⚖️ [Chaos Controller]')`,
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    if (!res.ok) {
      // fallback: fetch all upcoming and filter locally
      const res2 = await fetch(
        `https://graph.microsoft.com/v1.0/me/events?$select=subject&$top=500`,
        { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      if (!res2.ok) return new Set();
      const d2 = await res2.json();
      return new Set((d2.value || []).map(e => e.subject));
    }
    const data = await res.json();
    return new Set((data.value || []).map(e => e.subject));
  } catch { return new Set(); }
}

async function syncCaseToOutlook(accessToken, caseItem, deadlines, checklistItems, timelineEvents, existingSubjects) {
  const synced = [];
  const caseId = caseItem.id;

  // Sync deadlines as Outlook calendar events (skip already synced by subject)
  for (const dl of deadlines) {
    if (!dl.deadline_date || dl.status === 'completed') continue;
    const subject = `⚖️ [Chaos Controller] Deadline: ${dl.title}`;
    if (existingSubjects.has(subject)) continue; // deduplicate
    const startDate = new Date(dl.deadline_date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(dl.deadline_date);
    endDate.setHours(10, 0, 0, 0);
    const event = {
      subject: `⚖️ [Chaos Controller] Deadline: ${dl.title}`,
      body: {
        contentType: 'text',
        content: `Case: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nDeadline Type: ${dl.deadline_type || 'other'}\n${dl.notes ? 'Notes: ' + dl.notes : ''}\n\nView case: https://chaoscontroller.com.au/case/${caseId}`
      },
      start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
      end: { dateTime: endDate.toISOString(), timeZone: 'Australia/Sydney' },
      isReminderOn: true,
      reminderMinutesBeforeStart: 1440,
      categories: ['Chaos Controller'],
      importance: dl.deadline_type === 'tribunal_date' ? 'high' : 'normal'
    };
    await new Promise(resolve => setTimeout(resolve, 500));
    await graphRequest(accessToken, '/me/events', { method: 'POST', body: JSON.stringify(event) });
    synced.push({ type: 'deadline', title: dl.title, case: caseItem.title });
  }

  // Sync pending checklist items as all-day calendar reminders
  const pendingItems = checklistItems.filter(i => i.status !== 'complete');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  for (const item of pendingItems) {
    const taskSubject = `☑️ [CC] ${item.label} — ${caseItem.title}`;
    if (existingSubjects.has(taskSubject)) continue;
    const tEnd = new Date(tomorrow);
    tEnd.setHours(8, 30, 0, 0);
    const task = {
      subject: taskSubject,
      body: { contentType: 'text', content: `Case: ${caseItem.title}\nCategory: ${item.category}\nStatus: ${item.status}\n${item.notes || ''}` },
      start: { dateTime: tomorrow.toISOString(), timeZone: 'Australia/Sydney' },
      end: { dateTime: tEnd.toISOString(), timeZone: 'Australia/Sydney' },
      isReminderOn: true,
      reminderMinutesBeforeStart: 0,
      categories: ['Chaos Controller']
    };
    await new Promise(resolve => setTimeout(resolve, 500));
    await graphRequest(accessToken, '/me/events', { method: 'POST', body: JSON.stringify(task) });
    synced.push({ type: 'task', title: item.label, case: caseItem.title });
  }

  // Sync future action-required timeline events
  const now = new Date();
  const actionEvents = timelineEvents.filter(e => e.is_action_required && e.event_date && new Date(e.event_date) >= now);
  for (const ev of actionEvents) {
    const startDate = new Date(ev.event_date);
    startDate.setHours(10, 0, 0, 0);
    const endDate = new Date(ev.event_date);
    endDate.setHours(11, 0, 0, 0);
    const calEvent = {
      subject: `🚨 [Chaos Controller] Action: ${ev.title}`,
      body: {
        contentType: 'text',
        content: `${ev.description || ''}\n\nCase: ${caseItem.title}\nView: https://chaoscontroller.com.au/case/${caseId}`
      },
      start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
      end: { dateTime: endDate.toISOString(), timeZone: 'Australia/Sydney' },
      isReminderOn: true,
      reminderMinutesBeforeStart: 60
    };
    await new Promise(resolve => setTimeout(resolve, 500));
    await graphRequest(accessToken, '/me/events', { method: 'POST', body: JSON.stringify(calEvent) });
    synced.push({ type: 'action_event', title: ev.title, case: caseItem.title });
  }

  return synced;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = await req.json(); } catch { /* scheduled call — no body */ }

    const { caseId, event: automationEvent, data: automationData } = body;

    // Get Outlook access token (shared connector)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    // --- ENTITY AUTOMATION PATH: single deadline create/update ---
    if (automationEvent?.entity_name === 'Deadline') {
      const deadlineId = automationEvent.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ skipped: 'no deadline id' });
      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const dl = deadlines[0];
      if (!dl?.deadline_date || dl.status === 'completed') return Response.json({ skipped: 'no date or completed' });
      const cases = await base44.asServiceRole.entities.Case.filter({ id: dl.case_id });
      const caseItem = cases[0];
      if (!caseItem) return Response.json({ skipped: 'case not found' });
      const existingSubjects = await getExistingOutlookEventSubjects(accessToken);
      const subject = `⚖️ [Chaos Controller] Deadline: ${dl.title}`;
      if (existingSubjects.has(subject)) return Response.json({ skipped: 'already synced' });
      const synced = await syncCaseToOutlook(accessToken, caseItem, [dl], [], [], existingSubjects);
      return Response.json({ success: true, synced: synced.length, items: synced });
    }

    const activeStatuses = ['draft', 'complaint_sent', 'awaiting_response', 'response_received', 'escalation_ready', 'escalated'];

    let casesToSync = [];
    if (caseId) {
      // Single case (from UI)
      const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
      casesToSync = cases.slice(0, 1);
    } else {
      // Batch: sync all active cases (scheduled run)
      const allCases = await base44.asServiceRole.entities.Case.list();
      casesToSync = allCases.filter(c => activeStatuses.includes(c.status));
    }

    if (!casesToSync.length) return Response.json({ success: true, synced: 0, items: [] });

    // Fetch existing synced event subjects once to deduplicate across all cases
    const existingSubjects = await getExistingOutlookEventSubjects(accessToken);

    const allSynced = [];
    for (const caseItem of casesToSync) {
      const [deadlines, checklistItems, timelineEvents] = await Promise.all([
        base44.asServiceRole.entities.Deadline.filter({ case_id: caseItem.id }),
        base44.asServiceRole.entities.ChecklistItem.filter({ case_id: caseItem.id }),
        base44.asServiceRole.entities.TimelineEvent.filter({ case_id: caseItem.id }),
      ]);
      const synced = await syncCaseToOutlook(accessToken, caseItem, deadlines, checklistItems, timelineEvents, existingSubjects);
      allSynced.push(...synced);
    }

    return Response.json({ success: true, synced: allSynced.length, items: allSynced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});