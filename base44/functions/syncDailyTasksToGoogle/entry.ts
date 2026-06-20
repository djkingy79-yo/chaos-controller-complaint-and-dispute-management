import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Tasks connection
    let googleConn;
    try {
      googleConn = await base44.asServiceRole.connectors.getAppUserConnection('6a2f842ded0843ad5cb9ecb7', user.id);
    } catch (_) {
      return Response.json({ error: 'User has no Google connection', skipped: true });
    }

    if (!googleConn?.accessToken) {
      return Response.json({ error: 'No Google access token', skipped: true });
    }

    const accessToken = googleConn.accessToken;

    // Get all active cases for this user
    const cases = await base44.entities.Case.filter({ created_by_id: user.id });
    const caseIds = cases.map(c => c.id);
    
    if (caseIds.length === 0) {
      return Response.json({ message: 'No active cases found', tasksCreated: 0 });
    }

    // Get pending deadlines and incomplete checklist items
    const [deadlines, checklists] = await Promise.all([
      base44.entities.Deadline.filter({
        case_id: { $in: caseIds },
        status: { $in: ['pending', 'extended'] }
      }),
      base44.entities.ChecklistItem.filter({
        case_id: { $in: caseIds },
        status: { $in: ['missing', 'needs_review'] }
      })
    ]);

    // Find or create the Chaos Controller task list
    let taskListId = null;
    const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const taskLists = await taskListsResponse.json();
    
    const chaosList = taskLists.items?.find(list => list.title === 'Chaos Controller - Daily Actions');
    if (chaosList) {
      taskListId = chaosList.id;
    } else {
      const createListResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Chaos Controller - Daily Actions' })
      });
      const newList = await createListResponse.json();
      taskListId = newList.id;
    }

    // Get existing tasks
    const existingTasksResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const existingTasks = await existingTasksResponse.json();
    const existingTaskMap = new Map();
    existingTasks.items?.forEach(task => {
      if (task.notes) {
        const idMatch = task.notes.match(/ItemID:([a-f0-9]+)/);
        if (idMatch) {
          existingTaskMap.set(idMatch[1], task);
        }
      }
    });

    let tasksCreated = 0;
    let tasksUpdated = 0;

    // Sync deadlines
    for (const deadline of deadlines) {
      const caseObj = cases.find(c => c.id === deadline.case_id);
      if (!caseObj) continue;

      const taskTitle = `📅 [${deadline.deadline_type?.toUpperCase() || 'DEADLINE'}] ${deadline.title}`;
      const taskNotes = `Case: ${caseObj.title}\nItemID:${deadline.id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}\nType: Deadline`;

      const existingTask = existingTaskMap.get(deadline.id);
      
      if (existingTask) {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            due: deadline.deadline_date + 'T09:00:00.000Z',
            status: 'needsAction'
          })
        });
        tasksUpdated++;
        existingTaskMap.delete(deadline.id);
      } else {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            due: deadline.deadline_date + 'T09:00:00.000Z',
            status: 'needsAction'
          })
        });
        tasksCreated++;
      }
    }

    // Sync checklist items
    for (const item of checklists) {
      const caseObj = cases.find(c => c.id === item.case_id);
      if (!caseObj) continue;

      const taskTitle = `✅ [${item.category?.toUpperCase() || 'ACTION'}] ${item.label}`;
      const taskNotes = `Case: ${caseObj.title}\nItemID:${item.id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nCategory: ${item.category}\nType: Checklist Item\n${item.notes ? 'Notes: ' + item.notes : ''}`;

      const existingTask = existingTaskMap.get(item.id);
      
      if (existingTask) {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            status: 'needsAction'
          })
        });
        tasksUpdated++;
        existingTaskMap.delete(item.id);
      } else {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            status: 'needsAction'
          })
        });
        tasksCreated++;
      }
    }

    // Remove old tasks (for completed/deleted items)
    let tasksRemoved = 0;
    for (const [itemId, task] of existingTaskMap) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      tasksRemoved++;
    }

    return Response.json({
      message: 'Daily sync completed successfully',
      tasksCreated,
      tasksUpdated,
      tasksRemoved,
      totalTasks: tasksCreated + tasksUpdated
    });
  } catch (error) {
    console.error('Daily tasks sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});