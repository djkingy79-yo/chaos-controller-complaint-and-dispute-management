import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function createCalendarEvent(accessToken, deadline, caseInfo) {
  const event = buildEventPayload(deadline, caseInfo);
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return res.ok;
}

async function updateCalendarEvent(accessToken, googleEventId, deadline, caseInfo) {
  const event = buildEventPayload(deadline, caseInfo);
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return res.ok;
}

function buildEventPayload(deadline, caseInfo) {
  const statusLabel = caseInfo.status ? ` [${caseInfo.status.replace(/_/g, ' ').toUpperCase()}]` : '';
  return {
    summary: `⚖️ ${deadline.title} — ${caseInfo.title}${statusLabel}`,
    description: `Case: ${caseInfo.title}\nOrganisation: ${caseInfo.organisation_name || 'N/A'}\nStatus: ${caseInfo.status || 'N/A'}\nDeadline Type: ${deadline.deadline_type || 'N/A'}\nResponsibility: ${deadline.responsibility || 'user'}\n\nManage at: https://chaoscontroller.com.au/case/${caseInfo.id}`,
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
}

async function findExistingEvent(accessToken, deadlineId) {
  const timeMin = new Date(Date.now() - 365 * 86400000).toISOString(); // look back 1 year
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&timeMin=${timeMin}&privateExtendedProperty=deadlineId%3D${deadlineId}&privateExtendedProperty=source%3DChaosController`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { action = 'sync', data: automationData, event: automationEvent } = payload;

    // --- AUTOMATION PATH: Deadline create/update ---
    const isDeadlineAutomation = !!automationEvent && automationEvent.entity_name === 'Deadline';
    if (isDeadlineAutomation) {
      const deadlineId = automationEvent?.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ error: 'No deadline ID' }, { status: 400 });

      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const deadline = deadlines[0];
      if (!deadline || !deadline.deadline_date) return Response.json({ skipped: 'No deadline date' });

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

      const { accessToken } = connToken;

      // Check if event already exists — update it, otherwise create
      const existing = await findExistingEvent(accessToken, deadline.id);
      let ok;
      if (existing) {
        ok = await updateCalendarEvent(accessToken, existing.id, deadline, caseInfo);
      } else {
        ok = await createCalendarEvent(accessToken, deadline, caseInfo);
      }
      return Response.json({ success: ok, deadlineId, caseId: caseInfo.id, action: existing ? 'updated' : 'created' });
    }

    // --- AUTOMATION PATH: Case status/deadline field update ---
    const isCaseAutomation = !!automationEvent && automationEvent.entity_name === 'Case';
    if (isCaseAutomation) {
      const caseId = automationEvent?.entity_id || automationData?.id;
      if (!caseId) return Response.json({ skipped: 'No case ID' });

      const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
      const caseInfo = cases[0];
      if (!caseInfo) return Response.json({ skipped: 'Case not found' });

      let connToken;
      try {
        connToken = await base44.asServiceRole.connectors.getAppUserConnection(CONNECTOR_ID, caseInfo.created_by_id);
      } catch (_) {
        return Response.json({ skipped: 'User calendar not connected' });
      }
      if (!connToken?.accessToken) return Response.json({ skipped: 'No access token' });

      const { accessToken } = connToken;

      // Update all calendar events for this case's deadlines
      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ case_id: caseId });
      let updatedCount = 0;
      for (const deadline of deadlines) {
        if (!deadline.deadline_date) continue;
        const existing = await findExistingEvent(accessToken, deadline.id);
        if (existing) {
          const ok = await updateCalendarEvent(accessToken, existing.id, deadline, caseInfo);
          if (ok) updatedCount++;
        }
      }
      return Response.json({ success: true, caseId, updatedCount });
    }

    // --- FRONTEND PATH: requires user auth ---
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let connToken;
    try {
      connToken = await base44.asServiceRole.connectors.getAppUserConnection(CONNECTOR_ID, user.id);
    } catch (_) {
      return Response.json({ error: 'Calendar not connected' }, { status: 403 });
    }
    if (!connToken?.accessToken) return Response.json({ error: 'Calendar not connected' }, { status: 403 });

    const { accessToken } = connToken;

    if (action === 'sync') {
      const allCases = await base44.entities.Case.filter({ created_by_id: user.id });
      const activeCases = allCases.filter(c => !['resolved', 'closed'].includes(c.status));
      const activeCaseIds = activeCases.map(c => c.id);

      const pendingDeadlines = activeCaseIds.length > 0
        ? (await base44.entities.Deadline.filter({ case_id: { $in: activeCaseIds }, status: 'pending' })).filter(d => d.deadline_date)
        : [];

      const timeMin = new Date().toISOString();
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&timeMin=${timeMin}&q=Chaos+Controller`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = calRes.ok ? await calRes.json() : { items: [] };
      const existingEvents = calData.items || [];
      const existingByDeadlineId = {};
      for (const e of existingEvents) {
        const did = e.extendedProperties?.private?.deadlineId;
        if (did) existingByDeadlineId[did] = e;
      }

      let syncedCount = 0;
      for (const deadline of pendingDeadlines) {
        const caseInfo = activeCases.find(c => c.id === deadline.case_id);
        if (!caseInfo) continue;
        if (existingByDeadlineId[deadline.id]) {
          await updateCalendarEvent(accessToken, existingByDeadlineId[deadline.id].id, deadline, caseInfo);
        } else {
          const ok = await createCalendarEvent(accessToken, deadline, caseInfo);
          if (ok) syncedCount++;
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