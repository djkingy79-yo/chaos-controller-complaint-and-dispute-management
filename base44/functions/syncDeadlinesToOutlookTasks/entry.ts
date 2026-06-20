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

async function getOrCreateTaskListId(accessToken, listName) {
  const lists = await graphRequest(accessToken, '/me/todo/lists');
  const existing = (lists?.value || []).find(l => l.displayName === listName);
  if (existing) return existing.id;
  const created = await graphRequest(accessToken, '/me/todo/lists', {
    method: 'POST',
    body: JSON.stringify({ displayName: listName })
  });
  return created.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = await req.json(); } catch { /* scheduled call — no body */ }

    const { event: automationEvent, data: automationData } = body;

    // Get Outlook access token (shared connector)
    const conn = await base44.asServiceRole.connectors.getConnection('outlook');
    const { accessToken } = conn;
    if (!accessToken) return Response.json({ skipped: 'Outlook not connected' });

    const taskListId = await getOrCreateTaskListId(accessToken, 'Chaos Controller Deadlines');

    // --- ENTITY AUTOMATION PATH: single deadline create/update ---
    const isDeadlineAutomation = !!automationEvent && automationEvent.entity_name === 'Deadline';
    if (isDeadlineAutomation) {
      const deadlineId = automationEvent.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ skipped: 'no deadline id' });
      
      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const dl = deadlines[0];
      if (!dl?.deadline_date || dl.status === 'completed') return Response.json({ skipped: 'no date or completed' });
      
      const cases = await base44.asServiceRole.entities.Case.filter({ id: dl.case_id });
      const caseItem = cases[0];
      if (!caseItem) return Response.json({ skipped: 'case not found' });

      // Check if task already exists
      const taskSubject = `[Chaos Controller] ${dl.title}`;
      const existingTasks = await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks?$filter=status ne 'completed'`);
      const match = (existingTasks?.value || []).find(t => t.title === taskSubject);

      const taskData = {
        title: taskSubject,
        body: { content: `Case: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nType: ${dl.deadline_type || 'Deadline'}\n\nView: https://chaoscontroller.com.au/case/${caseItem.id}`, contentType: 'text' },
        dueDateTime: { dateTime: dl.deadline_date + 'T23:59:59', timeZone: 'Australia/Sydney' },
        importance: dl.deadline_type === 'tribunal_date' ? 'high' : 'normal',
        status: 'notStarted'
      };

      if (match) {
        await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks/${match.id}`, {
          method: 'PATCH',
          body: JSON.stringify(taskData)
        });
        return Response.json({ success: true, action: 'updated' });
      }

      await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks`, { method: 'POST', body: JSON.stringify(taskData) });
      return Response.json({ success: true, action: 'created' });
    }

    // --- BATCH SYNC: all active deadlines ---
    const cases = await base44.asServiceRole.entities.Case.list();
    const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));
    
    const deadlines = await base44.asServiceRole.entities.Deadline.filter({ status: { $in: ['pending', 'extended'] } });
    
    // Get existing tasks
    const existingTasksRes = await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks?$filter=status ne 'completed'`);
    const existingTasks = existingTasksRes?.value || [];
    const existingTaskMap = new Map();
    existingTasks.forEach(t => {
      if (t.title?.includes('[Chaos Controller]')) {
        existingTaskMap.set(t.title, t);
      }
    });

    let created = 0;
    let updated = 0;

    for (const dl of deadlines) {
      const caseItem = caseMap[dl.case_id];
      if (!caseItem || !dl.deadline_date) continue;

      const taskTitle = `[Chaos Controller] ${dl.title}`;
      const existingTask = existingTaskMap.get(taskTitle);

      const taskData = {
        title: taskTitle,
        body: { content: `Case: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nType: ${dl.deadline_type || 'Deadline'}\n\nView: https://chaoscontroller.com.au/case/${caseItem.id}`, contentType: 'text' },
        dueDateTime: { dateTime: dl.deadline_date + 'T23:59:59', timeZone: 'Australia/Sydney' },
        importance: dl.deadline_type === 'tribunal_date' ? 'high' : 'normal',
        status: 'notStarted'
      };

      if (existingTask) {
        await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(taskData)
        });
        updated++;
        existingTaskMap.delete(taskTitle);
      } else {
        await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskData)
        });
        created++;
      }
    }

    // Remove tasks for completed deadlines
    for (const [, task] of existingTaskMap) {
      try {
        await graphRequest(accessToken, `/me/todo/lists/${taskListId}/tasks/${task.id}`, { method: 'DELETE' });
      } catch (_) {}
    }

    return Response.json({ success: true, created, updated, removed: existingTaskMap.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});