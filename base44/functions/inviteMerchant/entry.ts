import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function generateToken() {
  // Use crypto.randomUUID() for cryptographically secure token (122 bits entropy)
  return crypto.randomUUID();
}

function encodeSubject(subject) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
}

function htmlEmail(bodyHtml) {
  const LOGO_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg';
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
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
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
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { caseId, recipientEmail, recipientName, notifyOnUpdate } = await req.json();
    if (!caseId || !recipientEmail) {
      return Response.json({ error: 'caseId and recipientEmail required' }, { status: 400 });
    }

    // Fetch the case
    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Deactivate any existing shares for this case
    const existing = await base44.asServiceRole.entities.CaseShare.filter({ case_id: caseId });
    for (const share of existing) {
      await base44.asServiceRole.entities.CaseShare.update(share.id, { is_active: false });
    }

    // Create new share
    const token = generateToken();
    const share = await base44.asServiceRole.entities.CaseShare.create({
      case_id: caseId,
      share_token: token,
      created_by_id: user.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName || recipientEmail,
      is_active: true,
      notify_on_update: notifyOnUpdate !== false
    });

    // Use the correct app domain
    const portalUrl = `https://chaoscontroller.com.au/shared-case/${token}`;

    // Get Gmail access token for sending external emails
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Send invite email to merchant via Gmail connector (supports external recipients)
    const emailSubject = `📋 Shared Dispute Case: "${caseItem.title}" — Action May Be Required`;
    const emailBody = htmlEmail(`
      <p>Dear <strong style="color:#000000;">${recipientName || 'Representative'}</strong>,</p>
      <p>You have been invited to view a formal dispute case submitted via Chaos Controller™.</p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseItem.title}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Organisation</td><td style="color:#333333;">${caseItem.organisation_name || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Category</td><td style="color:#333333;">${caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Current Status</td><td style="color:#b45309;font-weight:bold;">${caseItem.status?.replace(/_/g, ' ').toUpperCase() || 'ACTIVE'}</td></tr>
      </table>
      
      <p>This shared portal allows you to:</p>
      <ul style="margin:16px 0;padding-left:20px;">
        <li>View the full case status and progress</li>
        <li>See the case timeline and all documented events</li>
        <li>Review evidence categories and key deadlines</li>
        <li>Track checklist completion</li>
      </ul>
      
      <p style="margin-top:24px;"><a href="${portalUrl}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Access the Case Portal</a></p>
      
      <p style="margin-top:20px;font-size:12px;color:#666666;">This link is unique and provides read-only access to this case. You will receive updates when the case status changes.</p>
    `);

    await sendGmail(accessToken, {
      to: recipientEmail,
      from: "Chaos Controller <chaoscontrollerapp@gmail.com>",
      subject: emailSubject,
      html: emailBody
    });

    // Create timeline event to record that invite was sent
    await base44.asServiceRole.entities.TimelineEvent.create({
      case_id: caseId,
      title: `Merchant Invite Sent to ${recipientName || recipientEmail}`,
      description: `Shared portal link sent to ${recipientName || recipientEmail} at ${recipientEmail}. Portal URL: ${portalUrl}`,
      event_type: 'complaint',
      event_date: new Date().toISOString().split('T')[0],
      is_action_required: false,
    });

    return Response.json({ success: true, token, portalUrl, shareId: share.id });
  } catch (error) {
    console.error('Merchant invite failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});