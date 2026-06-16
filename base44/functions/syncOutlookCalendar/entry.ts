import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
  });
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function syncCaseToOutlook(accessToken, caseItem, deadlines, checklistItems, timelineEvents) {
  const synced = [];
  const caseId = caseItem.id;

  // Sync deadlines as Outlook calendar events
  for (const dl of deadlines) {
    if (!dl.deadline_date || dl.status === 'completed') continue;
    const startDate = new Date(dl.deadline_date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(dl.deadline_date);
    endDate.setHours(10, 0, 0, 0);
    const event = {
      subject: `⚖️ [Chaos Controller] Deadline: ${dl.title}`,
      body: {
        contentType: 'text',
        content: `Case: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nDeadline Type: ${dl.deadline_type || 'other'}\n${dl.notes ? 'Notes: ' + dl.notes : ''}\n\nView case: https://chaoscontroller.base44.app/case/${caseId}`
      },
      start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
      end: { dateTime: endDate.toISOString(), timeZone: 'Australia/Sydney' },
      isReminderOn: true,
      reminderMinutesBeforeStart: 1440,
      categories: ['Chaos Controller'],
      importance: dl.deadline_type === 'tribunal_date' ? 'high' : 'normal'
    };
    await graphRequest(accessToken, '/me/events', { method: 'POST', body: JSON.stringify(event) });
    synced.push({ type: 'deadline', title: dl.title, case: caseItem.title });
  }

  // Sync pending checklist items as Outlook To-Do tasks
  const pendingItems = checklistItems.filter(i => i.status !== 'complete');
  for (const item of pendingItems) {
    const task = {
      subject: `☑️ [CC] ${item.label}`,
      body: {
        contentType: 'text',
        content: `Case: ${caseItem.title}\nCategory: ${item.category}\nStatus: ${item.status}\n${item.notes || ''}`
      },
      importance: item.category === 'escalation' ? 'high' : 'normal',
      status: 'notStarted'
    };
    await graphRequest(accessToken, '/me/tasks/lists/@default/tasks', { method: 'POST', body: JSON.stringify(task) });
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
        content: `${ev.description || ''}\n\nCase: ${caseItem.title}\nView: https://chaoscontroller.base44.app/case/${caseId}`
      },
      start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
      end: { dateTime: endDate.toISOString(), timeZone: 'Australia/Sydney' },
      isReminderOn: true,
      reminderMinutesBeforeStart: 60
    };
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

    const { caseId } = body;

    // Get Outlook access token (shared connector)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

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

    const allSynced = [];
    for (const caseItem of casesToSync) {
      const [deadlines, checklistItems, timelineEvents] = await Promise.all([
        base44.asServiceRole.entities.Deadline.filter({ case_id: caseItem.id }),
        base44.asServiceRole.entities.ChecklistItem.filter({ case_id: caseItem.id }),
        base44.asServiceRole.entities.TimelineEvent.filter({ case_id: caseItem.id }),
      ]);
      const synced = await syncCaseToOutlook(accessToken, caseItem, deadlines, checklistItems, timelineEvents);
      allSynced.push(...synced);
    }

    return Response.json({ success: true, synced: allSynced.length, items: allSynced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});