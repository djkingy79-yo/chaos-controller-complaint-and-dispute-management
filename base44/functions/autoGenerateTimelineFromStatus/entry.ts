import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const statusEventMap = {
  draft: { type: 'action_required', title: 'Case created', description: 'Case file opened and ready for evidence collection' },
  complaint_sent: { type: 'complaint', title: 'Complaint sent', description: 'Formal complaint letter sent to organisation' },
  awaiting_response: { type: 'action_required', title: 'Awaiting response', description: 'Waiting for organisation to respond to complaint' },
  response_received: { type: 'response', title: 'Response received', description: 'Organisation has responded to the complaint' },
  escalation_ready: { type: 'action_required', title: 'Ready for escalation' },
  escalated: { type: 'escalation', title: 'Case escalated' },
  resolved: { type: 'resolution', title: 'Case resolved', description: 'Dispute successfully resolved' },
  closed: { type: 'resolution', title: 'Case closed', description: 'Case file closed' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { event, data, old_data } = body;
    
    // Only process update events where status changed
    if (event.type !== 'update' || !data || !old_data) {
      return Response.json({ skipped: 'Not an update event or missing data' });
    }
    
    // Check if status actually changed
    if (data.status === old_data.status) {
      return Response.json({ skipped: 'Status unchanged' });
    }
    
    const caseId = data.id;
    const newStatus = data.status;
    const oldStatus = old_data.status;
    
    if (!newStatus || !statusEventMap[newStatus]) {
      return Response.json({ skipped: 'Invalid status' });
    }
    
    const eventConfig = statusEventMap[newStatus];

    // Build description using the case's ACTUAL escalation body — never a
    // generic "external body (ombudsman/tribunal)" placeholder. Falls back to
    // neutral wording only when no escalation body is assigned yet.
    const escalationBody = data.escalation_body || '';
    let description = eventConfig.description;
    if (newStatus === 'escalation_ready') {
      description = escalationBody
        ? `Case ready to escalate to ${escalationBody}. All internal complaint steps exhausted.`
        : 'Case ready to escalate — all internal complaint steps exhausted.';
    } else if (newStatus === 'escalated') {
      description = escalationBody
        ? `Matter escalated to ${escalationBody}.`
        : 'Matter escalated to the assigned external dispute resolution body.';
    }

    // ─── DEDUPLICATION: skip if a timeline event with the same title already
    // exists for this case on today's date — prevents repeated status toggles
    // from stacking duplicate entries. ───
    const today = new Date().toISOString().split('T')[0];
    const existing = await base44.asServiceRole.entities.TimelineEvent.filter({ case_id: caseId, title: eventConfig.title, event_date: today });
    if (existing.length > 0) {
      return Response.json({ skipped: 'Duplicate timeline event already exists for today' });
    }

    // Create timeline event for status change
    const timelineEvent = {
      case_id: caseId,
      title: eventConfig.title,
      description,
      event_date: today,
      event_type: eventConfig.type,
      is_action_required: eventConfig.type === 'action_required',
    };

    await base44.asServiceRole.entities.TimelineEvent.create(timelineEvent);
    
    return Response.json({ 
      success: true, 
      timeline_event: timelineEvent,
      status_change: { from: oldStatus, to: newStatus }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});