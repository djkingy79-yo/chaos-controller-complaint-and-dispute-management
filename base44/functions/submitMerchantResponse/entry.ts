import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { case_id, share_id, merchant_email, merchant_name, response_text, response_type, offer_amount } = await req.json();

    if (!case_id || !merchant_email || !response_text) {
      return Response.json({ error: 'case_id, merchant_email, and response_text are required' }, { status: 400 });
    }

    // Verify this merchant has an active share for this case
    const shares = await base44.asServiceRole.entities.CaseShare.filter({ case_id, recipient_email: merchant_email, is_active: true });
    if (shares.length === 0) {
      return Response.json({ error: 'No active case share found for this merchant' }, { status: 403 });
    }

    // Create the response record
    const response = await base44.asServiceRole.entities.MerchantResponse.create({
      case_id,
      share_id: share_id || shares[0].id,
      merchant_email,
      merchant_name: merchant_name || merchant_email,
      response_text,
      response_type: response_type || 'general_response',
      offer_amount: offer_amount || undefined,
      is_read: false,
    });

    // Add a timeline event on the case so the complainant sees it
    await base44.asServiceRole.entities.TimelineEvent.create({
      case_id,
      title: `Merchant Response: ${(response_type || 'general_response').replace(/_/g, ' ')}`,
      description: response_text.slice(0, 200) + (response_text.length > 200 ? '…' : ''),
      event_type: 'response',
      event_date: new Date().toISOString().split('T')[0],
      is_action_required: response_type === 'offer_settlement' || response_type === 'deny_claim',
    });

    // Notify the case owner by email
    const cases = await base44.asServiceRole.entities.Case.filter({ id: case_id });
    const caseItem = cases[0];
    if (caseItem?.complainant_email || caseItem?.created_by_id) {
      // Get owner email
      let ownerEmail = caseItem.complainant_email;
      if (!ownerEmail && caseItem.created_by_id) {
        const users = await base44.asServiceRole.entities.User.filter({ id: caseItem.created_by_id });
        ownerEmail = users[0]?.email;
      }
      if (ownerEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ownerEmail,
          subject: `New Response to Your Case: ${caseItem.title}`,
          body: `<h2>New Merchant Response</h2>
<p><strong>${merchant_name || merchant_email}</strong> has submitted a response to your case: <strong>${caseItem.title}</strong></p>
<p><strong>Response Type:</strong> ${(response_type || 'general_response').replace(/_/g, ' ')}</p>
${offer_amount ? `<p><strong>Settlement Offer:</strong> ${offer_amount}</p>` : ''}
<blockquote style="border-left:4px solid #1d4ed8;padding-left:16px;color:#333;">${response_text}</blockquote>
<p><a href="https://chaoscontroller.base44.app/case/${case_id}">View your case →</a></p>`,
        });
      }
    }

    return Response.json({ success: true, response_id: response.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});