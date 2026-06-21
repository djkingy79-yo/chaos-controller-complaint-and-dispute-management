import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOGO_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/4bbb85089_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png';

function encodeSubject(subject) {
  const encoded = btoa(unescape(encodeURIComponent(subject)));
  return `=?UTF-8?B?${encoded}?=`;
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

function buildMimeMessage({ to, subject, html }) {
  const message = [
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

async function sendGmail(accessToken, { to, subject, html }) {
  const raw = buildMimeMessage({ to, subject, html });
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
    const payload = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);

    const { data, event } = payload;
    if (!data || !data.id) return Response.json({ skipped: 'no data' });

    // This triggers on CaseShare updates (last_viewed field changes = merchant logged in and viewed)
    const share = data;
    const caseId = share.case_id;
    if (!caseId) return Response.json({ skipped: 'no case_id' });

    // Only fire when last_viewed was just set/updated
    const changedFields = payload.changed_fields || [];
    if (!changedFields.includes('last_viewed') && event?.type !== 'create') {
      return Response.json({ skipped: 'last_viewed not changed' });
    }

    // Get the case
    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ skipped: 'case not found' });

    // Get Gmail token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Get case owner
    const users = await base44.asServiceRole.entities.User.list();
    const owner = users.find(u => u.id === caseItem.created_by_id);
    if (!owner?.email) return Response.json({ skipped: 'no owner email' });

    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
    const merchantName = share.recipient_name || share.recipient_email || 'A merchant';
    const viewedAt = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `[${caseRef}] Merchant Portal Access - "${caseItem.title}"`;
    const html = htmlEmail(`
      <p style="color:#666666;font-size:12px;margin:0 0 20px 0;text-transform:uppercase;letter-spacing:1px;">MERCHANT PORTAL LOGIN ALERT</p>
      <p>Hi <strong style="color:#000000;">${owner.full_name || 'there'}</strong>,</p>
      <p>A merchant has just accessed your case file in the Chaos Controller™ Merchant Portal.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseRef}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Case</td><td style="color:#000000;font-weight:bold;">${caseItem.title}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Organisation</td><td style="color:#333333;">${caseItem.organisation_name || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Merchant</td><td style="color:#333333;">${merchantName}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Access Time</td><td style="color:#333333;">${viewedAt} (Sydney)</td></tr>
      </table>
      <p style="color:#666666;">The merchant is reviewing your case. You may receive a response shortly.</p>
      <p style="margin-top:24px;"><a href="https://chaoscontroller.com.au/case/${caseItem.id}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Case</a></p>
    `);

    await sendGmail(accessToken, { to: owner.email, subject, html });

    return Response.json({ sent: true, to: owner.email, caseRef, merchant: merchantName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});