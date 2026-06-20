import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, deadline, checklistItems, caseTitle } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    // Add a deadline as an Outlook calendar event
    if (action === 'add_deadline') {
      const startDate = deadline.deadline_date;
      const event = {
        subject: `[Chaos Controller] ${deadline.title}`,
        body: {
          contentType: 'HTML',
          content: `<p><strong>Case:</strong> ${caseTitle || 'Unknown'}</p><p><strong>Deadline Type:</strong> ${deadline.deadline_type || 'Other'}</p>${deadline.notes ? `<p><strong>Notes:</strong> ${deadline.notes}</p>` : ''}<p><a href="https://chaoscontroller.com.au/case/${deadline.case_id}">View Case</a></p>`,
        },
        start: { dateTime: `${startDate}T09:00:00`, timeZone: 'Australia/Sydney' },
        end:   { dateTime: `${startDate}T10:00:00`, timeZone: 'Australia/Sydney' },
        isReminderOn: true,
        reminderMinutesBeforeStart: 1440, // 24h before
        categories: ['Chaos Controller'],
      };
      const created = await graphRequest(accessToken, '/me/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
      return Response.json({ success: true, eventId: created.id });
    }

    // Send checklist reminder email
    if (action === 'send_checklist_reminder') {
      const missing = (checklistItems || []).filter(i => i.status !== 'complete');
      if (missing.length === 0) return Response.json({ success: true, sent: false, reason: 'All items complete' });

      const rows = missing.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #333;">${i.label}</td><td style="padding:8px;border-bottom:1px solid #333;color:#FF8800;">${i.status}</td><td style="padding:8px;border-bottom:1px solid #333;">${i.category}</td></tr>`).join('');
      const html = `
        <div style="font-family:Inter,sans-serif;background:#0a0a0a;color:#fff;padding:32px;max-width:600px;">
          <h1 style="color:#FFD700;font-size:22px;margin-bottom:4px;">Chaos Controller</h1>
          <h2 style="color:#fff;font-size:18px;margin-bottom:16px;">Checklist Reminder: ${caseTitle}</h2>
          <p style="color:#ccc;">You have <strong style="color:#FF8800;">${missing.length} incomplete checklist item${missing.length > 1 ? 's' : ''}</strong> requiring attention.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead><tr style="background:#1a1a1a;"><th style="padding:8px;text-align:left;color:#FFD700;">Item</th><th style="padding:8px;text-align:left;color:#FFD700;">Status</th><th style="padding:8px;text-align:left;color:#FFD700;">Category</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:24px;"><a href="https://chaoscontroller.com.au/checklist" style="background:#FFD700;color:#000;padding:10px 20px;text-decoration:none;font-weight:bold;border-radius:6px;">View Checklist</a></p>
        </div>`;

      await graphRequest(accessToken, '/me/sendMail', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            subject: `[Chaos Controller] Checklist Reminder: ${caseTitle}`,
            body: { contentType: 'HTML', content: html },
            toRecipients: [{ emailAddress: { address: user.email } }],
          },
          saveToSentItems: false,
        }),
      });
      return Response.json({ success: true, sent: true, count: missing.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});