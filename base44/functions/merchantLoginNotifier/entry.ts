import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function encodeSubject(subject) {
  // RFC 2047 encoded-word for UTF-8 subject (handles emoji, em dash, etc.)
  const encoded = btoa(unescape(encodeURIComponent(subject)));
  return `=?UTF-8?B?${encoded}?=`;
}

function buildMimeMessage({ to, subject, body }) {
  const message = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(accessToken, { to, subject, body }) {
  const raw = buildMimeMessage({ to, subject, body });
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

    const subject = `🔔 [${caseRef}] Merchant Portal Access — "${caseItem.title}"`;
    const body = `Hi ${owner.full_name || 'there'},

A merchant has just accessed your case file in the Chaos Controller™ Merchant Portal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MERCHANT PORTAL LOGIN ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case Reference: ${caseRef}
Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'N/A'}

Merchant: ${merchantName}
Access Time: ${viewedAt} (Sydney)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 The merchant has logged into the portal and is reviewing your case. You may receive a response shortly.

View your case:
https://chaoscontroller.com.au/case/${caseItem.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never Fear. Control Starts Here.
Chaos Controller™ — AI-Powered Consumer Advocacy
Support: chaoscontrollerapp@gmail.com`;

    await sendGmail(accessToken, { to: owner.email, subject, body });

    return Response.json({ sent: true, to: owner.email, caseRef, merchant: merchantName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});