import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function syncToOutlookTasks(accessToken, deadlines, cases) {
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));
  
  // Get all tasks from Outlook
  const existingTasksRes = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  let taskListId = null;
  if (existingTasksRes.ok) {
    const lists = await existingTasksRes.json();
    const chaosList = lists.value?.find(l => l.displayName === 'Chaos Controller Deadlines');
    if (chaosList) {
      taskListId = chaosList.id;
    } else {
      // Create new task list
      const createListRes = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ displayName: 'Chaos Controller Deadlines' })
      });
      const newList = await createListRes.json();
      taskListId = newList.id;
    }
  }

  if (!taskListId) return { created: 0, removed: 0 };

  // Get existing tasks
  const tasksRes = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const existingTasks = tasksRes.ok ? (await tasksRes.json()).value || [] : [];
  const existingTaskMap = new Map();
  existingTasks.forEach(task => {
    if (task.body?.content) {
      const caseIdMatch = task.body.content.match(/CaseID:([a-f0-9]+)/);
      if (caseIdMatch) {
        existingTaskMap.set(caseIdMatch[1], task);
      }
    }
  });

  let created = 0;
  let removed = 0;

  // Create/update tasks for active deadlines
  for (const deadline of deadlines) {
    const caseObj = caseMap[deadline.case_id];
    if (!caseObj) continue;

    const taskTitle = `[${deadline.deadline_type?.toUpperCase() || 'DEADLINE'}] ${deadline.title}`;
    const taskNotes = `Case: ${caseObj.title}\nCaseID:${deadline.case_id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}\nResponsibility: ${deadline.responsibility || 'user'}`;

    const existingTask = existingTaskMap.get(deadline.case_id);
    
    if (existingTask) {
      // Update existing task
      await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks/${existingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskTitle,
          body: { contentType: 'text', content: taskNotes },
          dueDateTime: { dateTime: deadline.deadline_date + 'T23:59:59', timeZone: 'Australia/Sydney' },
          isReminderOn: true,
          importance: deadline.deadline_type === 'tribunal_date' ? 'high' : 'normal'
        })
      });
      existingTaskMap.delete(deadline.case_id);
    } else {
      // Create new task
      await fetch('https://graph.microsoft.com/v1.0/me/todo/lists/' + taskListId + '/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskTitle,
          body: { contentType: 'text', content: taskNotes },
          dueDateTime: { dateTime: deadline.deadline_date + 'T23:59:59', timeZone: 'Australia/Sydney' },
          isReminderOn: true,
          importance: deadline.deadline_type === 'tribunal_date' ? 'high' : 'normal'
        })
      });
      created++;
    }
  }

  // Remove tasks for completed/missed deadlines
  for (const [caseId, task] of existingTaskMap) {
    await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks/${task.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    removed++;
  }

  return { created, removed };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active deadlines for all users
    const deadlines = await base44.asServiceRole.entities.Deadline.filter({
      status: { $in: ['pending', 'extended'] }
    });

    if (deadlines.length === 0) {
      return Response.json({ message: 'No active deadlines', tasksCreated: 0, tasksRemoved: 0 });
    }

    const cases = await base44.asServiceRole.entities.Case.list();
    const caseIds = [...new Set(deadlines.map(d => d.case_id))];
    const activeCases = cases.filter(c => caseIds.includes(c.id));
    const caseMap = Object.fromEntries(activeCases.map(c => [c.id, c]));

    // Get Outlook access token (shared connector)
    let outlookToken = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('outlook');
      outlookToken = conn?.accessToken || null;
    } catch (_) {}

    let outlookResult = { created: 0, removed: 0 };
    
    // Sync to Outlook Tasks
    if (outlookToken) {
      outlookResult = await syncToOutlookTasks(outlookToken, deadlines, activeCases);
    }

    // Sync to Google Tasks (per-user)
    const userCases = {};
    activeCases.forEach(c => {
      if (!userCases[c.created_by_id]) userCases[c.created_by_id] = [];
      userCases[c.created_by_id].push(c);
    });

    let googleTasksTotal = { created: 0, removed: 0 };

    for (const [userId, cases] of Object.entries(userCases)) {
      try {
        const googleConn = await base44.asServiceRole.connectors.getAppUserConnection('6a2f842ded0843ad5cb9ecb7', userId);
        if (!googleConn?.accessToken) continue;

        const userDeadlines = deadlines.filter(d => cases.some(c => c.id === d.case_id));
        
        // Find or create Chaos Controller task list
        let taskListId = null;
        const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
          headers: { 'Authorization': `Bearer ${googleConn.accessToken}` }
        });
        const taskLists = await taskListsResponse.json();
        
        const chaosList = taskLists.items?.find(list => list.title === 'Chaos Controller Deadlines');
        if (chaosList) {
          taskListId = chaosList.id;
        } else {
          const createListResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleConn.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Chaos Controller Deadlines' })
          });
          const newList = await createListResponse.json();
          taskListId = newList.id;
        }

        // Get existing tasks
        const existingTasksResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          headers: { 'Authorization': `Bearer ${googleConn.accessToken}` }
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

        let created = 0;
        let removed = 0;

        // Create or update tasks
        for (const deadline of userDeadlines) {
          const caseObj = caseMap[deadline.case_id];
          if (!caseObj) continue;

          const taskTitle = `[${deadline.deadline_type?.toUpperCase() || 'DEADLINE'}] ${deadline.title}`;
          const taskNotes = `Case: ${caseObj.title}\nCaseID:${deadline.case_id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}`;

          const existingTask = existingTaskMap.get(deadline.case_id);
          
          if (existingTask) {
            await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${googleConn.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: taskTitle,
                notes: taskNotes,
                due: deadline.deadline_date + 'T23:59:59.000Z',
                status: 'needsAction'
              })
            });
            existingTaskMap.delete(deadline.case_id);
          } else {
            await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${googleConn.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: taskTitle,
                notes: taskNotes,
                due: deadline.deadline_date + 'T23:59:59.000Z',
                status: 'needsAction'
              })
            });
            created++;
          }
        }

        // Remove old tasks
        for (const [caseId, task] of existingTaskMap) {
          await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${googleConn.accessToken}` }
          });
          removed++;
        }

        googleTasksTotal.created += created;
        googleTasksTotal.removed += removed;
      } catch (_) {
        // User doesn't have Google connected, skip
      }
    }

    return Response.json({
      success: true,
      outlook: outlookResult,
      google_tasks: googleTasksTotal,
      total_created: outlookResult.created + googleTasksTotal.created,
      total_removed: outlookResult.removed + googleTasksTotal.removed
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});