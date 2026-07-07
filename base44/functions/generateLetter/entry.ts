import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Maps frontend letterType keys to dedicated Case entity fields (NOT the legacy complaint_letter fields)
const LETTER_FIELD_MAP = {
  letter1: 'first_complaint_letter',
  letter2: 'second_complaint_letter',
  letter3: 'third_complaint_letter',
  accept_offer: 'accept_offer_letter',
  deny_offer: 'deny_offer_letter',
  escalation: 'escalation_letter',
};

// Per-type word limits injected into the prompt
const WORD_LIMITS = {
  letter1: '400–550 words',
  letter2: '400–550 words',
  letter3: '250–350 words',
  accept_offer: '250–400 words',
  deny_offer: '350–500 words',
  escalation: '800–1,200 words',
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
    const existingLocks = await base44.asServiceRole.entities.LetterGenerationLock.filter({
      case_id: caseId,
      letter_type: letterType,
    });

    const activeLock = existingLocks.find(l => {
      if (l.status !== 'generating') return false;
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

    // --- CREATE LOCK ---
    const lock = await base44.asServiceRole.entities.LetterGenerationLock.create({
      case_id: caseId,
      letter_type: letterType,
      status: 'generating',
      started_at: new Date().toISOString(),
    });

    console.log(`[generateLetter] START — user: ${user.id}, caseId: ${caseId}, letterType: ${letterType}, field: ${field}, lockId: ${lock.id}`);

    // Append strict word-limit instruction to every prompt
    const wordLimit = WORD_LIMITS[letterType] || '600–900 words';
    const boundedPrompt = `${prompt}

STRICT WORD LIMIT: This letter must be ${wordLimit}. Do not exceed the word limit. Do not include unnecessary repetition. Do not restate the entire evidence history unless directly relevant. Write tightly and forcefully. Every sentence must carry weight. Stop when the point is made.`;

    try {
      const aiStart = Date.now();
      let result;
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: boundedPrompt,
          model: 'claude_sonnet_4_6',
        });
      } catch (providerError) {
        // Classify transient upstream errors and release lock so retry creates a fresh attempt
        const isTransient = providerError.message?.includes('502') || providerError.message?.includes('503') ||
          providerError.message?.includes('504') || providerError.message?.includes('timeout') ||
          providerError.message?.includes('ECONNRESET') || providerError.message?.includes('network');
        await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: providerError.message,
        }).catch(() => {});
        const userMessage = isTransient
          ? 'AI service was temporarily unavailable. Your case is safe. Please retry.'
          : 'Letter generation failed. Your case is safe. Please retry.';
        console.error(`[generateLetter] PROVIDER ERROR — ${providerError.message}`);
        return Response.json({ error: userMessage }, { status: isTransient ? 503 : 500 });
      }
      const aiMs = Date.now() - aiStart;

      console.log(`[generateLetter] AI complete — length: ${result?.length ?? 0}, took: ${aiMs}ms`);

      if (!result || !result.trim()) {
        throw new Error('AI returned empty content. Please try again.');
      }

      // Save to dedicated field — never complaint_letter
      await base44.asServiceRole.entities.Case.update(caseId, { [field]: result });
      console.log(`[generateLetter] DB save complete — field: ${field}, caseId: ${caseId}`);

      await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      return Response.json({ result, aiMs, saved: true });

    } catch (aiError) {
      await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: aiError.message,
      }).catch(() => {});

      console.error(`[generateLetter] AI ERROR — ${aiError.message}`);
      return Response.json({ error: aiError.message || 'Generation failed' }, { status: 500 });
    }

  } catch (error) {
    console.error(`[generateLetter] FATAL — ${error.message}`, error.stack);
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
});