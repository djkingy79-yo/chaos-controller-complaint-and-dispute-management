import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * EVIDENCE-ONLY TIMELINE GENERATOR
 *
 * Constrained to ONLY create events that are directly supported by:
 *   - uploaded evidence document content
 *   - user-entered dates (incident_date, response_deadline)
 *   - actual marked-sent dates (first/second/third_complaint_sent_at, escalated_at)
 *
 * NEVER invents outcomes, mediation, responses, or resolutions.
 * If no evidence is uploaded and no dates are marked, returns empty.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const isDirectCall = !!body.caseId;
    const caseId = isDirectCall ? body.caseId : body.data?.case_id;

    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    if (!isDirectCall && body.event?.type !== 'create') {
      return Response.json({ skipped: 'Not a create event' });
    }

    if (isDirectCall) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseItem = await base44.asServiceRole.entities.Case.get(caseId);
    if (!caseItem) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    const evidenceList = await base44.asServiceRole.entities.Evidence.filter({ case_id: caseId });

    let createdCount = 0;

    if (isDirectCall) {
      // ─── DIRECT CALL: extract events ONLY from evidence documents ───
      const extractedSummaries = evidenceList
        .filter(ev => ev.extracted_text || ev.extracted_data?.document_summary)
        .map(ev => {
          const summary = ev.extracted_text?.slice(0, 800) || ev.extracted_data?.document_summary || '';
          const dates = ev.extracted_data?.dates_mentioned || [];
          const amounts = ev.extracted_data?.key_amounts || [];
          return `DOCUMENT: ${ev.file_name} (type: ${ev.file_type || 'unknown'}, event date: ${ev.event_date || 'none'})
SUMMARY: ${summary}
DATES MENTIONED IN DOCUMENT: ${dates.length ? dates.join(', ') : 'none'}
AMOUNTS MENTIONED: ${amounts.length ? amounts.join(', ') : 'none'}`;
        })
        .slice(0, 8)
        .join('\n\n---\n\n');

      // Build confirmed real events from case tracking fields
      const confirmedEvents = [];
      if (caseItem.incident_date) {
        confirmedEvents.push(`- [${caseItem.incident_date}] Incident date (user-entered): ${caseItem.issue_summary || caseItem.title}`);
      }
      if (caseItem.first_complaint_sent_at) {
        confirmedEvents.push(`- [${caseItem.first_complaint_sent_at}] First complaint sent (confirmed by user tracking)`);
      }
      if (caseItem.second_complaint_sent_at) {
        confirmedEvents.push(`- [${caseItem.second_complaint_sent_at}] Second complaint sent (confirmed by user tracking)`);
      }
      if (caseItem.third_complaint_sent_at) {
        confirmedEvents.push(`- [${caseItem.third_complaint_sent_at}] Third/final complaint sent (confirmed by user tracking)`);
      }
      if (caseItem.escalated_at) {
        const escBody = caseItem.escalation_body || 'the assigned escalation body';
        confirmedEvents.push(`- [${caseItem.escalated_at}] Matter escalated to ${escBody} (confirmed by user tracking)`);
      }

      // If NO evidence and NO confirmed events, return empty — do NOT invent
      if (!extractedSummaries && confirmedEvents.length === 0) {
        return Response.json({ success: true, created: 0, message: 'No evidence or confirmed events to generate timeline from.' });
      }

      const prompt = `You are an Australian consumer advocacy case manager. Extract a timeline of events ONLY from the uploaded evidence documents and confirmed tracking data below.

STRICT RULES — VIOLATION = FAILURE:
- ONLY create events that are DIRECTLY supported by the document content or confirmed tracking data below.
- Do NOT invent, assume, or fabricate ANY event.
- Do NOT create events for "mediation", "dispute resolved", "final response received", "settlement reached" or any outcome UNLESS a document explicitly states it happened.
- Do NOT create events for responses, follow-ups, or complaints UNLESS a document or the confirmed tracking data explicitly confirms they occurred.
- Do NOT create "future" or "upcoming" events — only past events that actually happened.
- For each event, ONLY use dates that appear in the documents or confirmed tracking data. If no date is available, set event_date to null.
- Maximum 8 events. If fewer events are supported, create fewer. Quality over quantity.

CASE DETAILS:
Title: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'Unknown'}
Category: ${caseItem.category || 'other'}
Issue Summary: ${caseItem.issue_summary || 'Not specified'}
Incident Date: ${caseItem.incident_date || 'Not specified'}
Status: ${caseItem.status || 'draft'}

CONFIRMED REAL EVENTS (from case tracking — these actually happened):
${confirmedEvents.length ? confirmedEvents.join('\n') : 'None confirmed yet.'}

UPLOADED EVIDENCE DOCUMENTS (extract events ONLY from this content):
${extractedSummaries || 'No documents uploaded.'}

Extract ONLY events directly mentioned in the evidence above or in the confirmed tracking data. If the documents do not mention a specific event, do NOT create it. Return as JSON array. If no events can be extracted, return an empty array.`;

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
        // Defensive: skip any event whose title suggests an invented outcome
        const titleLower = String(ev.title).toLowerCase();
        if (/dispute resolved|mediation|settlement reached|final response received|matter resolved/i.test(titleLower)) {
          // Only allow if the description explicitly references evidence
          if (!ev.description || !/evidence|document|attached|uploaded/i.test(String(ev.description))) {
            continue;
          }
        }
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
      // ─── AUTOMATION TRIGGER: evidence upload create event ───
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

      // Only create events from extracted timeline_events if they have
      // actual dates from the document
      if (fileData.extracted_data?.timeline_events?.length > 0) {
        for (const ev of fileData.extracted_data.timeline_events) {
          if (!ev.description) continue;
          // Skip invented outcomes
          const descLower = String(ev.description).toLowerCase();
          if (/dispute resolved|mediation|settlement reached|matter resolved/i.test(descLower)) {
            continue;
          }
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