import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GOOGLE_CONNECTOR_ID = '6a2f842ded0843ad5cb9ecb7';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function pushToOutlook(accessToken, deadline, caseItem, daysUntil) {
  const urgencyLabel = daysUntil === 0 ? "DUE TODAY" : daysUntil === 1 ? "Due Tomorrow" : `Due in ${daysUntil} days`;
  const startDate = new Date(deadline.deadline_date);
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(deadline.deadline_date);
  endDate.setHours(10, 0, 0, 0);
  const subject = `⚠️ [Chaos Controller] ${urgencyLabel}: ${deadline.title}`;
  // Check if event already exists
  try {
    const existing = await graphRequest(accessToken, `/me/events?$select=id,subject&$top=500&$filter=startsWith(subject,'⚠️ [Chaos Controller]')`);
    const match = (existing?.value || []).find(e => e.subject === subject);
    if (match) return; // already exists, skip
  } catch (_) {}
  const event = {
    subject,
    body: { contentType: 'text', content: `DEADLINE REMINDER\n\nCase: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nDeadline: ${deadline.title}\nStatus: ${urgencyLabel}\n\nView case: https://chaoscontroller.com.au/case/${caseItem.id}` },
    start: { dateTime: startDate.toISOString(), timeZone: 'Australia/Sydney' },
    end: { dateTime: endDate.toISOString(), timeZone: 'Australia/Sydney' },
    isReminderOn: true,
    reminderMinutesBeforeStart: daysUntil === 0 ? 0 : 60,
    importance: daysUntil <= 1 ? 'high' : 'normal',
    categories: ['Chaos Controller'],
  };
  await graphRequest(accessToken, '/me/events', { method: 'POST', body: JSON.stringify(event) });
}

async function pushToGoogleCalendar(accessToken, deadline, caseItem, daysUntil) {
  const urgencyLabel = daysUntil === 0 ? "DUE TODAY" : `Due in ${daysUntil} days`;
  // Search for existing reminder event by extended properties
  const timeMin = new Date(Date.now() - 7 * 86400000).toISOString();
  const searchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&timeMin=${timeMin}&privateExtendedProperty=deadlineId%3D${deadline.id}&privateExtendedProperty=source%3DChaosController`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (searchRes.ok) {
    const existing = await searchRes.json();
    if (existing.items?.length > 0) return; // already has reminder event
  }
  const event = {
  summary: `⚠️ ${urgencyLabel}: ${deadline.title} — ${caseItem.title}`,
  description: `Case: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nDeadline: ${deadline.title}\n\nManage: https://chaoscontroller.com.au/case/${caseItem.id}`,
    start: { date: deadline.deadline_date, timeZone: 'Australia/Sydney' },
    end: { date: deadline.deadline_date, timeZone: 'Australia/Sydney' },
    extendedProperties: { private: { deadlineId: deadline.id, source: 'ChaosController', type: 'reminder' } },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: daysUntil === 0 ? 0 : 60 }, { method: 'email', minutes: daysUntil === 0 ? 30 : 1440 }] },
    colorId: daysUntil === 0 ? '11' : daysUntil === 1 ? '6' : '5', // red / banana / sage
  };
  await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const deadlines = await base44.asServiceRole.entities.Deadline.list();
    const cases = await base44.asServiceRole.entities.Case.list();
    const users = await base44.asServiceRole.entities.User.list();

    const caseMap = Object.fromEntries(cases.map((c) => [c.id, c]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Get Outlook access token (shared connector)
    let outlookToken = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('outlook');
      outlookToken = conn?.accessToken || null;
    } catch (_) {}

    const now = new Date();
    const reminders = [];

    for (const deadline of deadlines) {
      if (!deadline.deadline_date || deadline.status !== "pending") continue;

      const deadlineDate = new Date(deadline.deadline_date);
      const daysUntil = Math.ceil((deadlineDate - now) / 86400000);

      // Send reminders at 7 days, 3 days, 2 days, 1 day (24-hour), and 0 days (due today)
      if (![7, 3, 2, 1, 0].includes(daysUntil)) continue;

      const caseItem = caseMap[deadline.case_id];
      if (!caseItem) continue;

      const caseOwner = userMap[caseItem.created_by_id];
      if (!caseOwner?.email) continue;

      const urgencyLabel = daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : daysUntil === 2 ? "in 48 HOURS" : `in ${daysUntil} days`;
      const emailSubject = daysUntil <= 1 
        ? `⚠️ URGENT: Deadline ${urgencyLabel} — ${deadline.title}`
        : `📅 Deadline Reminder: ${urgencyLabel} — ${deadline.title}`;
      
      const emailBody = `Hi ${caseOwner.full_name || "there"},

This is an automated reminder from Chaos Controller™.

DEADLINE ALERT — ${urgencyLabel.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || "N/A"}
Deadline: ${deadline.title}
Due Date: ${new Date(deadline.deadline_date).toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

${daysUntil === 0 ? "⚠️ This deadline is DUE TODAY. Take action immediately." : 
  daysUntil === 1 ? "⚠️ This deadline is due TOMORROW. Please take action today." :
  `This is an advance reminder that your deadline is due in ${daysUntil} days. Please plan accordingly.`}

Log in to Chaos Controller™ to review your case and take action:
https://chaoscontroller.com.au/case/${caseItem.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never Fear. Control Starts Here.
Chaos Controller™ — AI-Powered Consumer Advocacy`;

      // Send Gmail reminder for all intervals (7, 3, 2, 1, 0 days)
      try {
        const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
        if (gmailConn?.accessToken) {
          const rawMessage = `From: Chaos Controller <${gmailConn.connectionConfig?.email || 'noreply@chaoscontroller.com.au'}>\r\n` +
            `To: ${caseOwner.email}\r\n` +
            `Subject: ${emailSubject}\r\n` +
            `Content-Type: text/plain; charset=UTF-8\r\n\r\n${emailBody}`;
          await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${gmailConn.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              raw: btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_'),
            }),
          });
        } else {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: caseOwner.email,
            subject: emailSubject,
            body: emailBody,
            from_name: "Chaos Controller™",
          });
        }
      } catch (_) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: caseOwner.email,
          subject: emailSubject,
          body: emailBody,
          from_name: "Chaos Controller™",
        });
      }

      // 2. In-app notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: caseItem.created_by_id,
        case_id: deadline.case_id,
        title: `Deadline ${urgencyLabel}: ${deadline.title}`,
        message: `Your deadline for case "${caseItem.title}" is due ${urgencyLabel}.`,
        type: "deadline",
        urgency: daysUntil === 0 ? "critical" : daysUntil === 1 ? "high" : "medium",
        is_read: false,
      });

      // 3. Push to Outlook Calendar
      if (outlookToken) {
        try { await pushToOutlook(outlookToken, deadline, caseItem, daysUntil); } catch (_) {}
      }

      // 4. Push to Google Calendar (per-user connector)
      try {
        const googleConn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, caseItem.created_by_id);
        if (googleConn?.accessToken) {
          await pushToGoogleCalendar(googleConn.accessToken, deadline, caseItem, daysUntil);
        }
      } catch (_) {}

      reminders.push({ deadline: deadline.title, case: caseItem.title, daysUntil, email: caseOwner.email });
    }

    return Response.json({ sent: reminders.length, reminders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});