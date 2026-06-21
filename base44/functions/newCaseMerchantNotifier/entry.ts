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

function buildMimeMessage({ to, from, subject, html }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(accessToken, { to, from, subject, html }) {
  const raw = buildMimeMessage({ to, from, subject, html });
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed: ${err}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    if (event?.type !== 'create') {
      return Response.json({ message: 'Not a create event, skipping.' });
    }

    const caseItem = data;
    if (!caseItem) {
      return Response.json({ error: 'No case data in payload' }, { status: 400 });
    }

    const shares = await base44.asServiceRole.entities.CaseShare.filter({
      case_id: caseItem.id,
      is_active: true,
    });

    if (!shares || shares.length === 0) {
      return Response.json({ message: 'No active merchant shares found for this case.' });
    }

    const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
    const accessToken = gmailConn?.accessToken;

    const results = [];

    for (const share of shares) {
      if (!share.recipient_email) continue;

      const recipientName = share.recipient_name || 'Merchant';
      const orgName = caseItem.organisation_name || 'your organisation';
      const category = (caseItem.category || 'general').charAt(0).toUpperCase() + (caseItem.category || 'general').slice(1);
      const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
      const portalUrl = `https://chaoscontroller.com.au/shared-case/${share.share_token}`;

      const subject = `[${caseRef}] New Dispute Case Filed Against ${orgName}`;

      const emailHtml = htmlEmail(`
        <p style="color:#666666;font-size:12px;margin:0 0 20px 0;text-transform:uppercase;letter-spacing:1px;">NEW DISPUTE NOTIFICATION</p>
        <p>Dear <strong style="color:#000000;">${recipientName}</strong>,</p>
        <p>A new consumer dispute has been formally lodged against ${orgName} via the Chaos Controller platform.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
          <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseRef}</td></tr>
          <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Case Title</td><td style="color:#000000;font-weight:bold;">${caseItem.title || 'Untitled Case'}</td></tr>
          <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Category</td><td style="color:#333333;">${category}</td></tr>
          <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Status</td><td style="color:#333333;">${(caseItem.status || 'draft').replace(/_/g, ' ').toUpperCase()}</td></tr>
          <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Incident Date</td><td style="color:#333333;">${caseItem.incident_date || 'Not specified'}</td></tr>
          <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Priority</td><td style="color:#333333;">${(caseItem.priority || 'medium').toUpperCase()}</td></tr>
        </table>
        <div style="margin:20px 0;">
          <p style="color:#666666;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Issue Summary</p>
          <p style="color:#333333;">${caseItem.issue_summary || 'No summary provided.'}</p>
        </div>
        <div style="margin:20px 0;">
          <p style="color:#666666;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Desired Outcome</p>
          <p style="color:#333333;">${caseItem.desired_outcome || 'Not specified.'}</p>
        </div>
        <p style="margin-top:24px;"><a href="${portalUrl}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Case Portal</a></p>
        <p style="color:#666666;font-size:13px;margin-top:20px;">This is a formal notification. Failure to respond within the specified timeframe may result in escalation to the relevant ombudsman or tribunal body.</p>
      `);

      if (accessToken) {
        await sendGmail(accessToken, {
          to: share.recipient_email,
          from: 'Chaos Controller <chaoscontrollerapp@gmail.com>',
          subject,
          html: emailHtml
        });
        results.push({ email: share.recipient_email, status: 'sent' });
      } else {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: share.recipient_email,
          subject,
          body: emailHtml,
          from_name: 'Chaos Controller',
        });
        results.push({ email: share.recipient_email, status: 'sent_via_platform' });
      }
    }

    return Response.json({ success: true, notifications_sent: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});