import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Simple merchant session: validate email matches a share, return all cases shared with that email
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, token } = await req.json();

    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    // Find all active shares for this merchant email
    const allShares = await base44.asServiceRole.entities.CaseShare.filter({ recipient_email: email });
    const activeShares = allShares.filter(s => s.is_active);

    // If a token was provided (initial login), verify it belongs to this email
    if (token) {
      const tokenShare = activeShares.find(s => s.share_token === token);
      if (!tokenShare) {
        return Response.json({ error: 'Token does not match this email address' }, { status: 403 });
      }
    } else if (activeShares.length === 0) {
      return Response.json({ error: 'No active cases shared with this email address' }, { status: 404 });
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
        const responses = await base44.asServiceRole.entities.MerchantResponse.filter({ case_id: share.case_id, merchant_email: email });

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
      merchant_email: email,
      merchant_name: activeShares[0]?.recipient_name || null,
      cases: validCases
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});