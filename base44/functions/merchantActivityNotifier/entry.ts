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

function buildMimeMessage({ to, from, subject, body }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(accessToken, { to, from, subject, body }) {
  const raw = buildMimeMessage({ to, from, subject, body });
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

    const subject = `📬 [${caseRef}] Merchant Response: "${caseItem.title}" — ${responseTypeLabel}`;
    const emailBody = `Hi ${owner.full_name || 'there'},

A merchant has responded to your case in Chaos Controller™.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MERCHANT ACTIVITY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case Reference: ${caseRef}
Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'N/A'}

Merchant: ${merchantName}
Response Type: ${responseTypeLabel}
${isOffer && response.offer_amount ? `Settlement Offer Amount: ${response.offer_amount}` : ''}

Response Preview:
"${(response.response_text || '').slice(0, 300)}${response.response_text?.length > 300 ? '...' : ''}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isOffer ? '💰 ACTION REQUIRED: A settlement offer has been made. Log in to review and decide whether to accept or reject.' : ''}
${isDenial ? '🚨 ACTION REQUIRED: The merchant has denied your claim. Consider escalating to the relevant ombudsman.' : ''}
${!isOffer && !isDenial ? '📋 Log in to review the full response and update your case accordingly.' : ''}

View your case:
https://app.base44.com/6a2ac3b012e45642b1f94671/case/${caseItem.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never Fear. Control Starts Here.
Chaos Controller™ — AI-Powered Consumer Advocacy
Support: chaoscontrollerapp@gmail.com`;

    await sendGmail(accessToken, {
      to: owner.email,
      from: 'Chaos Controller™ <chaoscontrollerapp@gmail.com>',
      subject,
      body: emailBody
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
            body: { contentType: 'text', content: `Merchant: ${merchantName}\nResponse: ${responseTypeLabel}\n${isOffer ? `Offer Amount: ${response.offer_amount || 'N/A'}` : ''}\n\nResponse Preview:\n"${(response.response_text || '').slice(0, 300)}"\n\nView case: https://app.base44.com/6a2ac3b012e45642b1f94671/case/${caseItem.id}` },
            start: { dateTime: startDt.toISOString(), timeZone: 'Australia/Sydney' },
            end: { dateTime: endDt.toISOString(), timeZone: 'Australia/Sydney' },
            isReminderOn: true, reminderMinutesBeforeStart: 0,
            importance: 'high', categories: ['Chaos Controller'],
          })
        });
      } catch (_) {}

      // Google Calendar
      try {
        const googleConn = await base44.asServiceRole.connectors.getAppUserConnection(GOOGLE_CONNECTOR_ID, caseItem.created_by_id);
        if (googleConn?.accessToken) {
          await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${googleConn.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: calSubject,
              description: `Merchant: ${merchantName}\nResponse Type: ${responseTypeLabel}\n\nPreview: "${(response.response_text || '').slice(0, 200)}"\n\nManage: https://app.base44.com/6a2ac3b012e45642b1f94671/case/${caseItem.id}`,
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