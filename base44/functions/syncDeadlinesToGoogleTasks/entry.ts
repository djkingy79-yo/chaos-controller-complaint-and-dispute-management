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

    // Get all active deadlines for this user's cases
    const cases = await base44.entities.Case.filter({ created_by_id: user.id });
    const caseIds = cases.map(c => c.id);
    
    if (caseIds.length === 0) {
      return Response.json({ message: 'No active cases found', tasksCreated: 0, tasksRemoved: 0 });
    }

    const deadlines = await base44.entities.Deadline.filter({
      case_id: { $in: caseIds },
      status: { $in: ['pending', 'extended'] }
    });

    // Find or create the Chaos Controller task list
    let taskListId = null;
    const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const taskLists = await taskListsResponse.json();
    
    const chaosList = taskLists.items?.find(list => list.title === 'Chaos Controller Deadlines');
    if (chaosList) {
      taskListId = chaosList.id;
    } else {
      // Create new task list
      const createListResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Chaos Controller Deadlines' })
      });
      const newList = await createListResponse.json();
      taskListId = newList.id;
    }

    // Get existing tasks in the list
    const existingTasksResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const existingTasks = await existingTasksResponse.json();
    const existingTaskMap = new Map();
    existingTasks.items?.forEach(task => {
      if (task.notes) {
        const caseIdMatch = task.notes.match(/CaseID:([a-f0-9]+)/);
        if (caseIdMatch) {
          existingTaskMap.set(caseIdMatch[1], task);
        }
      }
    });

    let tasksCreated = 0;
    let tasksRemoved = 0;

    // Create or update tasks for active deadlines
    for (const deadline of deadlines) {
      const caseObj = cases.find(c => c.id === deadline.case_id);
      if (!caseObj) continue;

      const taskTitle = `[${deadline.deadline_type?.toUpperCase() || 'DEADLINE'}] ${deadline.title}`;
      const taskNotes = `Case: ${caseObj.title}\nCaseID:${deadline.case_id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}`;

      const existingTask = existingTaskMap.get(deadline.case_id);
      
      if (existingTask) {
        // Update existing task if needed
        if (existingTask.title !== taskTitle || !existingTask.notes?.includes(deadline.deadline_date)) {
          await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: taskTitle,
              notes: taskNotes,
              due: deadline.deadline_date + 'T23:59:59.000Z',
              status: 'needsAction'
            })
          });
        }
        existingTaskMap.delete(deadline.case_id); // Mark as processed
      } else {
        // Create new task
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            due: deadline.deadline_date + 'T23:59:59.000Z',
            status: 'needsAction'
          })
        });
        tasksCreated++;
      }
    }

    // Remove tasks for completed/missed deadlines or deleted cases
    for (const [caseId, task] of existingTaskMap) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      tasksRemoved++;
    }

    return Response.json({
      message: 'Sync completed successfully',
      tasksCreated,
      tasksRemoved,
      taskListId
    });
  } catch (error) {
    console.error('Google Tasks sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});