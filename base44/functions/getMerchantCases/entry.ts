import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createMerchantSession, isShareExpired, verifyMerchantSession } from '../_shared/merchantSession.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, token, sessionToken } = await req.json();

    let merchantEmail = email?.trim().toLowerCase();
    let activeShares = [];
    let resolvedSessionToken = sessionToken || null;
    let sessionExpiresAt = null;

    if (sessionToken) {
      const session = await verifyMerchantSession(sessionToken);
      merchantEmail = session.email;
      sessionExpiresAt = session.expiresAt;

      const shares = await Promise.all(
        session.shareIds.map(async (shareId) => {
          const results = await base44.asServiceRole.entities.CaseShare.filter({ id: shareId });
          return results[0] || null;
        })
      );

      activeShares = shares.filter((share) =>
        share &&
        share.is_active &&
        share.recipient_email?.toLowerCase() === merchantEmail &&
        !isShareExpired(share)
      );
    } else {
      if (!merchantEmail) {
        return Response.json({ error: 'Email required' }, { status: 400 });
      }
      if (!token) {
        return Response.json({ error: 'A valid share link is required to start a merchant session' }, { status: 400 });
      }

      const shares = await base44.asServiceRole.entities.CaseShare.filter({
        recipient_email: merchantEmail,
        share_token: token,
      });

      const tokenShare = shares.find((share) => share.is_active && !isShareExpired(share));
      if (!tokenShare) {
        return Response.json({ error: 'Token does not match this email address or has expired' }, { status: 403 });
      }

      const allShares = await base44.asServiceRole.entities.CaseShare.filter({ recipient_email: merchantEmail });
      activeShares = allShares.filter((share) => share.is_active && !isShareExpired(share));
      const session = await createMerchantSession(merchantEmail, activeShares.map((share) => share.id));
      resolvedSessionToken = session.token;
      sessionExpiresAt = session.expiresAt;
    }

    if (activeShares.length === 0) {
      return Response.json({ error: 'No active cases shared with this session' }, { status: 404 });
    }

    // Update last_viewed for all shares
    await Promise.all(
      activeShares.map(s => base44.asServiceRole.entities.CaseShare.update(s.id, { last_viewed: new Date().toISOString() }))
    );

    // Fetch all shared cases with their related data
    const casesData = await Promise.all(
      activeShares.map(async (share) => {
        const cases = await base44.asServiceRole.entities.Case.filter({ id: share.case_id });
        const caseItem = cases[0];
        if (!caseItem) return null;

        const deadlines = await base44.asServiceRole.entities.Deadline.filter({ case_id: share.case_id });
        const timelineEvents = await base44.asServiceRole.entities.TimelineEvent.filter({ case_id: share.case_id });
        const checklistItems = await base44.asServiceRole.entities.ChecklistItem.filter({ case_id: share.case_id });
        const evidence = await base44.asServiceRole.entities.Evidence.filter({ case_id: share.case_id });
        const responses = await base44.asServiceRole.entities.MerchantResponse.filter({ case_id: share.case_id, merchant_email: merchantEmail });

        const today = new Date();
        const overdueDeadlines = deadlines.filter(d =>
          d.status === 'pending' && new Date(d.deadline_date) < today
        );
        const actionItems = timelineEvents.filter(e => e.is_action_required);

        return {
          share: {
            id: share.id,
            share_token: share.share_token,
            recipient_name: share.recipient_name,
            case_id: share.case_id
          },
          case: {
            id: caseItem.id,
            title: caseItem.title,
            category: caseItem.category,
            status: caseItem.status,
            organisation_name: caseItem.organisation_name,
            incident_date: caseItem.incident_date,
            issue_summary: caseItem.issue_summary,
            desired_outcome: caseItem.desired_outcome,
            response_deadline: caseItem.response_deadline,
            escalation_body: caseItem.escalation_body,
            priority: caseItem.priority,
            created_date: caseItem.created_date
          },
          deadlines: deadlines.map(d => ({
            id: d.id, title: d.title, deadline_date: d.deadline_date,
            deadline_type: d.deadline_type, status: d.status, responsibility: d.responsibility
          })),
          timeline: timelineEvents.map(e => ({
            id: e.id, title: e.title, description: e.description,
            event_type: e.event_type, event_date: e.event_date, is_action_required: e.is_action_required
          })),
          checklist: {
            total: checklistItems.length,
            complete: checklistItems.filter(i => i.status === 'complete').length,
            items: checklistItems.map(i => ({ id: i.id, label: i.label, category: i.category, status: i.status }))
          },
          evidence_count: evidence.length,
          evidence_types: [...new Set(evidence.map(e => e.file_type).filter(Boolean))],
          responses: responses.map(r => ({
            id: r.id, response_text: r.response_text, response_type: r.response_type,
            offer_amount: r.offer_amount, created_date: r.created_date
          })),
          summary: {
            overdue_count: overdueDeadlines.length,
            action_count: actionItems.length,
            upcoming_deadlines: deadlines
              .filter(d => d.status === 'pending' && new Date(d.deadline_date) >= today)
              .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
              .slice(0, 3)
              .map(d => ({ title: d.title, deadline_date: d.deadline_date, deadline_type: d.deadline_type }))
          }
        };
      })
    );

    const validCases = casesData.filter(Boolean);

    return Response.json({
      success: true,
      merchant_email: merchantEmail,
      merchant_name: activeShares[0]?.recipient_name || null,
      session_token: resolvedSessionToken,
      session_expires_at: sessionExpiresAt,
      cases: validCases
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});