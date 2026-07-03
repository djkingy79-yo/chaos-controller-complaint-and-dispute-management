import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function getToken(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
  return accessToken;
}

function buildEventPayload(deadline, caseInfo) {
  const statusLabel = caseInfo.status ? ` [${caseInfo.status.replace(/_/g, ' ').toUpperCase()}]` : '';
  const escBody = caseInfo.escalation_body || (caseInfo.complaint_pathway?.regulator) || '';
  return {
    summary: `⚖️ ${deadline.title} — ${caseInfo.title}${statusLabel}`,
    description: `Case: ${caseInfo.title}\nOrganisation: ${caseInfo.organisation_name || 'N/A'}\nEscalation Body: ${escBody || 'N/A'}\nStatus: ${caseInfo.status || 'N/A'}\nDeadline Type: ${deadline.deadline_type || 'N/A'}\nResponsibility: ${deadline.responsibility || 'user'}\n\nManage at: https://chaoscontroller.com.au/case/${caseInfo.id}`,
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
  const timeMin = new Date(Date.now() - 365 * 86400000).toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&timeMin=${timeMin}&privateExtendedProperty=deadlineId%3D${deadlineId}&privateExtendedProperty=source%3DChaosController`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0] || null;
}

async function createCalendarEvent(accessToken, deadline, caseInfo) {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEventPayload(deadline, caseInfo))
  });
  return res.ok;
}

async function updateCalendarEvent(accessToken, googleEventId, deadline, caseInfo) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEventPayload(deadline, caseInfo))
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { action = 'sync', data: automationData, event: automationEvent } = payload;

    // --- AUTOMATION PATH: Deadline create/update ---
    if (automationEvent?.entity_name === 'Deadline') {
      const deadlineId = automationEvent?.entity_id || automationData?.id;
      if (!deadlineId) return Response.json({ error: 'No deadline ID' }, { status: 400 });

      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ id: deadlineId });
      const deadline = deadlines[0];
      if (!deadline?.deadline_date) return Response.json({ skipped: 'No deadline date' });

      const cases = await base44.asServiceRole.entities.Case.filter({ id: deadline.case_id });
      const caseInfo = cases[0];
      if (!caseInfo) return Response.json({ skipped: 'Case not found' });

      const accessToken = await getToken(base44);
      const existing = await findExistingEvent(accessToken, deadline.id);
      const ok = existing
        ? await updateCalendarEvent(accessToken, existing.id, deadline, caseInfo)
        : await createCalendarEvent(accessToken, deadline, caseInfo);
      return Response.json({ success: ok, deadlineId, action: existing ? 'updated' : 'created' });
    }

    // --- AUTOMATION PATH: Case status update ---
    if (automationEvent?.entity_name === 'Case') {
      const caseId = automationEvent?.entity_id || automationData?.id;
      if (!caseId) return Response.json({ skipped: 'No case ID' });

      const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
      const caseInfo = cases[0];
      if (!caseInfo) return Response.json({ skipped: 'Case not found' });

      const accessToken = await getToken(base44);
      const deadlines = await base44.asServiceRole.entities.Deadline.filter({ case_id: caseId });
      let updatedCount = 0;
      for (const deadline of deadlines) {
        if (!deadline.deadline_date) continue;
        const existing = await findExistingEvent(accessToken, deadline.id);
        if (existing && await updateCalendarEvent(accessToken, existing.id, deadline, caseInfo)) updatedCount++;
      }
      return Response.json({ success: true, caseId, updatedCount });
    }

    // --- FRONTEND PATH ---
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Check connection status — test by fetching calendar list
    if (action === 'check') {
      try {
        const accessToken = await getToken(base44);
        const res = await fetch(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return Response.json({ connected: res.ok });
      } catch {
        return Response.json({ connected: false });
      }
    }

    const accessToken = await getToken(base44);

    if (action === 'sync') {
      const { caseId: filterCaseId } = payload;

      let casesToSync = [];
      if (filterCaseId) {
        // Single case sync (from case dashboard)
        const cases = await base44.entities.Case.filter({ id: filterCaseId, created_by_id: user.id });
        casesToSync = cases.slice(0, 1);
      } else {
        // Full sync (from Calendar Sync page)
        const allCases = await base44.entities.Case.filter({ created_by_id: user.id });
        casesToSync = allCases.filter(c => !['resolved', 'closed'].includes(c.status));
      }

      const activeCaseIds = casesToSync.map(c => c.id);
      const pendingDeadlines = activeCaseIds.length > 0
        ? (await base44.entities.Deadline.filter({ case_id: { $in: activeCaseIds } })).filter(d => d.deadline_date && d.status !== 'completed')
        : [];

      const timeMin = new Date(Date.now() - 365 * 86400000).toISOString();
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&timeMin=${timeMin}&q=Chaos+Controller`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = calRes.ok ? await calRes.json() : { items: [] };
      const existingByDeadlineId = {};
      for (const e of calData.items || []) {
        const did = e.extendedProperties?.private?.deadlineId;
        if (did) existingByDeadlineId[did] = e;
      }

      let syncedCount = 0;
      let updatedCount = 0;
      for (const deadline of pendingDeadlines) {
        const caseInfo = casesToSync.find(c => c.id === deadline.case_id);
        if (!caseInfo) continue;
        if (existingByDeadlineId[deadline.id]) {
          if (await updateCalendarEvent(accessToken, existingByDeadlineId[deadline.id].id, deadline, caseInfo)) updatedCount++;
        } else if (await createCalendarEvent(accessToken, deadline, caseInfo)) {
          syncedCount++;
        }
      }
      return Response.json({ success: true, events: calData.items || [], syncedCount, updatedCount, totalDeadlines: pendingDeadlines.length });
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