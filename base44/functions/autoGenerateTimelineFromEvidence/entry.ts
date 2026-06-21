import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Supports two call modes:
    // 1. Direct UI invocation: { caseId: "..." }
    // 2. Entity automation: { event: { type, ... }, data: { case_id, ... } }
    const isDirectCall = !!body.caseId;
    const caseId = isDirectCall ? body.caseId : body.data?.case_id;

    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    // For entity automation: only process create events
    if (!isDirectCall && body.event?.type !== 'create') {
      return Response.json({ skipped: 'Not a create event' });
    }

    // Auth check for direct UI calls
    if (isDirectCall) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch case
    const caseItem = await base44.asServiceRole.entities.Case.get(caseId);
    if (!caseItem) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch all evidence for this case
    const evidenceList = await base44.asServiceRole.entities.Evidence.filter({ case_id: caseId });

    let createdCount = 0;

    if (isDirectCall) {
      // Direct call: AI-generate timeline from all case data + evidence
      const extractedSummaries = evidenceList
        .filter(ev => ev.extracted_text || ev.extracted_data?.document_summary)
        .map(ev => ev.extracted_text?.slice(0, 500) || ev.extracted_data?.document_summary)
        .slice(0, 5)
        .join('\n\n');

      const prompt = `You are an Australian consumer advocacy case manager. Generate a chronological timeline of events for this dispute.

CASE DETAILS:
Title: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'Unknown'}
Category: ${caseItem.category || 'other'}
Issue Summary: ${caseItem.issue_summary || 'Not specified'}
Incident Date: ${caseItem.incident_date || 'Unknown'}
Status: ${caseItem.status || 'draft'}
Desired Outcome: ${caseItem.desired_outcome || 'Not specified'}

DOCUMENT CONTEXT:
${extractedSummaries || 'No documents uploaded yet'}

Generate 5-12 timeline events covering the lifecycle of this dispute.
Include:
- Initial incident
- First complaint sent (if applicable)
- Any responses received
- Follow-up actions
- Upcoming deadlines
- Escalation steps if relevant

For events with no specific date, set event_date to null.
Return as JSON array only.`;

      const schema = {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                event_date: { type: 'string' },
                event_type: { type: 'string' },
                is_action_required: { type: 'boolean' },
              },
            },
          },
        },
      };

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const events = result?.events || [];

      for (const ev of events) {
        if (!ev.title) continue;
        await base44.asServiceRole.entities.TimelineEvent.create({
          case_id: caseId,
          title: String(ev.title).slice(0, 120),
          description: ev.description || '',
          event_date: ev.event_date || undefined,
          event_type: ev.event_type || 'incident',
          is_action_required: !!ev.is_action_required,
        });
        createdCount++;
      }

      return Response.json({ success: true, created: createdCount });

    } else {
      // Automation trigger: create event for uploaded file + any extracted events
      const fileData = body.data;
      await base44.asServiceRole.entities.TimelineEvent.create({
        case_id: caseId,
        title: `Evidence uploaded: ${fileData.file_name}`,
        description: fileData.description || `File type: ${fileData.file_type || 'unknown'}`,
        event_date: fileData.event_date || new Date().toISOString().split('T')[0],
        event_type: 'evidence',
        is_action_required: false,
      });
      createdCount++;

      if (fileData.extracted_data?.timeline_events?.length > 0) {
        for (const ev of fileData.extracted_data.timeline_events) {
          if (!ev.description) continue;
          await base44.asServiceRole.entities.TimelineEvent.create({
            case_id: caseId,
            title: ev.description.slice(0, 80),
            description: ev.description,
            event_date: ev.date || undefined,
            event_type: ev.event_type || 'incident',
            is_action_required: ev.event_type === 'action_required',
          });
          createdCount++;
        }
      }

      return Response.json({ success: true, created: createdCount });
    }

  } catch (error) {
    console.error('autoGenerateTimelineFromEvidence error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});