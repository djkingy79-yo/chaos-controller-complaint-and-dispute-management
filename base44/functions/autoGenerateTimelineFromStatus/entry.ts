import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const statusEventMap = {
  draft: { type: 'action_required', title: 'Case created', description: 'Case file opened and ready for evidence collection' },
  complaint_sent: { type: 'complaint', title: 'Complaint sent', description: 'Formal complaint letter sent to organisation' },
  awaiting_response: { type: 'action_required', title: 'Awaiting response', description: 'Waiting for organisation to respond to complaint' },
  response_received: { type: 'response', title: 'Response received', description: 'Organisation has responded to the complaint' },
  escalation_ready: { type: 'action_required', title: 'Ready for escalation', description: 'Case ready to escalate to external body (ombudsman/tribunal)' },
  escalated: { type: 'escalation', title: 'Case escalated', description: 'Matter escalated to external dispute resolution body' },
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
    
    // Create timeline event for status change
    const timelineEvent = {
      case_id: caseId,
      title: eventConfig.title,
      description: eventConfig.description,
      event_date: new Date().toISOString().split('T')[0],
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