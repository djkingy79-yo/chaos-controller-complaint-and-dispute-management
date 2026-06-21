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
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { data, event } = body;
    if (!data || !data.id) return Response.json({ skipped: 'no data' });

    const response = data;
    const caseId = response.case_id;
    if (!caseId) return Response.json({ skipped: 'no case_id' });

    // Get the case
    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ skipped: 'case not found' });

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Get case owner to notify them
    const users = await base44.asServiceRole.entities.User.list();
    const owner = users.find(u => u.id === caseItem.created_by_id);
    if (!owner?.email) return Response.json({ skipped: 'no owner email' });

    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
    const merchantName = response.merchant_name || response.merchant_email || 'The merchant';
    const responseTypeLabels = {
      general_response: 'General Response',
      offer_settlement: 'Settlement Offer',
      deny_claim: 'Claim Denial',
      request_more_info: 'Request for More Information',
      escalation_response: 'Escalation Response'
    };
    const responseTypeLabel = responseTypeLabels[response.response_type] || 'Response';

    const isOffer = response.response_type === 'offer_settlement';
    const isDenial = response.response_type === 'deny_claim';

    const subject = `[${caseRef}] Merchant Response: ${responseTypeLabel} - "${caseItem.title}"`;
    const emailHtml = htmlEmail(`
      <p style="color:#666666;font-size:12px;margin:0 0 20px 0;text-transform:uppercase;letter-spacing:1px;">MERCHANT ACTIVITY ALERT</p>
      <p>Hi <strong style="color:#000000;">${owner.full_name || 'there'}</strong>,</p>
      <p>A merchant has responded to your case in Chaos Controller™.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseRef}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Case</td><td style="color:#000000;font-weight:bold;">${caseItem.title}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Organisation</td><td style="color:#333333;">${caseItem.organisation_name || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Merchant</td><td style="color:#333333;">${merchantName}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Response Type</td><td style="color:#b45309;font-weight:bold;">${responseTypeLabel}</td></tr>
        ${isOffer && response.offer_amount ? `<tr><td style="padding:6px 0;color:#666666;font-size:12px;">Offer Amount</td><td style="color:#16a34a;font-weight:bold;">${response.offer_amount}</td></tr>` : ''}
      </table>
      <div style="background:#fef9e7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:16px 0;color:#666666;font-style:italic;font-size:13px;">"${(response.response_text || '').slice(0, 300)}${(response.response_text?.length || 0) > 300 ? '...' : ''}"</div>
      ${isOffer ? '<p style="color:#16a34a;font-weight:bold;">ACTION REQUIRED: A settlement offer has been made. Log in to review and decide whether to accept or reject.</p>' : ''}
      ${isDenial ? '<p style="color:#dc2626;font-weight:bold;">ACTION REQUIRED: The merchant has denied your claim. Consider escalating to the relevant ombudsman.</p>' : ''}
      <p style="margin-top:24px;"><a href="https://chaoscontroller.com.au/case/${caseItem.id}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Case</a></p>
    `);

    await sendGmail(accessToken, {
      to: owner.email,
      from: 'Chaos Controller <chaoscontrollerapp@gmail.com>',
      subject,
      html: emailHtml
    });

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: caseItem.created_by_id,
      case_id: caseItem.id,
      title: `[${caseRef}] Merchant responded: ${responseTypeLabel}`,
      message: `${merchantName} submitted a "${responseTypeLabel}" on "${caseItem.title}".`,
      type: 'response_received',
      urgency: isOffer || isDenial ? 'high' : 'medium',
      is_read: false
    });

    // Push action-required merchant responses to both calendars
    if (isOffer || isDenial) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const calSubject = `📬 [CC] Merchant ${isOffer ? 'Offer' : 'Denial'}: ${caseItem.title} — ${responseTypeLabel}`;

      // Outlook
      try {
        const { accessToken: outlookToken } = await base44.asServiceRole.connectors.getConnection('outlook');
        const startDt = new Date(today); startDt.setHours(9, 0, 0, 0);
        const endDt = new Date(today); endDt.setHours(10, 0, 0, 0);
        await graphRequest(outlookToken, '/me/events', {
          method: 'POST',
          body: JSON.stringify({
            subject: calSubject,
            body: { contentType: 'text', content: `Merchant: ${merchantName}\nResponse: ${responseTypeLabel}\n${isOffer ? `Offer Amount: ${response.offer_amount || 'N/A'}` : ''}\n\nResponse Preview:\n"${(response.response_text || '').slice(0, 300)}"\n\nView case: https://chaoscontroller.com.au/case/${caseItem.id}` },
            start: { dateTime: startDt.toISOString(), timeZone: 'Australia/Sydney' },
            end: { dateTime: endDt.toISOString(), timeZone: 'Australia/Sydney' },
            isReminderOn: true, reminderMinutesBeforeStart: 0,
            importance: 'high', categories: ['Chaos Controller'],
          })
        });
      } catch (_) {}

      // Google Calendar
      try {
        const googleConn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        if (googleConn?.accessToken) {
          await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${googleConn.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: calSubject,
              description: `Merchant: ${merchantName}\nResponse Type: ${responseTypeLabel}\n\nPreview: "${(response.response_text || '').slice(0, 200)}"\n\nManage: https://chaoscontroller.com.au/case/${caseItem.id}`,
              start: { date: todayStr }, end: { date: todayStr },
              reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }, { method: 'email', minutes: 30 }] },
              colorId: '11',
            })
          });
        }
      } catch (_) {}
    }

    return Response.json({ sent: true, to: owner.email, caseRef, responseType: response.response_type });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});