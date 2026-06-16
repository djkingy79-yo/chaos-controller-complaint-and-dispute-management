import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

    // Find active share by token
    const shares = await base44.asServiceRole.entities.CaseShare.filter({ share_token: token });
    const share = shares.find(s => s.is_active);
    if (!share) return Response.json({ error: 'Share not found or expired' }, { status: 404 });

    // Update last_viewed
    await base44.asServiceRole.entities.CaseShare.update(share.id, { last_viewed: new Date().toISOString() });

    // Fetch case
    const cases = await base44.asServiceRole.entities.Case.filter({ id: share.case_id });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Fetch related data (read-only, no sensitive details)
    const deadlines = await base44.asServiceRole.entities.Deadline.filter({ case_id: share.case_id });
    const timelineEvents = await base44.asServiceRole.entities.TimelineEvent.filter({ case_id: share.case_id });
    const checklistItems = await base44.asServiceRole.entities.ChecklistItem.filter({ case_id: share.case_id });
    const evidence = await base44.asServiceRole.entities.Evidence.filter({ case_id: share.case_id });

    // Return safe subset — no complaint letter, no complainant personal details
    return Response.json({
      success: true,
      share: {
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
        items: checklistItems.map(i => ({
          id: i.id, label: i.label, category: i.category, status: i.status
        }))
      },
      evidence_count: evidence.length,
      evidence_types: [...new Set(evidence.map(e => e.file_type).filter(Boolean))]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});