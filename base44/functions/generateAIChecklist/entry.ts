import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * DETERMINISTIC CHECKLIST GENERATOR
 *
 * Replaces the old LLM-based generator that produced 10-15 variable steps
 * with duplicate internal complaint loops. This version produces a single
 * clean 9-step escalation pathway using the case's actual escalation body
 * from the routing engine — no AI, no duplication, no internal loops.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const { event: automationEvent, data: automationData, caseId: manualCaseId } = body;

    let caseId = manualCaseId;
    let caseItem;

    if (automationEvent?.entity_name === 'Case') {
      caseId = automationEvent.entity_id || automationData?.id;
      if (!caseId) return Response.json({ skipped: 'no case id' });
      const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
      caseItem = cases[0];
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!caseId) return Response.json({ error: 'Case ID required' }, { status: 400 });
      const cases = await base44.entities.Case.filter({ id: caseId });
      caseItem = cases[0];
    }

    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    const pathway = caseItem.complaint_pathway || {};
    const escalationBody = caseItem.escalation_body || pathway.regulator || 'the assigned escalation body';
    const orgName = caseItem.organisation_name || 'the organisation';

    // ─── CLEAN 9-STEP PATHWAY ───────────────────────────────────────────
    // Single linear sequence: evidence → internal → prepare → lodge →
    // confirm → track → upload → outcome. No duplicate waiting/follow-up
    // loops, no multiple internal complaint rounds.
    const STEPS = [
      { label: `Gather evidence related to the dispute with ${orgName}.`, category: 'evidence', priority: 'critical', requires_proof: true, days: 0 },
      { label: `Confirm all correspondence with ${orgName} is saved and documented.`, category: 'complaint', priority: 'high', requires_proof: true, days: 7 },
      { label: `Generate and send the final internal complaint to ${orgName} if required.`, category: 'complaint', priority: 'high', requires_proof: true, days: 14 },
      { label: `Prepare the complaint for ${escalationBody}.`, category: 'escalation', priority: 'critical', requires_proof: true, days: 21 },
      { label: `Lodge the complaint with ${escalationBody}.`, category: 'escalation', priority: 'critical', requires_proof: true, days: 30 },
      { label: `Save the lodgement confirmation from ${escalationBody}.`, category: 'document', priority: 'high', requires_proof: true, days: 31 },
      { label: `Track the response from ${escalationBody}.`, category: 'response', priority: 'high', requires_proof: false, days: 45 },
      { label: `Upload any correspondence received from ${escalationBody}.`, category: 'evidence', priority: 'medium', requires_proof: true, days: 60 },
      { label: `Record the final outcome of the dispute.`, category: 'document', priority: 'medium', requires_proof: true, days: 90 },
    ];

    // ─── DEDUPLICATION: purge all existing checklist items + AI-generated
    // deadlines for this case BEFORE creating the new set. ───
    await base44.asServiceRole.entities.ChecklistItem.deleteMany({ case_id: caseId });
    await base44.asServiceRole.entities.Deadline.deleteMany({ case_id: caseId, notes: { $regex: "AI-generated", $options: "i" } });

    const createdItems = [];
    const caseCreatedDate = new Date(caseItem.created_date);

    for (const step of STEPS) {
      const deadlineDate = new Date(caseCreatedDate);
      deadlineDate.setDate(deadlineDate.getDate() + step.days);

      const checklistItem = await base44.asServiceRole.entities.ChecklistItem.create({
        case_id: caseId,
        label: step.label,
        category: step.category,
        status: "missing",
        priority: step.priority,
        requires_proof: step.requires_proof,
        notes: `Target: ${deadlineDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`
      });
      createdItems.push(checklistItem);

      // Create deadlines only for critical/high priority steps
      if (step.priority === 'critical' || step.priority === 'high') {
        await base44.asServiceRole.entities.Deadline.create({
          case_id: caseId,
          title: step.label,
          deadline_date: deadlineDate.toISOString().split('T')[0],
          deadline_type: step.category === 'escalation' ? 'escalation_window' : step.category === 'deadline' ? 'submission' : 'response_due',
          responsibility: step.category === 'response' ? 'provider' : 'user',
          status: 'pending',
          notes: `AI-generated. Priority: ${step.priority}`
        });
      }
    }

    return Response.json({ success: true, items_created: createdItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});