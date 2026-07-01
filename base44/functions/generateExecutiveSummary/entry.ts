import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { caseId } = body;
    if (!caseId) return Response.json({ error: 'Missing caseId' }, { status: 400 });

    console.log('CASE SUMMARY START', { caseId, userId: user.id });

    const caseResults = await base44.entities.Case.filter({ id: caseId });
    const caseItem = caseResults?.[0];
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    const [evidence, events, deadlines, checklists] = await Promise.all([
      base44.entities.Evidence.filter({ case_id: caseId }),
      base44.entities.TimelineEvent.filter({ case_id: caseId }, '-event_date'),
      base44.entities.Deadline.filter({ case_id: caseId }),
      base44.entities.ChecklistItem.filter({ case_id: caseId }),
    ]);

    // Truncate OCR text to prevent payload oversize (max 800 chars per doc)
    const evidenceList = evidence.map(e => {
      const ocrSnippet = e.extracted_text ? e.extracted_text.slice(0, 800) : null;
      const extractedSummary = e.extracted_data?.document_summary || null;
      const amounts = (e.extracted_data?.key_amounts || []).join(', ');
      const dates = (e.extracted_data?.dates_mentioned || []).join(', ');
      return `- ${e.file_name} (${e.file_type || 'unknown'}): ${e.description || ''}${extractedSummary ? '\n  Summary: ' + extractedSummary : ''}${amounts ? '\n  Amounts: ' + amounts : ''}${dates ? '\n  Dates: ' + dates : ''}${ocrSnippet ? '\n  OCR: ' + ocrSnippet : ''}`;
    }).join('\n\n');

    const timelineSummary = events.slice(0, 20).map(e =>
      `- ${e.event_date || 'unknown date'}: ${e.title} — ${(e.description || '').slice(0, 200)}`
    ).join('\n');

    const deadlineLines = deadlines
      .filter(d => d.status === 'pending' && d.deadline_date)
      .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
      .slice(0, 8)
      .map(d => `- ${d.title}: ${d.deadline_date} [${d.deadline_type || 'deadline'}, ${d.responsibility || 'user'}]`)
      .join('\n');

    const missingItems = checklists
      .filter(c => c.status === 'missing' || c.status === 'needs_review')
      .map(c => `- ${c.label}`)
      .join('\n');

    const letters = [
      caseItem.complaint_letter ? '1st Complaint Letter: exists' : null,
      caseItem.complaint_letter_2 ? '2nd Complaint Letter: exists' : null,
      caseItem.complaint_letter_3 ? '3rd Complaint Letter: exists' : null,
      caseItem.letter_accept_offer ? 'Accept Offer Letter: exists' : null,
      caseItem.letter_deny_offer ? 'Deny Offer Letter: exists' : null,
      caseItem.letter_escalation ? 'Escalation Letter: exists' : null,
    ].filter(Boolean).join('\n') || 'No letters generated yet';

    const contextSize = evidenceList.length + timelineSummary.length + deadlineLines.length;
    console.log('CASE SUMMARY CONTEXT SIZE', { contextSize, evidenceCount: evidence.length, eventsCount: events.length, deadlinesCount: deadlines.length });

    const prompt = `You are a professional legal/consumer dispute analyst in Australia. Generate a comprehensive case summary report.

CASE DETAILS:
Title: ${caseItem.title}
Category: ${caseItem.category}
Status: ${caseItem.status}
Priority: ${caseItem.priority}
Incident Date: ${caseItem.incident_date || 'not specified'}
Organisation: ${caseItem.organisation_name || 'not specified'}
Escalation Body: ${caseItem.escalation_body || 'not specified'}
Account #: ${caseItem.account_number || 'not specified'}
Notes: ${(caseItem.notes || '').slice(0, 500)}

COMPLAINANT:
Name: ${caseItem.complainant_name || 'not specified'}
Email: ${caseItem.complainant_email || 'not specified'}

ISSUE:
${caseItem.issue_summary || 'not provided'}

DETAILS:
${(caseItem.issue_details || '').slice(0, 1000)}

DESIRED OUTCOME:
${caseItem.desired_outcome || 'not specified'}

LETTERS GENERATED:
${letters}

EVIDENCE (${evidence.length} files):
${evidenceList || 'None uploaded'}

TIMELINE (${events.length} events):
${timelineSummary || 'No events'}

DEADLINES:
${deadlineLines || 'None recorded'}

OUTSTANDING ACTION ITEMS:
${missingItems || 'None'}

Generate a structured report with these exact sections. Use Australian English. Be specific, actionable, professional.`;

    console.log('CASE SUMMARY AI REQUEST SENT', { promptLength: prompt.length, model: 'gemini_3_1_pro' });

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          case_overview: { type: 'string', description: '3-4 sentence overview of the dispute, parties, and current status' },
          facts: { type: 'array', items: { type: 'string' }, description: '4-6 established facts of the case' },
          timeline_summary: { type: 'string', description: '2-3 sentence summary of chronological events' },
          evidence_summary: { type: 'array', items: { type: 'string' }, description: '3-5 key evidence points and what they prove' },
          issues_identified: { type: 'array', items: { type: 'string' }, description: '3-5 legal or factual issues identified' },
          strengths: { type: 'array', items: { type: 'string' }, description: '3-4 strengths of the case' },
          weaknesses: { type: 'array', items: { type: 'string' }, description: '2-4 weaknesses or risks' },
          missing_evidence: { type: 'array', items: { type: 'string' }, description: 'Evidence gaps that should be addressed' },
          next_actions: { type: 'array', items: { type: 'string' }, description: '4-6 recommended immediate next actions' },
          escalation_path: { type: 'string', description: 'Recommended escalation route if unresolved (e.g. ombudsman, tribunal, court)' },
        },
        required: ['case_overview', 'facts', 'issues_identified', 'strengths', 'next_actions', 'escalation_path'],
      },
    });

    console.log('CASE SUMMARY AI RESPONSE RECEIVED', { hasResponse: !!aiResponse, keys: Object.keys(aiResponse || {}) });

    // Save to database
    await base44.entities.Case.update(caseId, {
      executive_summary: JSON.stringify(aiResponse),
    });

    console.log('CASE SUMMARY DATABASE SAVED', { caseId });

    return Response.json({ success: true, summary: aiResponse });
  } catch (error) {
    console.error('CASE SUMMARY GENERATION FAILED', { message: error.message, stack: error.stack });
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
});