import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const { event: automationEvent, data: automationData } = body;
    if (automationEvent?.entity_name !== 'Deadline') return Response.json({ skipped: 'not a deadline event' });

    const deadline = automationData;
    if (!deadline || !['completed', 'missed'].includes(deadline.status)) {
      return Response.json({ skipped: 'deadline not completed or missed' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googletasks');

    const taskListsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const taskLists = await taskListsRes.json();
    const chaosList = taskLists.items?.find(l => l.title === 'Chaos Controller Deadlines');
    if (!chaosList) return Response.json({ skipped: 'task list not found' });

    const tasksRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${chaosList.id}/tasks`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const tasks = await tasksRes.json();
    const task = tasks.items?.find(t => t.notes?.includes(`DeadlineID:${deadline.id}`));

    if (task) {
      await fetch(`https://www.googleapis.com/tasks/v1/lists/${chaosList.id}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return Response.json({ success: true, removed: 1, deadlineId: deadline.id });
    }

    return Response.json({ success: true, removed: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});