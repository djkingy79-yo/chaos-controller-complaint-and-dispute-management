import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { caseId } = body;

    if (!caseId) {
      return Response.json({ error: 'Missing caseId' }, { status: 400 });
    }

    // Get case data
    const caseItem = await base44.entities.Case.get(caseId);
    if (!caseItem) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get all related data
    const [evidence, events, deadlines, checklists] = await Promise.all([
      base44.entities.Evidence.filter({ case_id: caseId }),
      base44.entities.TimelineEvent.filter({ case_id: caseId }, "-event_date"),
      base44.entities.Deadline.filter({ case_id: caseId }),
      base44.entities.ChecklistItem.filter({ case_id: caseId }),
    ]);

    // Build context for AI - include extracted data from evidence
    const evidenceList = evidence.map(e => {
      const extractedInfo = e.extracted_data ? `
    * Summary: ${e.extracted_data.document_summary || 'N/A'}
    * Key dates: ${(e.extracted_data.dates_mentioned || []).join(', ') || 'None'}
    * Key amounts: ${(e.extracted_data.key_amounts || []).join(', ') || 'None'}
    * Account/Policy numbers: ${[...(e.extracted_data.account_numbers || []), ...(e.extracted_data.policy_numbers || [])].join(', ') || 'None'}
  ` : 'No extracted data';
      return `- ${e.file_name} (${e.file_type || 'unknown'})
  Description: ${e.description || 'N/A'}
  ${extractedInfo}`;
    }).join('\n\n');

    const timelineSummary = events.slice(0, 15).map(e => 
      `- ${e.event_date}: ${e.title} - ${e.description || ''}`
    ).join('\n');

    const upcomingDeadlines = deadlines
      .filter(d => d.status === 'pending' && d.deadline_date)
      .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
      .slice(0, 5)
      .map(d => `- ${d.title}: ${d.deadline_date} (${d.deadline_type || 'deadline'})`);

    const missingChecklist = checklists
      .filter(c => c.status === 'missing' || c.status === 'needs_review')
      .map(c => `- ${c.label}`);

    console.log("Case data loaded:", { caseId, evidenceCount: evidence.length, eventsCount: events.length, deadlinesCount: deadlines.length, checklistsCount: checklists.length });
    
    // Generate comprehensive case summary using AI
    const prompt = `You are a professional legal case analyst. Generate a comprehensive yet concise executive summary that gives a complete picture of where this case stands.

CASE DETAILS:
Title: ${caseItem.title}
Organisation: ${caseItem.organisation_name || 'Not specified'}
Category: ${caseItem.category}
Status: ${caseItem.status}
Priority: ${caseItem.priority}
Incident Date: ${caseItem.incident_date || 'Not specified'}

ISSUE SUMMARY:
${caseItem.issue_summary || 'No issue summary provided'}

DESIRED OUTCOME:
${caseItem.desired_outcome || 'Not specified'}

EVIDENCE FILES (${evidence.length} total):
${evidenceList}

TIMELINE EVENTS (most recent first):
${timelineSummary}

${upcomingDeadlines.length > 0 ? 'UPCOMING DEADLINES:\n' + upcomingDeadlines.join('\n') : ''}

${missingChecklist.length > 0 ? 'MISSING/INCOMPLETE ACTION ITEMS:\n' + missingChecklist.join('\n') : ''}

Generate a comprehensive executive summary with these sections:
1. **Case Overview** (3-4 sentences): Summarise the core dispute, parties involved, current status, and stage in the escalation process
2. **Key Issues** (4-6 bullet points): List the main legal, factual, and practical issues - be specific about what went wrong
3. **Evidence Analysis** (3-5 bullet points): Highlight the most critical evidence documents and what each proves or reveals about the case
4. **Correspondence Summary** (2-3 sentences): Summarise the complaint history and any responses received from the organisation
5. **Next Steps** (4-6 bullet points): Recommend immediate and short-term actions based on case status, missing evidence, and upcoming deadlines
6. **Critical Deadlines** (if any): List urgent deadlines within the next 14 days
7. **Case Strength Assessment** (2-3 sentences): Provide a brief, objective assessment of the case's strengths and any potential weaknesses or gaps

Keep it professional, actionable, and easy to scan. Use AUSTRALIAN ENGLISH spelling throughout (organise, recognise, behaviour, colour, programme, centre, licence, defence, offence, summarise, analyse, prioritise, finalise). Focus on giving the user a complete picture of where they stand in 60 seconds or less.`;

    console.log("Invoking LLM for summary generation...");
    
    // Invoke LLM with timeout (90 seconds max)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('LLM timeout: Summary generation took longer than 90 seconds')), 90000)
    );
    
    const llmPromise = base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "3-4 sentence comprehensive case overview" },
          key_issues: { type: "array", items: { type: "string" }, description: "4-6 key issues as bullet points" },
          evidence_analysis: { type: "array", items: { type: "string" }, description: "3-5 evidence highlights with analysis" },
          correspondence_summary: { type: "string", description: "2-3 sentence summary of complaint history" },
          next_steps: { type: "array", items: { type: "string" }, description: "4-6 recommended next steps" },
          critical_deadlines: { type: "array", items: { type: "string" }, description: "Urgent deadlines within 14 days" },
          case_strength_assessment: { type: "string", description: "2-3 sentence objective case assessment" }
        },
        required: ["summary", "key_issues", "evidence_analysis", "next_steps", "case_strength_assessment"]
      }
    });
    
    const aiResponse = await Promise.race([llmPromise, timeoutPromise]);

    console.log("Summary generated successfully");
    return Response.json({
      success: true,
      summary: aiResponse
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});