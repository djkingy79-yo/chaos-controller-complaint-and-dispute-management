import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    return Response.json({ result, aiMs });
  } catch (error) {
    console.error(`[generateLetter] ERROR — ${error.message}`, error.stack);
    return Response.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
});