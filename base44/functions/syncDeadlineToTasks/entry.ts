import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GOOGLE_CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

// This function is kept for backwards compatibility — it delegates to syncDeadlinesToGoogleTasks
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Tasks connection (app-user connector)
    let googleConn;
    try {
      googleConn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, user.id);
    } catch (_) {
      return Response.json({ error: 'Google Tasks not connected. Please connect your Google account.' }, { status: 400 });
    }
    if (!googleConn?.accessToken) return Response.json({ error: 'No Google access token' }, { status: 400 });
    const { accessToken } = googleConn;

    // Find or create the Chaos Controller Deadlines task list
    const taskListsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const taskLists = await taskListsRes.json();
    let taskListId;
    const existing = taskLists.items?.find(l => l.title === 'Chaos Controller Deadlines');
    if (existing) {
      taskListId = existing.id;
    } else {
      const created = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Chaos Controller Deadlines' })
      });
      const newList = await created.json();
      taskListId = newList.id;
    }

    // Get all cases for this user
    const userCases = await base44.entities.Case.filter({ created_by_id: user.id });
    const caseIds = userCases.map(c => c.id);
    const deadlines = caseIds.length > 0
      ? await base44.entities.Deadline.filter({ case_id: { $in: caseIds }, status: 'pending' }, '-deadline_date')
      : [];

    const syncedTasks = [];
    for (const deadline of deadlines) {
      const caseData = userCases.find(c => c.id === deadline.case_id);
      const taskTitle = `[${caseData?.title || 'Case'}] ${deadline.title}`;
      const notes = deadline.notes || `Deadline for case: ${caseData?.title}`;

      // Find existing task by title match
      const existingTasksRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const existingTasksData = await existingTasksRes.json();
      const existingTask = existingTasksData.items?.find(t => t.title === taskTitle);

      if (existingTask) {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: taskTitle, due: deadline.deadline_date, notes })
        });
        syncedTasks.push({ deadline_id: deadline.id, task_id: existingTask.id, action: 'updated' });
      } else {
        const newTaskRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: taskTitle, due: deadline.deadline_date, notes })
        });
        const newTask = await newTaskRes.json();
        syncedTasks.push({ deadline_id: deadline.id, task_id: newTask.id, action: 'created' });
      }
    }

    return Response.json({ success: true, synced: syncedTasks.length, details: syncedTasks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});