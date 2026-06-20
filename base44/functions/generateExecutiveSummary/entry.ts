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

    // Build context for AI
    const evidenceList = evidence.map(e => 
      `- ${e.file_name} (${e.file_type || 'unknown'}): ${e.description || e.extracted_data?.document_summary || 'No description'}`
    ).join('\n');

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

    // Generate executive summary using AI
    const prompt = `You are a professional legal case analyst. Generate a concise one-page executive summary for this consumer dispute case.

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

Generate a professional executive summary with these sections:
1. **Case Overview** (2-3 sentences): Summarize the core dispute, who is involved, and current status
2. **Key Issues** (3-5 bullet points): List the main legal/practical issues
3. **Evidence Highlights** (2-4 bullet points): Mention the most critical evidence and what it shows
4. **Next Steps** (3-5 bullet points): Recommend immediate actions based on case status and missing items
5. **Critical Deadlines** (if any): List urgent upcoming deadlines

Keep it concise, professional, and actionable. Use Australian English spelling. Focus on what matters most for quick decision-making.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "2-3 sentence case overview" },
          key_issues: { type: "array", items: { type: "string" }, description: "3-5 key issues as bullet points" },
          evidence_highlights: { type: "array", items: { type: "string" }, description: "2-4 evidence highlights" },
          next_steps: { type: "array", items: { type: "string" }, description: "3-5 recommended next steps" },
          critical_deadlines: { type: "array", items: { type: "string" }, description: "Urgent deadlines if any" }
        },
        required: ["summary", "key_issues", "evidence_highlights", "next_steps"]
      }
    });

    return Response.json({
      success: true,
      summary: aiResponse
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});