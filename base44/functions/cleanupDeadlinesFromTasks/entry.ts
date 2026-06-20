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

    // Find the task list
    const taskListId = await findTaskList(accessToken, 'Chaos Controller Deadlines');
    if (!taskListId) {
      return Response.json({ success: true, message: 'No task list found' });
    }

    // Get all completed/missed deadlines
    const completedDeadlines = await base44.entities.Deadline.filter(
      { created_by_id: user.id, status: 'completed' }
    );
    const missedDeadlines = await base44.entities.Deadline.filter(
      { created_by_id: user.id, status: 'missed' }
    );

    const removedTasks = [];

    // Remove tasks for completed/missed deadlines
    for (const deadline of [...completedDeadlines, ...missedDeadlines]) {
      const caseData = await base44.entities.Case.get(deadline.case_id);
      const taskTitle = `[${caseData?.title || 'Case'}] ${deadline.title}`;
      
      const task = await findTaskByTitle(accessToken, taskListId, taskTitle);
      if (task) {
        await deleteTask(accessToken, taskListId, task.id);
        removedTasks.push({ deadline_id: deadline.id, task_id: task.id });
      }
    }

    return Response.json({ 
      success: true, 
      removed: removedTasks.length,
      details: removedTasks 
    });
  } catch (error) {
    console.error('Google Tasks cleanup failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findTaskList(accessToken, listName) {
  const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  const list = data.items?.find(list => list.title === listName);
  return list?.id;
}

async function findTaskByTitle(accessToken, taskListId, title) {
  const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  return data.items?.find(task => task.title === title);
}

async function deleteTask(accessToken, taskListId, taskId) {
  await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
}