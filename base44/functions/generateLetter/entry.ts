import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Maps frontend letterType keys to Case entity field names
const LETTER_FIELD_MAP = {
  letter1: 'complaint_letter',
  letter2: 'complaint_letter_2',
  letter3: 'complaint_letter_3',
  accept_offer: 'letter_accept_offer',
  deny_offer: 'letter_deny_offer',
  escalation: 'letter_escalation',
};

// Stale lock threshold — if a lock is older than this, treat it as abandoned and allow retry
const STALE_LOCK_MS = 180000; // 3 minutes

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

    // --- GENERATION LOCK CHECK ---
    // Prevent duplicate AI calls for the same case + letter type
    const existingLocks = await base44.asServiceRole.entities.LetterGenerationLock.filter({
      case_id: caseId,
      letter_type: letterType,
    });

    const activeLock = existingLocks.find(l => {
      if (l.status !== 'generating') return false;
      // Treat locks older than STALE_LOCK_MS as abandoned (crashed generation)
      const age = Date.now() - new Date(l.started_at).getTime();
      return age < STALE_LOCK_MS;
    });

    if (activeLock) {
      console.log(`[generateLetter] LOCKED — case: ${caseId}, letter: ${letterType}, lock age: ${Math.round((Date.now() - new Date(activeLock.started_at).getTime()) / 1000)}s`);
      return Response.json({
        status: 'generating',
        message: 'Letter is still generating. Please wait.',
        existing: true,
      }, { status: 202 });
    }

    // Check if already completed — return saved letter without re-running AI
    const caseRecord = await base44.asServiceRole.entities.Case.get(caseId);
    if (caseRecord && caseRecord[field] && caseRecord[field].trim()) {
      // Only return cached if there's no active regen request (prompt length > 500 = real regen, not a check)
      // We don't block regeneration — the user explicitly chose to regenerate
      // So we only short-circuit on first-time generates where letter already exists
      // (This path is hit if frontend refreshed after backend saved but before frontend knew)
    }

    // --- CREATE LOCK ---
    const lock = await base44.asServiceRole.entities.LetterGenerationLock.create({
      case_id: caseId,
      letter_type: letterType,
      status: 'generating',
      started_at: new Date().toISOString(),
    });

    console.log(`[generateLetter] START — user: ${user.id}, caseId: ${caseId}, letterType: ${letterType}, lockId: ${lock.id}, promptBytes: ${new TextEncoder().encode(prompt).length}`);

    let result = null;
    try {
      const aiStart = Date.now();
      result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });
      const aiMs = Date.now() - aiStart;

      console.log(`[generateLetter] AI complete — length: ${result?.length ?? 0}, took: ${aiMs}ms`);

      if (!result || !result.trim()) {
        throw new Error('AI returned empty content. Please try again.');
      }

      // Save letter to Case record — persists even if frontend timed out
      await base44.asServiceRole.entities.Case.update(caseId, { [field]: result });
      console.log(`[generateLetter] DB save complete — field: ${field}, caseId: ${caseId}`);

      // Mark lock completed
      await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      return Response.json({ result, aiMs, saved: true });

    } catch (aiError) {
      // Mark lock failed so Retry is allowed
      await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: aiError.message,
      }).catch(() => {}); // best-effort

      console.error(`[generateLetter] AI ERROR — ${aiError.message}`);
      return Response.json({ error: aiError.message || 'Generation failed' }, { status: 500 });
    }

  } catch (error) {
    console.error(`[generateLetter] FATAL — ${error.message}`, error.stack);
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
});