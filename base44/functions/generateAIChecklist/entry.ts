import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { caseId } = await req.json();
    if (!caseId) return Response.json({ error: 'Case ID required' }, { status: 400 });

    // Get case details
    const cases = await base44.entities.Case.filter({ id: caseId });
    if (!cases || cases.length === 0) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }
    const caseItem = cases[0];

    // AI prompt to generate checklist items based on case category and details
    const prompt = `You are an expert Australian consumer advocacy case manager. Generate a comprehensive checklist of required steps for escalating a ${caseItem.category} dispute.

CASE DETAILS:
- Category: ${caseItem.category}
- Organisation: ${caseItem.organisation_name || 'Unknown'}
- Issue: ${caseItem.issue_summary || caseItem.issue_details || 'Not specified'}
- Incident Date: ${caseItem.incident_date || 'Not specified'}
- Current Status: ${caseItem.status}

Based on Australian consumer law and the specific industry (${caseItem.category}), generate a detailed checklist of 8-15 essential steps required to properly escalate this dispute. Include:

1. Evidence gathering steps (specific documents needed for this industry)
2. Mandatory waiting periods (e.g., 21 days for response, 45 days for escalation)
3. Internal complaint steps
4. External escalation steps (AFCA, TIO, NCAT, etc. as appropriate)
5. Deadline tracking items
6. Documentation requirements

For each checklist item, specify:
- label: Clear action item description
- category: One of [complaint, evidence, response, deadline, escalation, document]
- estimated_days: Number of days from case creation this should be completed (for deadline calculation)
- requires_proof: true/false (whether proof is needed to mark complete)
- priority: One of [critical, high, medium, low]

Return ONLY a valid JSON array of objects with this exact schema:
[
  {
    "label": "string",
    "category": "complaint|evidence|response|deadline|escalation|document",
    "estimated_days": number,
    "requires_proof": boolean,
    "priority": "critical|high|medium|low"
  }
]

Ensure the checklist is specific to ${caseItem.category} disputes and follows Australian regulatory requirements.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          checklist: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                category: { type: "string", enum: ["complaint", "evidence", "response", "deadline", "escalation", "document"] },
                estimated_days: { type: "number" },
                requires_proof: { type: "boolean" },
                priority: { type: "string", enum: ["critical", "high", "medium", "low"] }
              },
              required: ["label", "category", "estimated_days", "requires_proof", "priority"]
            }
          }
        },
        required: ["checklist"]
      }
    });

    const checklistItems = result.checklist || [];

    // Create checklist items in database
    const createdItems = [];
    const caseCreatedDate = new Date(caseItem.created_date);
    
    for (const item of checklistItems) {
      const deadlineDate = new Date(caseCreatedDate);
      deadlineDate.setDate(deadlineDate.getDate() + (item.estimated_days || 0));
      
      const checklistItem = await base44.entities.ChecklistItem.create({
        case_id: caseId,
        label: item.label,
        category: item.category,
        status: "missing",
        requires_proof: item.requires_proof,
        notes: `Priority: ${item.priority}. Due: ${deadlineDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        created_by_id: user.id
      });
      createdItems.push(checklistItem);

      // Create corresponding deadline for critical/high priority items
      if (item.priority === 'critical' || item.priority === 'high') {
        await base44.entities.Deadline.create({
          case_id: caseId,
          title: item.label,
          deadline_date: deadlineDate.toISOString().split('T')[0],
          deadline_type: item.category === 'deadline' ? 'submission' : item.category === 'escalation' ? 'escalation_window' : 'response_due',
          responsibility: item.category === 'response' ? 'provider' : 'user',
          status: 'pending',
          notes: `Checklist item: ${item.label}. Priority: ${item.priority}`,
          created_by_id: user.id
        });
      }
    }

    return Response.json({ 
      success: true, 
      items_created: createdItems.length,
      items: createdItems
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});