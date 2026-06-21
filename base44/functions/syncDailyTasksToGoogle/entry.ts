import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function syncUserTasks(accessToken, cases, deadlines, checklists) {
  // Find or create the Chaos Controller task list
  const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const taskLists = await taskListsResponse.json();
  let taskListId;
  const chaosList = taskLists.items?.find(l => l.title === 'Chaos Controller - Daily Actions');
  if (chaosList) {
    taskListId = chaosList.id;
  } else {
    const createRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Chaos Controller - Daily Actions' })
    });
    const newList = await createRes.json();
    taskListId = newList.id;
  }

  // Get existing tasks keyed by ItemID in notes
  const existingRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const existingData = await existingRes.json();
  const existingTaskMap = new Map();
  existingData.items?.forEach(task => {
    const match = task.notes?.match(/ItemID:([a-f0-9-]+)/);
    if (match) existingTaskMap.set(match[1], task);
  });

  let tasksCreated = 0;
  let tasksUpdated = 0;

  // Sync deadlines
  for (const deadline of deadlines) {
    const caseObj = cases.find(c => c.id === deadline.case_id);
    if (!caseObj) continue;

    const taskTitle = `📅 [${(deadline.deadline_type || 'DEADLINE').toUpperCase()}] ${deadline.title}`;
    const taskNotes = `Case: ${caseObj.title}\nItemID:${deadline.id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nDue: ${deadline.deadline_date}\nType: Deadline`;
    const existing = existingTaskMap.get(deadline.id);

    if (existing) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existing.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, notes: taskNotes, due: deadline.deadline_date + 'T09:00:00.000Z', status: 'needsAction' })
      });
      tasksUpdated++;
      existingTaskMap.delete(deadline.id);
    } else {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, notes: taskNotes, due: deadline.deadline_date + 'T09:00:00.000Z', status: 'needsAction' })
      });
      tasksCreated++;
    }
  }

  // Sync incomplete checklist items
  for (const item of checklists) {
    const caseObj = cases.find(c => c.id === item.case_id);
    if (!caseObj) continue;

    const taskTitle = `✅ [${(item.category || 'ACTION').toUpperCase()}] ${item.label}`;
    const taskNotes = `Case: ${caseObj.title}\nItemID:${item.id}\nOrganisation: ${caseObj.organisation_name || 'N/A'}\nCategory: ${item.category}\nType: Checklist Item\n${item.notes ? 'Notes: ' + item.notes : ''}`;
    const existing = existingTaskMap.get(item.id);

    if (existing) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existing.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, notes: taskNotes, status: 'needsAction' })
      });
      tasksUpdated++;
      existingTaskMap.delete(item.id);
    } else {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, notes: taskNotes, status: 'needsAction' })
      });
      tasksCreated++;
    }
  }

  // Remove tasks for completed/deleted items no longer in active set
  let tasksRemoved = 0;
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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googletasks');

    const allCases = await base44.asServiceRole.entities.Case.list();
    const allDeadlines = await base44.asServiceRole.entities.Deadline.filter({ status: { $in: ['pending', 'extended'] } });
    const allChecklists = await base44.asServiceRole.entities.ChecklistItem.filter({ status: { $in: ['missing', 'needs_review'] } });

    const result = await syncUserTasks(accessToken, allCases, allDeadlines, allChecklists);
    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});