import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { evidenceId } = await req.json();
    if (!evidenceId) {
      return Response.json({ error: 'evidenceId required' }, { status: 400 });
    }

    // Fetch evidence
    const evidenceList = await base44.entities.Evidence.filter({ id: evidenceId });
    const evidence = evidenceList[0];
    if (!evidence) {
      return Response.json({ error: 'Evidence not found' }, { status: 404 });
    }

    // Extract full text using LLM with vision
    const prompt = `Extract ALL text from this document exactly as it appears. Include:
- All headings, paragraphs, and sections
- All numbers, dates, amounts, and reference numbers
- All names and contact details
- Tables and lists (format as plain text)
- Footers and page numbers

Return ONLY the raw text content. Do not add any commentary or analysis.
If the document contains no readable text, return "NO_TEXT_FOUND".`;

    const extractedText = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [evidence.file_url],
      model: 'gemini_3_flash' // Best for OCR + text extraction
    });

    // Update evidence with extracted text
    await base44.entities.Evidence.update(evidenceId, {
      extracted_text: extractedText,
      text_extracted_date: new Date().toISOString(),
      scan_status: 'complete'
    });

    return Response.json({
      success: true,
      evidenceId,
      text: extractedText,
      textLength: extractedText?.length || 0,
      preview: extractedText?.slice(0, 200) + (extractedText && extractedText.length > 200 ? '...' : '')
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});