import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function getToken(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googletasks');
  return accessToken;
}

async function syncDeadlines(accessToken, deadlines, cases) {
  const taskListsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const taskLists = await taskListsRes.json();

  let taskListId;
  const chaosList = taskLists.items?.find(l => l.title === 'Chaos Controller Deadlines');
  if (chaosList) {
    taskListId = chaosList.id;
  } else {
    const createRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Chaos Controller Deadlines' })
    });
    taskListId = (await createRes.json()).id;
  }

  const existingRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const existingTasks = await existingRes.json();
  const existingMap = new Map();
  existingTasks.items?.forEach(t => {
    const m = t.notes?.match(/DeadlineID:([a-f0-9-]+)/);
    if (m) existingMap.set(m[1], t);
  });

  let created = 0, updated = 0, removed = 0;

  for (const deadline of deadlines) {
    const caseObj = cases.find(c => c.id === deadline.case_id);
    if (!caseObj || ['completed', 'missed'].includes(deadline.status)) continue;

    const title = `[${(deadline.deadline_type || 'DEADLINE').toUpperCase()}] ${deadline.title}`;
    const notes = `Case: ${caseObj.title}\nDeadlineID:${deadline.id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}`;
    const existing = existingMap.get(deadline.id);

    if (existing) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existing.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes, due: deadline.deadline_date + 'T23:59:59.000Z', status: 'needsAction' })
      });
      updated++;
      existingMap.delete(deadline.id);
    } else {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes, due: deadline.deadline_date + 'T23:59:59.000Z', status: 'needsAction' })
      });
      created++;
    }
  }

  for (const [, task] of existingMap) {
    await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    removed++;
  }

  return { tasksCreated: created, tasksUpdated: updated, tasksRemoved: removed };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* scheduled */ }

    const { event: automationEvent, data: automationData } = body;

    const accessToken = await getToken(base44);

    // --- ENTITY AUTOMATION: single deadline ---
    if (automationEvent?.entity_name === 'Deadline') {
      const deadlineId = automationEvent.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ skipped: 'no deadline id' });

      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const deadline = deadlines[0];
      if (!deadline) return Response.json({ skipped: 'deadline not found' });

      const cases = await base44.asServiceRole.entities.Case.filter({ id: deadline.case_id });
      const caseItem = cases[0];
      if (!caseItem) return Response.json({ skipped: 'case not found' });

      const result = await syncDeadlines(accessToken, [deadline], [caseItem]);
      return Response.json({ success: true, ...result });
    }

    // --- FRONTEND: user-specific sync ---
    const user = await base44.auth.me().catch(() => null);
    if (user) {
      const cases = await base44.entities.Case.filter({ created_by_id: user.id });
      const caseIds = cases.map(c => c.id);
      const deadlines = caseIds.length > 0
        ? await base44.entities.Deadline.filter({ case_id: { $in: caseIds }, status: { $in: ['pending', 'extended'] } })
        : [];
      const result = await syncDeadlines(accessToken, deadlines, cases);
      return Response.json({ success: true, message: 'Sync completed', ...result });
    }

    // --- SCHEDULED: all cases ---
    const allCases = await base44.asServiceRole.entities.Case.list();
    const allDeadlines = await base44.asServiceRole.entities.Deadline.filter({ status: { $in: ['pending', 'extended'] } });
    const result = await syncDeadlines(accessToken, allDeadlines, allCases);
    return Response.json({ success: true, ...result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});