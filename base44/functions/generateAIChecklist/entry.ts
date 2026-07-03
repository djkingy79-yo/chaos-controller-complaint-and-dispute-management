import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const { event: automationEvent, data: automationData, caseId: manualCaseId } = body;

    // Determine caseId — from automation trigger or manual frontend call
    let caseId = manualCaseId;
    let caseItem;

    if (automationEvent?.entity_name === 'Case') {
      // Entity automation path — use service role
      caseId = automationEvent.entity_id || automationData?.id;
      if (!caseId) return Response.json({ skipped: 'no case id' });
      const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
      caseItem = cases[0];
    } else {
      // Frontend call — requires auth
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!caseId) return Response.json({ error: 'Case ID required' }, { status: 400 });
      const cases = await base44.entities.Case.filter({ id: caseId });
      caseItem = cases[0];
    }

    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    const pathway = caseItem.complaint_pathway || {};
    const escalationBody = caseItem.escalation_body || 'the relevant external dispute resolution body for this case type';

    const prompt = `You are an expert Australian consumer advocacy case manager. Generate a comprehensive checklist of required steps for resolving a ${caseItem.category} dispute.

CASE DETAILS:
- Category: ${caseItem.category}
- State/Territory: ${caseItem.state || 'not confirmed'}
- Organisation: ${caseItem.organisation_name || 'Unknown'}
- Issue: ${caseItem.issue_summary || caseItem.issue_details || 'Not specified'}
- Incident Date: ${caseItem.incident_date || 'Not specified'}
- Current Status: ${caseItem.status}

ASSIGNED COMPLAINT PATHWAY (use ONLY these bodies — never substitute or invent another):
- Internal Complaint: ${pathway.internalComplaint || 'not applicable'}
- Regulator: ${pathway.regulator || 'not applicable'}
- Ombudsman: ${pathway.ombudsman || 'not applicable'}
- Tribunal: ${pathway.tribunal || 'not applicable'}
- Court: ${pathway.court || 'not applicable'}
- Support Services: ${(pathway.supportServices || []).join(', ') || 'none'}
- Combined Escalation Body (for display text): ${escalationBody}

Use ONLY the assigned complaint pathway above for this case. Do not invent or substitute AFCA, TIO, NCAT, Fair Trading, an ombudsman, tribunal or regulator unless it appears in the assigned complaint pathway. Never write generic placeholders like "relevant ombudsman", "external dispute resolution body", "tribunal or regulator" or "complaint authority" — always name the actual assigned body.

Based on Australian consumer law and the specific industry (${caseItem.category}), generate a detailed checklist of 10-15 essential steps. Include:
1. Evidence gathering specific to ${caseItem.category}
2. Mandatory waiting periods (21 days for response, 45 days for escalation)
3. Internal complaint steps (initial, follow-up, final letter)
4. External escalation step — MUST name the exact bodies from the assigned complaint pathway above. Do NOT list alternative bodies.
5. Deadline tracking and documentation requirements

For each item specify:
- label: Specific action description
- category: complaint|evidence|response|deadline|escalation|document
- estimated_days: days from case creation to complete
- requires_proof: true/false
- priority: critical|high|medium|low`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

    // ─── DEDUPLICATION: purge all existing checklist items + AI-generated
    // deadlines for this case BEFORE creating the new set. Without this,
    // every re-generation stacks a second full set on top of the old one,
    // producing duplicated steps that reference stale authorities. ───
    await base44.asServiceRole.entities.ChecklistItem.deleteMany({ case_id: caseId });
    await base44.asServiceRole.entities.Deadline.deleteMany({ case_id: caseId, notes: { $regex: "AI-generated", $options: "i" } });

    const createdItems = [];
    const caseCreatedDate = new Date(caseItem.created_date);
    const seenLabels = new Set();

    for (const item of checklistItems) {
      // Skip duplicate labels within the same generation batch (defensive —
      // the LLM occasionally emits two near-identical steps with slight
      // wording changes)
      const normalisedLabel = String(item.label || '').trim().toLowerCase();
      if (seenLabels.has(normalisedLabel)) continue;
      seenLabels.add(normalisedLabel);
      const deadlineDate = new Date(caseCreatedDate);
      deadlineDate.setDate(deadlineDate.getDate() + (item.estimated_days || 0));

      const checklistItem = await base44.asServiceRole.entities.ChecklistItem.create({
        case_id: caseId,
        label: item.label,
        category: item.category,
        status: "missing",
        priority: item.priority || "medium",
        requires_proof: item.requires_proof,
        notes: `Target: ${deadlineDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`
      });
      createdItems.push(checklistItem);

      if (item.priority === 'critical' || item.priority === 'high') {
        await base44.asServiceRole.entities.Deadline.create({
          case_id: caseId,
          title: item.label,
          deadline_date: deadlineDate.toISOString().split('T')[0],
          deadline_type: item.category === 'deadline' ? 'submission' : item.category === 'escalation' ? 'escalation_window' : 'response_due',
          responsibility: item.category === 'response' ? 'provider' : 'user',
          status: 'pending',
          notes: `AI-generated. Priority: ${item.priority}`
        });
      }
    }

    return Response.json({ success: true, items_created: createdItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});