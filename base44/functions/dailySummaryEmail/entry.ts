import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOGO_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg';

function encodeSubject(subject) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
}

function htmlEmail(bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
<tr><td style="background:#ffffff;padding:16px 24px;border-bottom:2px solid #FFD700;text-align:center;">
<img src="${LOGO_URL}" alt="Chaos Controller" style="height:48px;width:auto;display:inline-block;" />
</td></tr>
<tr><td style="padding:28px 28px 20px 28px;color:#333333;font-size:14px;line-height:1.7;">
${bodyHtml}
</td></tr>
<tr><td style="background:#f9f9f9;border-top:1px solid #e0e0e0;padding:16px 24px;text-align:center;color:#666666;font-size:11px;">
Chaos Controller™ &mdash; AI-Powered Consumer Advocacy &nbsp;|&nbsp; <a href="https://chaoscontroller.com.au" style="color:#0066cc;text-decoration:none;">chaoscontroller.com.au</a>
</td></tr>
</table>
</td></tr>
</table></body></html>`;
}

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

      const todayLabel = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
      const tomorrowLabel = tomorrow.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
      const subject = `Daily Briefing - ${todayLabel}`;

      const todayRowsHtml = todayItems.length === 0
        ? `<p style="color:#22c55e;">No deadlines due today. Great job staying on top of things!</p>`
        : todayItems.map(item => `
          <div style="background:#fef2f2;border-left:3px solid #ef4444;padding:12px 16px;border-radius:4px;margin:10px 0;">
            <p style="color:#dc2626;font-weight:bold;margin:0 0 4px 0;">${item.deadline.title}</p>
            <p style="color:#666666;font-size:12px;margin:0;">Case: ${item.caseItem.title} &bull; ${item.caseItem.organisation_name || 'N/A'}</p>
            <a href="https://chaoscontroller.com.au/case/${item.caseItem.id}" style="color:#0066cc;font-size:12px;text-decoration:none;">View Case &rarr;</a>
          </div>`).join('');

      const tomorrowRowsHtml = tomorrowItems.length === 0 ? '' : `
        <p style="color:#b45309;font-weight:bold;margin:24px 0 8px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Tomorrow &mdash; ${tomorrowLabel}</p>
        ${tomorrowItems.map(item => `
          <div style="background:#fef9e7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:10px 0;">
            <p style="color:#92400e;font-weight:bold;margin:0 0 4px 0;">${item.deadline.title}</p>
            <p style="color:#666666;font-size:12px;margin:0;">Case: ${item.caseItem.title} &bull; ${item.caseItem.organisation_name || 'N/A'}</p>
            <a href="https://chaoscontroller.com.au/case/${item.caseItem.id}" style="color:#0066cc;font-size:12px;text-decoration:none;">View Case &rarr;</a>
          </div>`).join('')}`;

      const html = htmlEmail(`
        <p>Hi <strong style="color:#fff;">${user.full_name || 'there'}</strong>,</p>
        <p>Here's your daily briefing from Chaos Controller™.</p>
        <p style="color:#FFD700;font-weight:bold;margin:20px 0 8px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Today's Deadlines &mdash; ${todayLabel}</p>
        ${todayRowsHtml}
        ${tomorrowRowsHtml}
        <p style="margin-top:24px;"><a href="https://chaoscontroller.com.au/dashboard" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Open Dashboard</a></p>
      `);

      try {
        const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
        if (gmailConn?.accessToken) {
          const rawMessage = [
            `From: Chaos Controller <${gmailConn.connectionConfig?.email || 'noreply@chaoscontroller.com.au'}>`,
            `To: ${user.email}`,
            `Subject: ${encodeSubject(subject)}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            html
          ].join('\r\n');
          await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${gmailConn.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw: btoa(unescape(encodeURIComponent(rawMessage))).replace(/\+/g, '-').replace(/\//g, '_') }),
          });
        } else {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject, body: html, from_name: "Chaos Controller™" });
        }
      } catch (_) {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject, body: html, from_name: "Chaos Controller™" });
      }

      sent.push({ email: user.email, deadlines: items.length });
    }

    return Response.json({ sent: sent.length, details: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});