import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    // Get checklist item data
    const checklistItem = data || await base44.asServiceRole.entities.ChecklistItem.get(event.entity_id);
    if (!checklistItem) {
      return Response.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    // Get case details
    const caseItem = await base44.asServiceRole.entities.Case.get(checklistItem.case_id);
    if (!caseItem) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get user's Google connection
    const userId = checklistItem.created_by_id || caseItem.created_by_id;
    let googleConn;
    try {
      googleConn = await base44.asServiceRole.connectors.getAppUserConnection('6a2f842ded0843ad5cb9ecb7', userId);
    } catch (_) {
      return Response.json({ skipped: 'User has no Google connection' });
    }

    if (!googleConn?.accessToken) {
      return Response.json({ skipped: 'No Google access token' });
    }

    // Find or create Chaos Controller task list
    let taskListId = null;
    const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${googleConn.accessToken}` }
    });
    
    if (taskListsResponse.ok) {
      const taskLists = await taskListsResponse.json();
      const chaosList = taskLists.items?.find(list => list.title === 'Chaos Controller Actions');
      if (chaosList) {
        taskListId = chaosList.id;
      } else {
        const createListResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleConn.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: 'Chaos Controller Actions' })
        });
        const newList = await createListResponse.json();
        taskListId = newList.id;
      }
    }

    if (!taskListId) {
      return Response.json({ error: 'Failed to get task list' }, { status: 500 });
    }

    // Get existing tasks to find matching one
    const existingTasksResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      headers: { 'Authorization': `Bearer ${googleConn.accessToken}` }
    });
    
    const existingTasks = await existingTasksResponse.json();
    let existingTask = null;
    
    if (existingTasks.items) {
      existingTask = existingTasks.items.find(task => 
        task.notes?.includes(`ChecklistItemID:${checklistItem.id}`)
      );
    }

    // Prepare task data
    const statusLabel = checklistItem.status === 'complete' ? '✅' : 
                       checklistItem.status === 'missing' ? '❌' : '⚠️';
    const categoryLabel = checklistItem.category ? `[${checklistItem.category.toUpperCase()}]` : '[ACTION]';
    const taskTitle = `${statusLabel} ${categoryLabel} ${checklistItem.label}`;
    const taskNotes = `Case: ${caseItem.title}\nCaseID:${caseItem.case_id}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nChecklistItemID:${checklistItem.id}\nCategory: ${checklistItem.category || 'general'}\nStatus: ${checklistItem.status}\n${checklistItem.notes ? 'Notes: ' + checklistItem.notes : ''}`;

    if (existingTask) {
      // Update existing task
      if (checklistItem.status === 'complete') {
        // Mark as completed in Google Tasks
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}/complete`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${googleConn.accessToken}` }
        });
      } else {
        // Update task details
        await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${existingTask.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${googleConn.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            status: 'needsAction',
            due: checklistItem.due_date ? new Date(checklistItem.due_date).toISOString() : undefined
          })
        });
      }
      
      return Response.json({ 
        success: true, 
        action: 'updated',
        taskId: existingTask.id,
        title: taskTitle
      });
    } else {
      // Create new task (only if not complete)
      if (checklistItem.status !== 'complete') {
        const createResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleConn.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            status: 'needsAction',
            due: checklistItem.due_date ? new Date(checklistItem.due_date).toISOString() : undefined
          })
        });
        
        const newTask = await createResponse.json();
        
        return Response.json({ 
          success: true, 
          action: 'created',
          taskId: newTask.id,
          title: taskTitle
        });
      }
      
      return Response.json({ success: true, action: 'skipped_completed' });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});