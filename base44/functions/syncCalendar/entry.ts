import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectorId = '6a2f842ded0843ad5cb9ecb7';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);

    const action = req.query?.get('action') || 'sync';

    if (action === 'sync') {
      // Get all pending deadlines for this user
      const cases = await base44.entities.Case.list();
      const userCases = cases.filter(c => c.created_by_id === user.id);
      const deadlines = await base44.entities.Deadline.list();
      const userDeadlines = deadlines.filter(d => userCases.some(c => c.id === d.case_id) && d.status === 'pending');

      // Get existing sync state
      const existingSync = await base44.asServiceRole.entities.SyncState.filter({ user_id: user.id });
      const syncRecord = existingSync.length > 0 ? existingSync[0] : null;

      // Fetch calendar events with sync token
      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250';
      if (syncRecord?.sync_token) {
        url += `&syncToken=${syncRecord.sync_token}`;
      } else {
        // First sync - get events from last 30 days and future
        url += '&timeMin=' + new Date(Date.now() - 30*24*60*60*1000).toISOString();
      }

      let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      
      if (res.status === 410) {
        // Sync token expired - do fresh sync
        url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250'
          + '&timeMin=' + new Date(Date.now() - 30*24*60*60*1000).toISOString();
        res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      }

      if (!res.ok) {
        return Response.json({ error: 'Google API error', status: res.status });
      }

      let pageData = await res.json();
      let newSyncToken = null;
      const allEvents = [];

      // Drain all pages
      while (true) {
        allEvents.push(...(pageData.items || []));
        if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
        if (!pageData.nextPageToken) break;
        const nextRes = await fetch(
          url + `&pageToken=${pageData.nextPageToken}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!nextRes.ok) break;
        pageData = await nextRes.json();
      }

      // Filter for Chaos Controller events
      const chaosEvents = allEvents.filter(e => 
        e.extendedProperties?.private?.caseId || 
        (e.description && e.description.includes('Chaos Controller'))
      );

      // Create calendar events for deadlines that don't have events yet
      const existingCaseIds = new Set(chaosEvents.map(e => e.extendedProperties?.private?.caseId));
      const eventsToCreate = [];

      for (const deadline of userDeadlines) {
        const caseInfo = userCases.find(c => c.id === deadline.case_id);
        if (caseInfo && !existingCaseIds.has(deadline.id)) {
          eventsToCreate.push({
            caseId: deadline.id,
            caseTitle: caseInfo.title,
            deadlineTitle: deadline.title,
            deadlineDate: deadline.deadline_date,
            deadlineType: deadline.deadline_type
          });
        }
      }

      // Create missing events
      for (const eventData of eventsToCreate) {
        const event = {
          summary: `⚖️ Chaos Controller: ${eventData.deadlineTitle}`,
          description: `Case: ${eventData.caseTitle}\nDeadline Type: ${eventData.deadlineType}\nResponsibility: ${userDeadlines.find(d => d.id === eventData.caseId)?.responsibility || 'user'}\n\nThis deadline was created by Chaos Controller - Consumer Dispute Management`,
          start: {
            date: eventData.deadlineDate,
            timeZone: 'Australia/Sydney'
          },
          end: {
            date: eventData.deadlineDate,
            timeZone: 'Australia/Sydney'
          },
          extendedProperties: {
            private: {
              caseId: eventData.caseId,
              deadlineType: eventData.deadlineType
            }
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 2880 }, // 2 days before
              { method: 'popup', minutes: 1440 }, // 1 day before
              { method: 'popup', minutes: 60 }    // 1 hour before
            ]
          }
        };

        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });
      }

      // Update or create sync state
      if (newSyncToken) {
        if (syncRecord) {
          await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { 
            sync_token: newSyncToken,
            last_sync_date: new Date().toISOString()
          });
        } else {
          await base44.asServiceRole.entities.SyncState.create({ 
            user_id: user.id,
            sync_token: newSyncToken,
            last_sync_date: new Date().toISOString()
          });
        }
      }

      return Response.json({ 
        success: true, 
        events: chaosEvents,
        syncedCount: eventsToCreate.length,
        syncToken: newSyncToken
      });
    }

    if (action === 'create') {
      const payload = await req.json();
      const { caseId, caseTitle, deadlineTitle, deadlineDate, deadlineType } = payload;

      const event = {
        summary: `Chaos Controller: ${deadlineTitle}`,
        description: `Case: ${caseTitle}\nDeadline Type: ${deadlineType}\n\nThis deadline was created by Chaos Controller - Consumer Dispute Management`,
        start: {
          date: deadlineDate,
          timeZone: 'Australia/Sydney'
        },
        end: {
          date: deadlineDate,
          timeZone: 'Australia/Sydney'
        },
        extendedProperties: {
          private: {
            caseId: caseId,
            deadlineType: deadlineType
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 1440 }, // 1 day before
            { method: 'popup', minutes: 60 }    // 1 hour before
          ]
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!res.ok) {
        const error = await res.json();
        return Response.json({ error: error.error?.message || 'Failed to create event' }, { status: res.status });
      }

      const createdEvent = await res.json();
      return Response.json({ success: true, event: createdEvent });
    }

    if (action === 'delete') {
      const payload = await req.json();
      const { eventId } = payload;

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!res.ok && res.status !== 404) {
        return Response.json({ error: 'Failed to delete event' }, { status: res.status });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});