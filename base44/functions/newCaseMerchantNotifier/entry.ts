import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only handle case creation events
    if (event?.type !== 'create') {
      return Response.json({ message: 'Not a create event, skipping.' });
    }

    const caseItem = data;
    if (!caseItem) {
      return Response.json({ error: 'No case data in payload' }, { status: 400 });
    }

    // Find active CaseShares for this case that have a recipient email
    const shares = await base44.asServiceRole.entities.CaseShare.filter({
      case_id: caseItem.id,
      is_active: true,
    });

    if (!shares || shares.length === 0) {
      return Response.json({ message: 'No active merchant shares found for this case.' });
    }

    // Get Gmail access token
    const gmailConn = await base44.asServiceRole.connectors.getConnection('gmail');
    const accessToken = gmailConn?.access_token;

    const results = [];

    for (const share of shares) {
      if (!share.recipient_email) continue;

      const recipientName = share.recipient_name || 'Merchant';
      const orgName = caseItem.organisation_name || 'your organisation';
      const category = (caseItem.category || 'general').charAt(0).toUpperCase() + (caseItem.category || 'general').slice(1);
      const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
      const portalUrl = `https://chaoscontroller.com.au/shared-case/${share.share_token}`;

      const subject = `[${caseRef}] New Dispute Case Filed Against ${orgName}`;

      const body = `Dear ${recipientName},

A new consumer dispute has been formally lodged against ${orgName} via the Chaos Controller platform.

CASE REFERENCE: ${caseRef}
CASE TITLE: ${caseItem.title || 'Untitled Case'}
CATEGORY: ${category}
STATUS: ${(caseItem.status || 'draft').replace(/_/g, ' ').toUpperCase()}
INCIDENT DATE: ${caseItem.incident_date || 'Not specified'}
PRIORITY: ${(caseItem.priority || 'medium').toUpperCase()}

ISSUE SUMMARY:
${caseItem.issue_summary || 'No summary provided.'}

DESIRED OUTCOME:
${caseItem.desired_outcome || 'Not specified.'}

You can view the full case details, deadlines, timeline, and required actions via the secure portal link below:

${portalUrl}

This is a formal notification. Failure to respond within the specified timeframe may result in escalation to the relevant ombudsman or tribunal body.

Chaos Controller™
chaoscontrollerapp@gmail.com
chaoscontroller.com.au`;

      if (accessToken) {
        // Send via Gmail API
        const email = [
          `To: ${share.recipient_email}`,
          `Subject: ${subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          body
        ].join('\r\n');

        const encoded = btoa(unescape(encodeURIComponent(email)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encoded }),
        });

        results.push({ email: share.recipient_email, status: gmailRes.ok ? 'sent' : 'failed' });
      } else {
        // Fallback to platform email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: share.recipient_email,
          subject,
          body,
          from_name: 'Chaos Controller',
        });
        results.push({ email: share.recipient_email, status: 'sent_via_platform' });
      }
    }

    return Response.json({ success: true, notifications_sent: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});