import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
    const portalUrl = `https://app.base44.com/6a2ac3b012e45642b1f94671/shared-case/${token}`;

    // Send invite email to merchant
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `📋 Shared Dispute Case: "${caseItem.title}" — Action May Be Required`,
      body: `Dear ${recipientName || 'Representative'},

You have been invited to view a formal dispute case submitted via Chaos Controller™.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CASE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case Reference: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'N/A'}
Category: ${caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : 'N/A'}
Current Status: ${caseItem.status?.replace(/_/g, ' ').toUpperCase() || 'ACTIVE'}

This shared portal allows you to:
• View the full case status and progress
• See the case timeline and all documented events
• Review evidence categories and key deadlines
• Track checklist completion

ACCESS THE CASE PORTAL:
${portalUrl}

This link is unique and provides read-only access to this case. You will receive updates when the case status changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chaos Controller™ — AI-Powered Consumer Advocacy
This is an automated notification. Do not reply to this email.`,
      from_name: 'Chaos Controller™'
    });

    return Response.json({ success: true, token, portalUrl, shareId: share.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});