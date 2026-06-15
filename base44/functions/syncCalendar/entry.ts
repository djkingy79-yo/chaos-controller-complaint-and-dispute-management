import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function createCalendarEvent(accessToken, deadline, caseInfo) {
  const event = {
    summary: `⚖️ Chaos Controller: ${deadline.title}`,
    description: `Case: ${caseInfo.title}\nOrganisation: ${caseInfo.organisation_name || 'N/A'}\nDeadline Type: ${deadline.deadline_type || 'N/A'}\nResponsibility: ${deadline.responsibility || 'user'}\n\nManage this case: https://chaoscontroller.base44.app/case/${caseInfo.id}`,
    start: { date: deadline.deadline_date, timeZone: 'Australia/Sydney' },
    end: { date: deadline.deadline_date, timeZone: 'Australia/Sydney' },
    extendedProperties: {
      private: { caseId: caseInfo.id, deadlineId: deadline.id, source: 'ChaosController' }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 2880 },
        { method: 'popup', minutes: 1440 },
        { method: 'popup', minutes: 60 }
      ]
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { action = 'sync', data: automationData, event: automationEvent } = payload;

    // --- AUTOMATION PATH: entity trigger for Deadline create/update ---
    const isAutomation = !!automationEvent;
    if (isAutomation) {
      const deadlineId = automationEvent?.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ error: 'No deadline ID in payload' }, { status: 400 });

      // Find the deadline
      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const deadline = deadlines[0];
      if (!deadline || !deadline.deadline_date) return Response.json({ skipped: 'No deadline date' });

      // Find the case owner and get their calendar token
      const cases = await base44.asServiceRole.entities.Case.filter({ id: deadline.case_id });
      const caseInfo = cases[0];
      if (!caseInfo) return Response.json({ skipped: 'Case not found' });

      let connToken;
      try {
        connToken = await base44.asServiceRole.connectors.getAppUserConnection(CONNECTOR_ID, caseInfo.created_by_id);
      } catch (_) {
        return Response.json({ skipped: 'User calendar not connected' });
      }
      if (!connToken?.accessToken) return Response.json({ skipped: 'No access token' });

      const ok = await createCalendarEvent(connToken.accessToken, deadline, caseInfo);
      return Response.json({ success: ok, deadlineId, caseId: caseInfo.id });
    }

    // --- FRONTEND PATH: requires user auth ---
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let connToken;
    try {
      connToken = await base44.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    } catch (_) {
      return Response.json({ error: 'Calendar not connected' }, { status: 403 });
    }
    if (!connToken?.accessToken) return Response.json({ error: 'Calendar not connected' }, { status: 403 });

    const { accessToken } = connToken;

    if (action === 'sync') {
      // Get all pending deadlines for this user's active cases
      const allCases = await base44.entities.Case.filter({ created_by_id: user.id });
      const activeCases = allCases.filter(c => !['resolved', 'closed'].includes(c.status));
      const activeCaseIds = new Set(activeCases.map(c => c.id));

      const allDeadlines = await base44.entities.Deadline.list();
      const pendingDeadlines = allDeadlines.filter(d =>
        activeCaseIds.has(d.case_id) && d.status === 'pending' && d.deadline_date
      );

      // Fetch existing Chaos Controller events from calendar
      const timeMin = new Date().toISOString();
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&timeMin=${timeMin}&q=Chaos+Controller`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = calRes.ok ? await calRes.json() : { items: [] };
      const existingEvents = calData.items || [];
      const existingDeadlineIds = new Set(
        existingEvents.map(e => e.extendedProperties?.private?.deadlineId).filter(Boolean)
      );

      // Create events for deadlines not yet in calendar
      let syncedCount = 0;
      for (const deadline of pendingDeadlines) {
        if (!existingDeadlineIds.has(deadline.id)) {
          const caseInfo = activeCases.find(c => c.id === deadline.case_id);
          if (caseInfo) {
            const ok = await createCalendarEvent(accessToken, deadline, caseInfo);
            if (ok) syncedCount++;
          }
        }
      }

      return Response.json({ success: true, events: existingEvents, syncedCount, totalDeadlines: pendingDeadlines.length });
    }

    if (action === 'delete') {
      const { eventId } = payload;
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok && res.status !== 404) return Response.json({ error: 'Failed to delete event' }, { status: res.status });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});