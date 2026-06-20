import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, fileName } = body;

    if (!fileUrl || !fileName) {
      return Response.json({ error: 'Missing fileUrl or fileName' }, { status: 400 });
    }

    // Check if file is an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    
    if (!imageExtensions.includes(fileExtension)) {
      return Response.json({ 
        success: false, 
        converted: false, 
        message: 'File is not an image',
        originalFileUrl: fileUrl
      });
    }

    // Use InvokeLLM with vision to extract text and create searchable PDF
    const prompt = `You are a professional document conversion service. I will provide you with an image file.
    
Your task:
1. Extract ALL text from the image using OCR (Optical Character Recognition)
2. Identify the document type (letter, statement, receipt, contract, etc.)
3. Extract key information: dates, names, amounts, account numbers, addresses
4. Create a professional, searchable PDF version of this document

Return the extracted text in a clean, readable format that preserves the document structure.
Include all text exactly as it appears, maintaining formatting where possible.

Return as JSON with this structure:
{
  "extracted_text": "full text content",
  "document_type": "type of document",
  "confidence": "high/medium/low",
  "key_fields": {
    "dates": [],
    "names": [],
    "amounts": [],
    "account_numbers": [],
    "addresses": []
  }
}`;

    const schema = {
      type: "object",
      properties: {
        extracted_text: { type: "string" },
        document_type: { type: "string" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        key_fields: {
          type: "object",
          properties: {
            dates: { type: "array", items: { type: "string" } },
            names: { type: "array", items: { type: "string" } },
            amounts: { type: "array", items: { type: "string" } },
            account_numbers: { type: "array", items: { type: "string" } },
            addresses: { type: "array", items: { type: "string" } }
          }
        }
      }
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [fileUrl],
      response_json_schema: schema,
      model: "gemini_3_flash"
    });

    // Create a PDF with the extracted text (searchable)
    // For now, return the extracted data - the PDF creation would need a PDF library
    // In production, you'd use a library like jsPDF or pdf-lib to create the actual PDF
    
    return Response.json({
      success: true,
      converted: true,
      originalFileUrl: fileUrl,
      extractedData: result,
      message: 'Image text extracted successfully. PDF creation requires additional PDF library.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});