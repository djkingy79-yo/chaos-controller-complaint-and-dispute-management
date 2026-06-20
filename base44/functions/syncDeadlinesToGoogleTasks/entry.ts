import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GOOGLE_CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function syncUserDeadlines(accessToken, deadlines, cases) {
  // Find or create the Chaos Controller task list
  const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const taskLists = await taskListsResponse.json();
  
  let taskListId;
  const chaosList = taskLists.items?.find(list => list.title === 'Chaos Controller Deadlines');
  if (chaosList) {
    taskListId = chaosList.id;
  } else {
    const createRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Chaos Controller Deadlines' })
    });
    const newList = await createRes.json();
    taskListId = newList.id;
  }

  // Get existing tasks keyed by deadline ID
  const existingTasksRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const existingTasks = await existingTasksRes.json();
  const existingTaskMap = new Map();
  existingTasks.items?.forEach(task => {
    const match = task.notes?.match(/DeadlineID:([a-f0-9-]+)/);
    if (match) existingTaskMap.set(match[1], task);
  });

  let tasksCreated = 0;
  let tasksUpdated = 0;
  let tasksRemoved = 0;

  for (const deadline of deadlines) {
    const caseObj = cases.find(c => c.id === deadline.case_id);
    if (!caseObj) continue;
    if (deadline.status === 'completed' || deadline.status === 'missed') continue;

    const taskTitle = `[${(deadline.deadline_type || 'DEADLINE').toUpperCase()}] ${deadline.title}`;
    const taskNotes = `Case: ${caseObj.title}\nDeadlineID:${deadline.id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}`;
    const existing = existingTaskMap.get(deadline.id);

    if (existing) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existing.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, notes: taskNotes, due: deadline.deadline_date + 'T23:59:59.000Z', status: 'needsAction' })
      });
      tasksUpdated++;
      existingTaskMap.delete(deadline.id);
    } else {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, notes: taskNotes, due: deadline.deadline_date + 'T23:59:59.000Z', status: 'needsAction' })
      });
      tasksCreated++;
    }
  }

  // Remove tasks for completed/deleted deadlines
  for (const [, task] of existingTaskMap) {
    await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    tasksRemoved++;
  }

  return { tasksCreated, tasksUpdated, tasksRemoved };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* scheduled — no body */ }

    const { event: automationEvent, data: automationData } = body;

    // --- ENTITY AUTOMATION PATH: single deadline create/update ---
    if (automationEvent?.entity_name === 'Deadline') {
      const deadlineId = automationEvent.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ skipped: 'no deadline id' });

      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const deadline = deadlines[0];
      if (!deadline) return Response.json({ skipped: 'deadline not found' });

      const cases = await base44.asServiceRole.entities.Case.filter({ id: deadline.case_id });
      const caseItem = cases[0];
      if (!caseItem) return Response.json({ skipped: 'case not found' });

      let conn;
      try {
        conn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, caseItem.created_by_id);
      } catch (_) {
        return Response.json({ skipped: 'user has no Google connection' });
      }
      if (!conn?.accessToken) return Response.json({ skipped: 'no access token' });

      const result = await syncUserDeadlines(conn.accessToken, [deadline], [caseItem]);
      return Response.json({ success: true, ...result });
    }

    // --- SCHEDULED / MANUAL PATH ---
    const user = await base44.auth.me().catch(() => null);
    
    if (user) {
      // Frontend call — sync current user's deadlines
      const conn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, user.id).catch(() => null);
      if (!conn?.accessToken) return Response.json({ error: 'Google Tasks not connected' }, { status: 400 });

      const cases = await base44.entities.Case.filter({ created_by_id: user.id });
      const caseIds = cases.map(c => c.id);
      const deadlines = caseIds.length > 0
        ? await base44.entities.Deadline.filter({ case_id: { $in: caseIds }, status: { $in: ['pending', 'extended'] } })
        : [];

      const result = await syncUserDeadlines(conn.accessToken, deadlines, cases);
      return Response.json({ success: true, message: 'Sync completed', ...result });
    } else {
      // Scheduled run — sync all users
      const allCases = await base44.asServiceRole.entities.Case.list();
      const allDeadlines = await base44.asServiceRole.entities.Deadline.filter({ status: { $in: ['pending', 'extended'] } });

      // Group by user
      const userCases = {};
      allCases.forEach(c => {
        if (!userCases[c.created_by_id]) userCases[c.created_by_id] = [];
        userCases[c.created_by_id].push(c);
      });

      let totalCreated = 0;
      let totalRemoved = 0;
      for (const [userId, cases] of Object.entries(userCases)) {
        const conn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, userId).catch(() => null);
        if (!conn?.accessToken) continue;
        const userDeadlines = allDeadlines.filter(d => cases.some(c => c.id === d.case_id));
        const result = await syncUserDeadlines(conn.accessToken, userDeadlines, cases);
        totalCreated += result.tasksCreated;
        totalRemoved += result.tasksRemoved;
      }
      return Response.json({ success: true, tasksCreated: totalCreated, tasksRemoved: totalRemoved });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});