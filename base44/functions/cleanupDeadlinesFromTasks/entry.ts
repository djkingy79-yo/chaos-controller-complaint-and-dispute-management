import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GOOGLE_CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* entity automation — no explicit body needed */ }

    const { event: automationEvent, data: automationData } = body;

    // Entity automation path — deadline updated to completed/missed
    if (automationEvent?.entity_name === 'Deadline') {
      const deadline = automationData;
      if (!deadline || !['completed', 'missed'].includes(deadline.status)) {
        return Response.json({ skipped: 'deadline not completed or missed' });
      }

      const cases = await base44.asServiceRole.entities.Case.filter({ id: deadline.case_id });
      const caseItem = cases[0];
      if (!caseItem) return Response.json({ skipped: 'case not found' });

      const conn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, caseItem.created_by_id).catch(() => null);
      if (!conn?.accessToken) return Response.json({ skipped: 'user has no Google connection' });

      const accessToken = conn.accessToken;

      // Find the task list
      const taskListsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const taskLists = await taskListsRes.json();
      const chaosList = taskLists.items?.find(l => l.title === 'Chaos Controller Deadlines');
      if (!chaosList) return Response.json({ skipped: 'task list not found' });

      // Find the task by DeadlineID in notes
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

      return Response.json({ success: true, removed: 0, message: 'Task not found in Google Tasks' });
    }

    return Response.json({ skipped: 'not a deadline automation event' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});