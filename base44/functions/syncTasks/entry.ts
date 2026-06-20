import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GOOGLE_CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

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
      return Response.json({ error: 'Google Tasks not connected' }, { status: 400 });
    }
    if (!googleConn?.accessToken) return Response.json({ error: 'No Google access token' }, { status: 400 });
    const { accessToken } = googleConn;

    // Find or create the Chaos Controller task list
    let taskListId = await findOrCreateTaskList(accessToken, 'Chaos Controller Deadlines');

    // Get all active deadlines for this user's cases
    const userCases = await base44.entities.Case.filter({ created_by_id: user.id });
    const caseIds = userCases.map(c => c.id);
    const deadlines = caseIds.length > 0
      ? await base44.entities.Deadline.filter({ case_id: { $in: caseIds }, status: 'pending' }, '-deadline_date')
      : [];

    const syncedTasks = [];

    for (const deadline of deadlines) {
      const caseData = userCases.find(c => c.id === deadline.case_id);
      const taskTitle = `[${caseData?.title || 'Case'}] ${deadline.title}`;
      
      const existingTask = await findTaskByTitle(accessToken, taskListId, taskTitle);
      
      if (existingTask) {
        await updateTask(accessToken, taskListId, existingTask.id, {
          title: taskTitle,
          due: deadline.deadline_date,
          notes: deadline.notes || `Deadline for case: ${caseData?.title}`,
        });
        syncedTasks.push({ deadline_id: deadline.id, task_id: existingTask.id, action: 'updated' });
      } else {
        const newTask = await createTask(accessToken, taskListId, {
          title: taskTitle,
          due: deadline.deadline_date,
          notes: deadline.notes || `Deadline for case: ${caseData?.title}`,
        });
        syncedTasks.push({ deadline_id: deadline.id, task_id: newTask.id, action: 'created' });
      }
    }

    return Response.json({ 
      success: true, 
      synced: syncedTasks.length,
      details: syncedTasks 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findOrCreateTaskList(accessToken, listName) {
  const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  
  const existingList = data.items?.find(list => list.title === listName);
  if (existingList) return existingList.id;

  const createResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: listName })
  });
  const newList = await createResponse.json();
  return newList.id;
}

async function findTaskByTitle(accessToken, taskListId, title) {
  const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  return data.items?.find(task => task.title === title);
}

async function createTask(accessToken, taskListId, taskData) {
  const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: taskData.title, due: taskData.due, notes: taskData.notes })
  });
  return await response.json();
}

async function updateTask(accessToken, taskListId, taskId, taskData) {
  const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: taskData.title, due: taskData.due, notes: taskData.notes })
  });
  return await response.json();
}