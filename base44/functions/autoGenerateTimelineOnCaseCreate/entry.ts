import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { event, data } = body;
    
    // Only process create events
    if (event.type !== 'create' || !data) {
      return Response.json({ skipped: 'Not a create event or no data' });
    }
    
    const caseId = data.id;
    
    // Create initial timeline event for case creation
    const timelineEvents = [
      {
        case_id: caseId,
        title: `Case opened: ${data.title}`,
        description: `Category: ${data.category || 'unspecified'}. Priority: ${data.priority || 'medium'}`,
        event_date: data.incident_date || new Date().toISOString().split('T')[0],
        event_type: 'incident',
        is_action_required: false,
      }
    ];
    
    // If incident date is provided, create an incident event
    if (data.incident_date && data.incident_date !== new Date().toISOString().split('T')[0]) {
      timelineEvents.push({
        case_id: caseId,
        title: 'Incident occurred',
        description: data.issue_summary || 'Initial incident that led to this dispute',
        event_date: data.incident_date,
        event_type: 'incident',
        is_action_required: false,
      });
    }
    
    // Create all timeline events
    for (const ev of timelineEvents) {
      await base44.asServiceRole.entities.TimelineEvent.create(ev);
    }
    
    return Response.json({ 
      success: true, 
      timeline_events_created: timelineEvents.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});