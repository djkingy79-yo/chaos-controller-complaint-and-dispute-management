import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { event, data, old_data } = body;

    if (!data || !data.id) {
      return Response.json({ skipped: "no data" });
    }

    const caseItem = data;
    const newStatus = caseItem.status;
    const oldStatus = old_data?.status;

    // Only proceed if status actually changed
    if (newStatus === oldStatus) {
      return Response.json({ skipped: "status unchanged" });
    }

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

    const statusEmojis = {
      draft: "📝",
      complaint_sent: "📤",
      awaiting_response: "⏳",
      response_received: "📬",
      escalation_ready: "🚨",
      escalated: "⚖️",
      resolved: "✅",
      closed: "🔒"
    };

    const emoji = statusEmojis[newStatus] || "📋";
    const statusLabel = statusLabels[newStatus] || newStatus;
    const oldStatusLabel = statusLabels[oldStatus] || oldStatus || "Unknown";

    const subject = `${emoji} Case Update: "${caseItem.title}" → ${statusLabel}`;
    const body_text = `Hi ${owner.full_name || "there"},

Your case status has been updated in Chaos Controller™.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CASE STATUS CHANGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || "N/A"}
Category: ${caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : "N/A"}

Previous Status: ${oldStatusLabel}
New Status: ${statusLabel}

${newStatus === "escalation_ready" ? "🚨 Your case is now ready for escalation to the relevant ombudsman. Log in to generate your escalation bundle." : ""}
${newStatus === "resolved" ? "✅ Congratulations! Your case has been marked as resolved." : ""}
${newStatus === "response_received" ? "📬 A response has been received. Log in to review and decide your next steps." : ""}

View your case:
https://chaoscontroller.base44.app/case/${caseItem.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never Fear. Control Starts Here.
Chaos Controller™ — AI-Powered Consumer Advocacy
Support: chaoscontrollerapp@gmail.com`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: owner.email,
      subject,
      body: body_text,
      from_name: "Chaos Controller™"
    });

    // Also create an in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: caseItem.created_by_id,
      case_id: caseItem.id,
      title: `Case status updated: ${statusLabel}`,
      message: `"${caseItem.title}" status changed from ${oldStatusLabel} to ${statusLabel}.`,
      type: "action_required",
      urgency: ["escalation_ready", "escalated"].includes(newStatus) ? "high" : "medium",
      is_read: false
    });

    return Response.json({ sent: true, to: owner.email, newStatus, oldStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});