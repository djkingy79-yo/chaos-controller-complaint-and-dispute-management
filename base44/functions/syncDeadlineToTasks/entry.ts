import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Tasks connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googletasks');

    // Find or create the Chaos Controller task list
    let taskListId = await findOrCreateTaskList(accessToken, 'Chaos Controller Deadlines');

    // Get all active deadlines for this user
    const deadlines = await base44.entities.Deadline.filter(
      { created_by_id: user.id, status: 'pending' },
      '-deadline_date'
    );

    const syncedTasks = [];

    for (const deadline of deadlines) {
      // Get the case title for context
      const caseData = await base44.entities.Case.get(deadline.case_id);
      const taskTitle = `[${caseData?.title || 'Case'}] ${deadline.title}`;
      
      // Check if task already exists by searching for matching task
      const existingTask = await findTaskByTitle(accessToken, taskListId, taskTitle);
      
      if (existingTask) {
        // Update existing task
        await updateTask(accessToken, existingTask.id, {
          title: taskTitle,
          due: deadline.deadline_date,
          notes: deadline.notes || `Deadline for case: ${caseData?.title}`,
        });
        syncedTasks.push({ deadline_id: deadline.id, task_id: existingTask.id, action: 'updated' });
      } else {
        // Create new task
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
    console.error('Google Tasks sync failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findOrCreateTaskList(accessToken, listName) {
  // Try to find existing list
  const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  
  const existingList = data.items?.find(list => list.title === listName);
  if (existingList) {
    return existingList.id;
  }

  // Create new list
  const createResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
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
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: taskData.title,
      due: taskData.due,
      notes: taskData.notes
    })
  });
  return await response.json();
}

async function updateTask(accessToken, taskId, taskData) {
  const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: taskData.title,
      due: taskData.due,
      notes: taskData.notes
    })
  });
  return await response.json();
}