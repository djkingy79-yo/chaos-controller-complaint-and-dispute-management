import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const deadlines = await base44.asServiceRole.entities.Deadline.list();
    const cases = await base44.asServiceRole.entities.Case.list();
    const users = await base44.asServiceRole.entities.User.list();

    const caseMap = Object.fromEntries(cases.map((c) => [c.id, c]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Group deadlines by user
    const userDeadlines = {};

    for (const deadline of deadlines) {
      if (!deadline.deadline_date || deadline.status !== "pending") continue;

      const deadlineDate = new Date(deadline.deadline_date);
      deadlineDate.setHours(0, 0, 0, 0);

      // Get deadlines due today and tomorrow
      if (deadlineDate.getTime() !== today.getTime() && deadlineDate.getTime() !== tomorrow.getTime()) continue;

      const caseItem = caseMap[deadline.case_id];
      if (!caseItem) continue;

      const caseOwner = userMap[caseItem.created_by_id];
      if (!caseOwner?.email) continue;

      if (!userDeadlines[caseItem.created_by_id]) {
        userDeadlines[caseItem.created_by_id] = [];
      }

      const daysUntil = Math.ceil((deadlineDate - today) / 86400000);
      userDeadlines[caseItem.created_by_id].push({
        deadline,
        caseItem,
        isToday: daysUntil === 0,
        deadlineDate
      });
    }

    // Send emails
    const sent = [];

    for (const [userId, items] of Object.entries(userDeadlines)) {
      const user = userMap[userId];
      if (!user?.email) continue;

      // Sort: today first, then tomorrow
      items.sort((a, b) => (a.isToday === b.isToday ? 0 : a.isToday ? -1 : 1));

      const todayItems = items.filter(i => i.isToday);
      const tomorrowItems = items.filter(i => !i.isToday);

      let body = `Hi ${user.full_name || "there"},

Here's your daily briefing from Chaos Controller™.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY'S DEADLINES — ${today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      if (todayItems.length === 0) {
        body += `
✓ No deadlines due today. Great job staying on top of things!
`;
      } else {
        for (const item of todayItems) {
          body += `
⚠️ ${item.deadline.title}
   Case: ${item.caseItem.title}
   Organisation: ${item.caseItem.organisation_name || 'N/A'}
   Type: ${item.deadline.deadline_type || 'Deadline'}
   → https://chaoscontroller.com.au/case/${item.caseItem.id}
`;
        }
      }

      if (tomorrowItems.length > 0) {
        body += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOMORROW — ${tomorrow.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        for (const item of tomorrowItems) {
          body += `
📅 ${item.deadline.title}
   Case: ${item.caseItem.title}
   Organisation: ${item.caseItem.organisation_name || 'N/A'}
   → https://chaoscontroller.com.au/case/${item.caseItem.id}
`;
        }
      }

      body += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stay organised. Stay in control.
Chaos Controller™ — AI-Powered Consumer Advocacy
`;

      try {
        const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
        if (gmailConn?.accessToken) {
          const rawMessage = `From: Chaos Controller <${gmailConn.connectionConfig?.email || 'noreply@chaoscontroller.com.au'}>\r\n` +
            `To: ${user.email}\r\n` +
            `Subject: 📋 Your Daily Chaos Controller Briefing — ${today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}\r\n` +
            `Content-Type: text/plain; charset=UTF-8\r\n\r\n${body}`;
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
            to: user.email,
            subject: `📋 Your Daily Chaos Controller Briefing — ${today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}`,
            body,
            from_name: "Chaos Controller™",
          });
        }
      } catch (_) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `📋 Your Daily Chaos Controller Briefing — ${today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}`,
          body,
          from_name: "Chaos Controller™",
        });
      }

      sent.push({ email: user.email, deadlines: items.length });
    }

    return Response.json({ sent: sent.length, details: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});