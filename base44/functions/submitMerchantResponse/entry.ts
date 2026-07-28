import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { verifyMerchantSession } from '../_shared/merchantSession.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { case_id, share_id, session_token, merchant_name, response_text, response_type, offer_amount } = await req.json();

    if (!case_id || !session_token || !response_text) {
      return Response.json({ error: 'case_id, session_token, and response_text are required' }, { status: 400 });
    }

    const session = await verifyMerchantSession(session_token);
    const shares = await Promise.all(
      session.shareIds.map(async (id) => {
        const results = await base44.asServiceRole.entities.CaseShare.filter({ id });
        return results[0] || null;
      })
    );

    const share = shares.find((candidate) =>
      candidate &&
      candidate.case_id === case_id &&
      candidate.is_active &&
      candidate.recipient_email?.toLowerCase() === session.email &&
      (!share_id || candidate.id === share_id)
    );

    if (!share) {
      return Response.json({ error: 'No active case share found for this merchant' }, { status: 403 });
    }

    // Create the response record
    const response = await base44.asServiceRole.entities.MerchantResponse.create({
      case_id,
      share_id: share.id,
      merchant_email: session.email,
      merchant_name: merchant_name || share.recipient_name || session.email,
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
          body: `${merchant_name || share.recipient_name || session.email} has submitted a response to your case: ${caseItem.title}\n\nResponse Type: ${(response_type || 'general_response').replace(/_/g, ' ')}\n${offer_amount ? `Settlement Offer: ${offer_amount}\n` : ''}\nResponse:\n${response_text}\n\nView your case: https://chaoscontroller.com.au/case/${case_id}`,
          from_name: "Chaos Controller™"
        });
      }
    }

    return Response.json({ success: true, response_id: response.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});