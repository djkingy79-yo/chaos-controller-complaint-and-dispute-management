import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOGO_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/4bbb85089_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png';

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
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { data, old_data } = body;

    if (!data || !data.id) {
      return Response.json({ skipped: "no data" });
    }

    const caseItem = data;
    const newStatus = caseItem.status;
    const oldStatus = old_data?.status;

    if (newStatus === oldStatus) {
      return Response.json({ skipped: "status unchanged" });
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Get case owner
    const users = await base44.asServiceRole.entities.User.list();
    const owner = users.find(u => u.id === caseItem.created_by_id);
    if (!owner?.email) {
      return Response.json({ skipped: "no owner email" });
    }

    const statusLabels = {
      draft: "Draft",
      complaint_sent: "Complaint Sent",
      awaiting_response: "Awaiting Response",
      response_received: "Response Received",
      escalation_ready: "Ready for Escalation",
      escalated: "Escalated to Ombudsman",
      resolved: "Resolved",
      closed: "Closed"
    };

    const statusLabel = statusLabels[newStatus] || newStatus;
    const oldStatusLabel = statusLabels[oldStatus] || oldStatus || "Unknown";
    const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;

    const subject = `[${caseRef}] Case Update: ${statusLabel}`;
    const emailHtml = htmlEmail(`
      <p>Hi <strong style="color:#000000;">${owner.full_name || 'there'}</strong>,</p>
      <p>Your case status has been updated in Chaos Controller™.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseRef}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Case</td><td style="color:#000000;font-weight:bold;">${caseItem.title}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Organisation</td><td style="color:#333333;">${caseItem.organisation_name || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Previous Status</td><td style="color:#666666;">${oldStatusLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#666666;font-size:12px;">New Status</td><td style="color:#b45309;font-weight:bold;">${statusLabel}</td></tr>
      </table>
      ${newStatus === 'escalation_ready' ? '<p style="color:#dc2626;">Your case is ready for escalation. Log in to generate your escalation bundle.</p>' : ''}
      ${newStatus === 'resolved' ? '<p style="color:#16a34a;">Congratulations! Your case has been marked as resolved.</p>' : ''}
      ${newStatus === 'response_received' ? '<p style="color:#b45309;">A response has been received. Log in to review and decide your next steps.</p>' : ''}
      <p style="margin-top:24px;"><a href="https://chaoscontroller.com.au/case/${caseItem.id}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Case</a></p>
    `);

    await sendGmail(accessToken, {
      to: owner.email,
      from: "Chaos Controller <chaoscontrollerapp@gmail.com>",
      subject,
      html: emailHtml
    });

    // Notify merchant/respondent if there's an active share
    const shares = await base44.asServiceRole.entities.CaseShare.filter({ case_id: caseItem.id });
    const activeShare = shares.find(s => s.is_active && s.notify_on_update && s.recipient_email);
    if (activeShare) {
      const portalUrl = `https://chaoscontroller.com.au/shared-case/${activeShare.share_token}`;
      await sendGmail(accessToken, {
        to: activeShare.recipient_email,
        from: "Chaos Controller <chaoscontrollerapp@gmail.com>",
        subject: `[${caseRef}] Case Update: Status Changed to ${statusLabel}`,
        html: htmlEmail(`
          <p>Dear <strong style="color:#000000;">${activeShare.recipient_name || 'Representative'}</strong>,</p>
          <p>A case you have been shared on has been updated.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
            <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseRef}</td></tr>
            <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Case</td><td style="color:#000000;">${caseItem.title}</td></tr>
            <tr><td style="padding:6px 0;color:#666666;font-size:12px;">New Status</td><td style="color:#b45309;font-weight:bold;">${statusLabel}</td></tr>
          </table>
          <p style="margin-top:24px;"><a href="${portalUrl}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Case Portal</a></p>
        `)
      });
    }

    // In-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: caseItem.created_by_id,
      case_id: caseItem.id,
      title: `Case status updated: ${statusLabel}`,
      message: `"${caseItem.title}" status changed from ${oldStatusLabel} to ${statusLabel}.`,
      type: "action_required",
      urgency: ["escalation_ready", "escalated"].includes(newStatus) ? "high" : "medium",
      is_read: false
    });

    return Response.json({ sent: true, to: owner.email, caseRef, newStatus, oldStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});