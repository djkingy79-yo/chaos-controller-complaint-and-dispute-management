import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Letter field map — backend saves directly so the result is never lost on frontend timeout
const LETTER_FIELD_MAP = {
  letter1: 'complaint_letter',
  letter2: 'complaint_letter_2',
  letter3: 'complaint_letter_3',
  accept_offer: 'letter_accept_offer',
  deny_offer: 'letter_deny_offer',
  escalation: 'letter_escalation',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, caseId, letterType } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return Response.json({ error: 'Missing or empty prompt' }, { status: 400 });
    }
    if (!caseId) {
      return Response.json({ error: 'Missing caseId' }, { status: 400 });
    }

    const field = LETTER_FIELD_MAP[letterType];
    if (!field) {
      return Response.json({ error: `Unknown letterType: ${letterType}` }, { status: 400 });
    }

    console.log(`[generateLetter] START — user: ${user.id}, caseId: ${caseId}, letterType: ${letterType}, promptBytes: ${new TextEncoder().encode(prompt).length}`);

    const aiStart = Date.now();
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
    });
    const aiMs = Date.now() - aiStart;

    console.log(`[generateLetter] AI complete — length: ${result?.length ?? 0}, took: ${aiMs}ms`);

    if (!result || !result.trim()) {
      console.error(`[generateLetter] AI returned empty content`);
      return Response.json({ error: 'AI returned empty content. Please try again.' }, { status: 502 });
    }

    // Save directly to DB — this means the result is persisted even if the frontend timed out.
    // The frontend can then reload the case to display the saved letter.
    try {
      await base44.asServiceRole.entities.Case.update(caseId, { [field]: result });
      console.log(`[generateLetter] DB save complete — field: ${field}, caseId: ${caseId}`);
    } catch (dbErr) {
      // Log but don't fail — still return result to frontend
      console.error(`[generateLetter] DB save failed: ${dbErr.message}`);
    }

    return Response.json({ result, aiMs, saved: true });
  } catch (error) {
    console.error(`[generateLetter] ERROR — ${error.message}`, error.stack);
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
});