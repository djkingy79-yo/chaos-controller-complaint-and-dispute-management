import { createClient } from 'npm:@base44/sdk@0.8.31';

const SHARE_TOKEN_EXPIRY_HOURS = 72; // Share links expire after 72 hours

Deno.serve(async (req) => {
  try {
    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID'),
      serviceRoleKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY')
    });
    
    const url = new URL(req.url);
    let token = url.searchParams.get('token') || url.searchParams.get('share_token');
    
    if (!token) {
      try {
        const body = await req.json();
        token = body.token || body.share_token;
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    if (!token) return Response.json({ error: 'Token required. Please use the full share link.' }, { status: 400 });

    // Find active share by token
    const shares = await base44.entities.CaseShare.filter({ share_token: token });
    const share = shares.find(s => s.is_active);
    
    if (!share) return Response.json({ error: 'Share not found or expired' }, { status: 404 });

    // Validate token expiry (72 hours from creation)
    const shareCreated = new Date(share.created_date);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - shareCreated.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > SHARE_TOKEN_EXPIRY_HOURS) {
      // Auto-deactivate expired share
      await base44.entities.CaseShare.update(share.id, { is_active: false });
      return Response.json({ error: 'This share link has expired. Please request a new link from the case owner.' }, { status: 410 });
    }

    // Update last_viewed
    await base44.entities.CaseShare.update(share.id, { last_viewed: new Date().toISOString() });

    // Fetch case
    const cases = await base44.entities.Case.filter({ id: share.case_id });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Fetch related data (read-only, no sensitive details)
    const deadlines = await base44.entities.Deadline.filter({ case_id: share.case_id });
    const timelineEvents = await base44.entities.TimelineEvent.filter({ case_id: share.case_id });
    const checklistItems = await base44.entities.ChecklistItem.filter({ case_id: share.case_id });
    const evidence = await base44.entities.Evidence.filter({ case_id: share.case_id });

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