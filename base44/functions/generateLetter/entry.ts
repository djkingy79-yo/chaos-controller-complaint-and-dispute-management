import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Maps frontend letterType keys to dedicated Case entity fields
const LETTER_FIELD_MAP = {
  letter1: 'first_complaint_letter',
  letter2: 'second_complaint_letter',
  letter3: 'third_complaint_letter',
  accept_offer: 'accept_offer_letter',
  deny_offer: 'deny_offer_letter',
  escalation: 'escalation_letter',
};

// Per-type word limits — tightened to match persona-specific constraints
const WORD_LIMITS = {
  letter1: '400–550 words',
  letter2: '400–550 words',
  letter3: '250–350 words',
  accept_offer: '250–400 words',
  deny_offer: '350–500 words',
  escalation: '800–1,200 words',
};

// Stale lock threshold
const STALE_LOCK_MS = 180000;

// Persona metadata (deterministic — not LLM-generated)
const PERSONAS = {
  letter1: 'professional_complaints_officer',
  letter2: 'forensic_accountant',
  letter3: 'litigator',
  escalation: 'government_investigator',
  accept_offer: 'contract_administrator',
  deny_offer: 'negotiator',
};

const PURPOSES = {
  letter1: 'introduce dispute and request information',
  letter2: 'identify accounting and evidentiary deficiencies',
  letter3: 'state that internal resolution has concluded',
  escalation: 'present case file for regulator investigation',
  accept_offer: 'record settlement terms as binding agreement',
  deny_offer: 'evaluate and reject inadequate offer',
};

// ═══════════════════════════════════════════════════════════════════════════
//  VALIDATION ENGINE — post-generation checks per letter type
//  If validation fails, the letter is regenerated with feedback.
// ═══════════════════════════════════════════════════════════════════════════

function paragraphSimilarity(p1, p2) {
  const strip = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const words1 = new Set(strip(p1));
  const words2 = new Set(strip(p2));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = [...words1].filter(w => words2.has(w));
  return intersection.length / Math.min(words1.size, words2.size);
}

function checkCrossLetterDuplication(text, otherText) {
  const paras = text.split(/\n\n+/).filter(p => p.length > 80);
  const otherParas = otherText.split(/\n\n+/).filter(p => p.length > 80);
  let dupCount = 0;
  for (const para of paras) {
    for (const otherPara of otherParas) {
      if (paragraphSimilarity(para, otherPara) > 0.75) {
        dupCount++;
        break;
      }
    }
  }
  return dupCount;
}

function validateLetter(text, letterType, otherLetters, escalationBody) {
  const failures = [];

  // Universal: AI filler phrases
  const aiPatterns = /\b(i am writing to|i trust this finds you well|i respectfully request|i wish to advise|as previously stated|i appreciate your attention|significant stress|serious concerns|transparency|professionalism)\b/i;
  if (aiPatterns.test(text)) {
    failures.push('Contains banned AI filler phrases.');
  }

  // Universal: placeholder brackets
  if (/\[[^\]]+\]/.test(text)) {
    failures.push('Contains placeholder brackets [like this] — use real data or omit the line.');
  }

  // Letter 1: no allegations, no regulator name, no bullet lists
  if (letterType === 'letter1') {
    if (/\b(failed|failure|breach|violation|violated|non-compliant|non-compliance|misconduct|wrongful|unlawful|illegal)\b/i.test(text)) {
      failures.push('Letter 1 contains allegation language (failed/breach/violation) — prohibited. Frame as requests.');
    }
    if (escalationBody && text.includes(escalationBody)) {
      failures.push('Letter 1 names the escalation body — prohibited at this stage.');
    }
    if (/\n[-•]\s/.test(text)) {
      failures.push('Letter 1 contains bullet lists — write in connected prose.');
    }
  }

  // Letter 2: no speculation, cross-check duplication with Letter 1
  if (letterType === 'letter2') {
    if (otherLetters.letter1) {
      const dupCount = checkCrossLetterDuplication(text, otherLetters.letter1);
      if (dupCount > 0) {
        failures.push(`${dupCount} paragraph(s) duplicated from Letter 1 — Letter 2 must advance, not repeat.`);
      }
    }
    if (/\b(I believe|I think|I feel|it appears|it seems|I suspect)\b/i.test(text)) {
      failures.push('Letter 2 contains speculation — prohibited. Every claim must reference evidence.');
    }
  }

  // Letter 3: staccato, no lists, "you failed" at most once
  if (letterType === 'letter3') {
    const failCount = (text.match(/\byou (have )?(failed|have not|did not)/gi) || []).length;
    if (failCount > 1) {
      failures.push(`"you failed/have not" appears ${failCount} times — maximum 1 allowed in Letter 3.`);
    }
    if (/\n[-•]\s/.test(text)) {
      failures.push('Letter 3 contains bullet lists — write in staccato paragraphs only.');
    }
    const bodyParas = text.split(/\n\n+/).filter(p => p.length > 50 && !p.match(/^(Re:|Dear|Yours|\d)/i));
    for (const para of bodyParas) {
      const sentenceCount = (para.match(/[.!?]+/g) || []).length;
      if (sentenceCount > 4) {
        failures.push('Paragraph exceeds 4 sentences — Letter 3 must be staccato.');
        break;
      }
    }
    if (/\b(please|I would appreciate|I would ask that)\b/i.test(text)) {
      failures.push('Letter 3 contains polite request language — prohibited. State the position, do not ask.');
    }
  }

  // Escalation: no requests, no speculation, must have tabular chronology
  if (letterType === 'escalation') {
    if (/\b(I require|I request|please provide|you must|I ask that|I demand)\b/i.test(text)) {
      failures.push('Escalation letter contains document requests — prohibited. Present evidence only.');
    }
    if (/\b(I believe|I think|I feel|it appears|it seems|I suspect)\b/i.test(text)) {
      failures.push('Escalation letter contains speculation — prohibited. State facts only.');
    }
    if (/\b(deliberately|in bad faith|deceptive|misleading|malicious|fraudulent)\b/i.test(text)) {
      failures.push('Escalation letter contains emotional characterisation — prohibited.');
    }
    if (!/Date.*Event.*Evidence/i.test(text)) {
      failures.push('Escalation letter lacks tabular chronology (Date | Event | Evidence) — required.');
    }
  }

  // Accept: conditional clause required, no emotional language, max 1 threat ref
  if (letterType === 'accept_offer') {
    if (!/conditional upon/i.test(text)) {
      failures.push('Accept letter lacks conditional acceptance clause — must include "conditional upon".');
    }
    if (/\b(pleased|happy|thank you for resolving|appreciate|grateful|delighted)\b/i.test(text)) {
      failures.push('Accept letter contains emotional language — write as contract terms.');
    }
    const threatCount = (text.match(/\b(will lodge|will escalate|will refer|without further notice)\b/gi) || []).length;
    if (threatCount > 1) {
      failures.push(`Accept letter has ${threatCount} threat references — only 1 permitted (conditional clause).`);
    }
  }

  // Reject: numbered reasons, no "doesn't address" pattern, no chronology
  if (letterType === 'deny_offer') {
    if (!/\b1\.\s/.test(text)) {
      failures.push('Reject letter must use numbered reasons (1., 2., 3.) — not "doesn\'t address" lists.');
    }
    const doesntAddressCount = (text.match(/(doesn't|does not|fails to) address/gi) || []).length;
    if (doesntAddressCount >= 3) {
      failures.push(`Reject letter uses "doesn't address" pattern ${doesntAddressCount} times — use numbered structural reasons.`);
    }
    if (/\b(chronology|background|history of the dispute|as stated in my letter dated)\b/i.test(text)) {
      failures.push('Reject letter contains chronology/history — prohibited. Focus only on offer adequacy.');
    }
  }

  // Cross-letter duplication (all types)
  for (const [otherType, otherText] of Object.entries(otherLetters)) {
    if (!otherText || otherType === letterType) continue;
    const dupCount = checkCrossLetterDuplication(text, otherText);
    if (dupCount > 0) {
      failures.push(`${dupCount} paragraph(s) duplicated from ${otherType}.`);
    }
  }

  return { valid: failures.length === 0, failures };
}

// ═══════════════════════════════════════════════════════════════════════════
//  METADATA EXTRACTION — structured data produced alongside each letter
//  Stored on the case in letter_metadata. User never sees it.
//  App uses it for: repetition detection, escalation tracking,
//  executive summaries, regulator-ready timelines.
// ═══════════════════════════════════════════════════════════════════════════

function extractMetadata(text, letterType, validation, otherLetters) {
  // Extract documents referenced
  const docPattern = /itemised (invoice|bill)|settlement (statement|ledger)|costs? disclosure|bank statement|statement of account|file note|time record|correspondence/gi;
  const documentsRequested = [...new Set((text.match(docPattern) || []).map(s => s.toLowerCase().trim()))];

  // Count repeated points across other letters
  let repeatedPoints = 0;
  for (const otherText of Object.values(otherLetters)) {
    if (!otherText) continue;
    repeatedPoints += checkCrossLetterDuplication(text, otherText);
  }

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const totalParas = text.split(/\n\n+/).filter(p => p.length > 80).length;
  const newAllegations = Math.max(0, totalParas - repeatedPoints);

  return {
    persona: PERSONAS[letterType] || 'unknown',
    purpose: PURPOSES[letterType] || 'unknown',
    word_count: wordCount,
    documents_requested: documentsRequested,
    new_allegations: newAllegations,
    repeated_points: repeatedPoints,
    escalation_ready: ['letter3', 'escalation'].includes(letterType),
    validation_passed: validation.valid,
    validation_failures: validation.failures,
    generated_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

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

    // --- FETCH CASE DATA FOR CROSS-VALIDATION ---
    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    const caseData = cases[0];
    if (!caseData) {
      await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
        status: 'failed', completed_at: new Date().toISOString(), error_message: 'Case not found',
      }).catch(() => {});
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    const otherLetters = {
      letter1: caseData.first_complaint_letter,
      letter2: caseData.second_complaint_letter,
      letter3: caseData.third_complaint_letter,
      accept_offer: caseData.accept_offer_letter,
      deny_offer: caseData.deny_offer_letter,
      escalation: caseData.escalation_letter,
    };
    delete otherLetters[letterType];

    // --- BUILD BOUNDED PROMPT ---
    const wordLimit = WORD_LIMITS[letterType] || '600–900 words';
    const boundedPrompt = `${prompt}

STRICT WORD LIMIT: This letter must be ${wordLimit}. Do not exceed the word limit. Do not include unnecessary repetition. Write tightly and forcefully. Every sentence must carry weight. Stop when the point is made.`;

    try {
      // --- GENERATE (ATTEMPT 1) ---
      const aiStart = Date.now();
      let result;
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: boundedPrompt,
          model: 'claude_sonnet_4_6',
        });
      } catch (providerError) {
        const isTransient = providerError.message?.includes('502') || providerError.message?.includes('503') ||
          providerError.message?.includes('504') || providerError.message?.includes('timeout') ||
          providerError.message?.includes('ECONNRESET') || providerError.message?.includes('network');
        await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
          status: 'failed', completed_at: new Date().toISOString(), error_message: providerError.message,
        }).catch(() => {});
        const userMessage = isTransient
          ? 'AI service was temporarily unavailable. Your case is safe. Please retry.'
          : 'Letter generation failed. Your case is safe. Please retry.';
        console.error(`[generateLetter] PROVIDER ERROR — ${providerError.message}`);
        return Response.json({ error: userMessage }, { status: isTransient ? 503 : 500 });
      }
      const aiMs = Date.now() - aiStart;

      console.log(`[generateLetter] AI complete (attempt 1) — length: ${result?.length ?? 0}, took: ${aiMs}ms`);

      if (!result || !result.trim()) {
        throw new Error('AI returned empty content. Please try again.');
      }

      // --- VALIDATE (ATTEMPT 1) ---
      let validation = validateLetter(result, letterType, otherLetters, caseData.escalation_body);
      console.log(`[generateLetter] Validation (attempt 1) — valid: ${validation.valid}, failures: ${validation.failures.length}`);

      // --- REGENERATE IF VALIDATION FAILED (ATTEMPT 2 — max 1 retry) ---
      if (!validation.valid) {
        console.log(`[generateLetter] Validation failed — regenerating with feedback. Failures: ${validation.failures.join('; ')}`);

        const feedbackPrompt = `${boundedPrompt}

VALIDATION FAILURES — the previous draft was rejected for these reasons:
${validation.failures.map(f => '- ' + f).join('\n')}

Rewrite the letter to fix ALL of these failures. Do not repeat the errors. Ensure every rule in the PROHIBITED SCOPE, STRUCTURAL RULES, and FORBIDDEN LANGUAGE sections is strictly followed.`;

        try {
          const regenStart = Date.now();
          const regenResult = await base44.integrations.Core.InvokeLLM({
            prompt: feedbackPrompt,
            model: 'claude_sonnet_4_6',
          });
          const regenMs = Date.now() - regenStart;
          console.log(`[generateLetter] AI complete (attempt 2 / regeneration) — length: ${regenResult?.length ?? 0}, took: ${regenMs}ms`);

          if (regenResult && regenResult.trim()) {
            result = regenResult;
            validation = validateLetter(result, letterType, otherLetters, caseData.escalation_body);
            console.log(`[generateLetter] Validation (attempt 2) — valid: ${validation.valid}, failures: ${validation.failures.length}`);
          }
        } catch (regenError) {
          console.error(`[generateLetter] Regeneration failed — using attempt 1 result. Error: ${regenError.message}`);
          // Keep attempt 1 result — it's still usable, just not perfect
        }
      }

      // --- EXTRACT METADATA ---
      const metadata = extractMetadata(result, letterType, validation, otherLetters);

      // --- SAVE LETTER + METADATA ---
      const existingMetadata = caseData.letter_metadata || {};
      await base44.asServiceRole.entities.Case.update(caseId, {
        [field]: result,
        letter_metadata: { ...existingMetadata, [letterType]: metadata },
      });
      console.log(`[generateLetter] DB save complete — field: ${field}, caseId: ${caseId}, metadata stored`);

      // Clear stale flag if present
      if (caseData.stale_letters?.includes(letterType)) {
        await base44.asServiceRole.entities.Case.update(caseId, {
          stale_letters: caseData.stale_letters.filter((k) => k !== letterType),
        }).catch(() => {});
      }

      await base44.asServiceRole.entities.LetterGenerationLock.update(lock.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      console.log(`[generateLetter] DONE — letter: ${letterType}, valid: ${validation.valid}`);
      return Response.json({
        result,
        aiMs,
        saved: true,
        validation: { valid: validation.valid, failures: validation.failures },
        metadata,
      });

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