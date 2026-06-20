import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Build a base64url-encoded RFC 2822 email for Gmail API
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
    const emailBody = `Hi ${owner.full_name || "there"},

Your case status has been updated in Chaos Controller.

CASE STATUS CHANGE
==================

Case Reference: ${caseRef}
Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || "N/A"}
Category: ${caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : "N/A"}

Previous Status: ${oldStatusLabel}
New Status: ${statusLabel}

${newStatus === "escalation_ready" ? "Your case is now ready for escalation to the relevant ombudsman. Log in to generate your escalation bundle." : ""}
${newStatus === "resolved" ? "Congratulations! Your case has been marked as resolved." : ""}
${newStatus === "response_received" ? "A response has been received. Log in to review and decide your next steps." : ""}

View your case:
https://chaoscontroller.base44.app/case/${caseItem.id}

Never Fear. Control Starts Here.
Chaos Controller - AI-Powered Consumer Advocacy
Support: chaoscontrollerapp@gmail.com`;

    await sendGmail(accessToken, {
      to: owner.email,
      from: "Chaos Controller™ <chaoscontrollerapp@gmail.com>",
      subject,
      body: emailBody
    });

    // Notify merchant/respondent if there's an active share
    const shares = await base44.asServiceRole.entities.CaseShare.filter({ case_id: caseItem.id });
    const activeShare = shares.find(s => s.is_active && s.notify_on_update && s.recipient_email);
    if (activeShare) {
      const portalUrl = `https://chaoscontroller.base44.app/shared-case/${activeShare.share_token}`;
      await sendGmail(accessToken, {
        to: activeShare.recipient_email,
        from: "Chaos Controller™ <chaoscontrollerapp@gmail.com>",
        subject: `[${caseRef}] Case Update: Status Changed to ${statusLabel}`,
        body: `Dear ${activeShare.recipient_name || 'Representative'},\n\nA case you have been shared on has been updated.\n\nCase Reference: ${caseRef}\nCase: ${caseItem.title}\nNew Status: ${statusLabel}\n\nView the case portal:\n${portalUrl}\n\nChaos Controller - AI-Powered Consumer Advocacy`
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