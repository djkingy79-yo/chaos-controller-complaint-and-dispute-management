import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the trigger data (entity automation payload)
    const body = await req.json();
    const { event, data, old_data } = body;
    
    // Only process create events
    if (event.type !== 'create' || !data) {
      return Response.json({ skipped: 'Not a create event or no data' });
    }
    
    const caseId = data.case_id;
    if (!caseId) {
      return Response.json({ error: 'No case_id in evidence' });
    }
    
    // Get case details
    const caseItem = await base44.asServiceRole.entities.Case.get(caseId);
    if (!caseItem) {
      return Response.json({ error: 'Case not found' });
    }
    
    // Create timeline event for evidence upload
    const timelineEvent = {
      case_id: caseId,
      title: `Evidence uploaded: ${data.file_name}`,
      description: data.description || `File type: ${data.file_type || 'unknown'}`,
      event_date: data.event_date || new Date().toISOString().split('T')[0],
      event_type: 'evidence',
      is_action_required: false,
    };
    
    await base44.asServiceRole.entities.TimelineEvent.create(timelineEvent);
    
    // If AI extracted timeline events exist, create those too
    if (data.extracted_data?.timeline_events && data.extracted_data.timeline_events.length > 0) {
      for (const ev of data.extracted_data.timeline_events) {
        if (!ev.description) continue;
        await base44.asServiceRole.entities.TimelineEvent.create({
          case_id: caseId,
          title: ev.description.slice(0, 80),
          description: ev.description,
          event_date: ev.date || undefined,
          event_type: ev.event_type || 'incident',
          is_action_required: ev.event_type === 'action_required',
        });
      }
    }
    
    return Response.json({ 
      success: true, 
      timeline_event: timelineEvent,
      extracted_events: data.extracted_data?.timeline_events?.length || 0 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});