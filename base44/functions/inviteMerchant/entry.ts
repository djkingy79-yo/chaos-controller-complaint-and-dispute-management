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
    const portalUrl = `https://chaoscontroller.com.au/shared-case/${token}`;

    // Send invite email to merchant
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Shared Dispute Case: "${caseItem.title}"`,
        body: `Dear ${recipientName || 'Representative'},

You have been invited to view a formal dispute case submitted via Chaos Controller.

CASE DETAILS:
Case Reference: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'N/A'}
Category: ${caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : 'N/A'}
Status: ${caseItem.status?.replace(/_/g, ' ').toUpperCase() || 'ACTIVE'}

Access the case portal: ${portalUrl}

This link provides read-only access. You will receive updates when the case status changes.

Chaos Controller - AI-Powered Consumer Advocacy
This is an automated notification. Do not reply.`,
        from_name: 'Chaos Controller'
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      // Continue anyway - share was created successfully
    }

    return Response.json({ success: true, token, portalUrl, shareId: share.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});