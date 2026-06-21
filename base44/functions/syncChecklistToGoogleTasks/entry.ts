import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    const checklistItem = data || await base44.asServiceRole.entities.ChecklistItem.get(event.entity_id);
    if (!checklistItem) return Response.json({ error: 'Checklist item not found' }, { status: 404 });

    const caseItem = await base44.asServiceRole.entities.Case.get(checklistItem.case_id);
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googletasks');

    // Find or create task list
    const taskListsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const taskLists = await taskListsRes.json();
    let taskListId;
    const chaosList = taskLists.items?.find(l => l.title === 'Chaos Controller Actions');
    if (chaosList) {
      taskListId = chaosList.id;
    } else {
      const createRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Chaos Controller Actions' })
      });
      taskListId = (await createRes.json()).id;
    }

    // Find existing task by checklist item ID
    const existingRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const existingTasks = await existingRes.json();
    const existingTask = existingTasks.items?.find(t => t.notes?.includes(`ChecklistItemID:${checklistItem.id}`));

    const statusIcon = checklistItem.status === 'complete' ? '✅' : checklistItem.status === 'missing' ? '❌' : '⚠️';
    const categoryLabel = checklistItem.category ? `[${checklistItem.category.toUpperCase()}]` : '[ACTION]';
    const title = `${statusIcon} ${categoryLabel} ${checklistItem.label}`;
    const notes = `Case: ${caseItem.title}\nCaseID:${caseItem.id}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nChecklistItemID:${checklistItem.id}\nStatus: ${checklistItem.status}`;

    if (existingTask) {
      if (checklistItem.status === 'complete') {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existingTask, status: 'completed' })
        });
      } else {
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, notes, status: 'needsAction' })
        });
      }
      return Response.json({ success: true, action: 'updated', taskId: existingTask.id });
    }

    if (checklistItem.status !== 'complete') {
      const createRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes, status: 'needsAction' })
      });
      const newTask = await createRes.json();
      return Response.json({ success: true, action: 'created', taskId: newTask.id });
    }

    return Response.json({ success: true, action: 'skipped_complete' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});