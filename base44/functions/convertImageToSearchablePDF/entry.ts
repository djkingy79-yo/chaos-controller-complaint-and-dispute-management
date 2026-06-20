import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

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

    // Download the image
    const imageResponse = await fetch(fileUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }
    
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = arrayBufferToBase64(arrayBuffer);
    
    // Create a PDF with the image embedded
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Get image dimensions
    const imgProps = getImageProperties(arrayBuffer);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    
    // Calculate image dimensions to fit on page while maintaining aspect ratio
    let imgWidth = imgProps.width;
    let imgHeight = imgProps.height;
    
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    
    const widthRatio = maxWidth / imgWidth;
    const heightRatio = maxHeight / imgHeight;
    const scale = Math.min(widthRatio, heightRatio, 1); // Don't scale up, only down
    
    imgWidth = imgWidth * scale;
    imgHeight = imgHeight * scale;
    
    // Center the image on the page
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    
    // Add image to PDF
    const imageFormat = getImageFormat(fileName);
    pdf.addImage(
      `data:image/${imageFormat};base64,${base64Image}`,
      imageFormat.toUpperCase(),
      x,
      y,
      imgWidth,
      imgHeight
    );

    // Add metadata for searchability
    pdf.setProperties({
      title: fileName,
      subject: 'Evidence Document',
      author: user.full_name || 'Chaos Controller User',
      creator: 'Chaos Controller',
      keywords: 'evidence, document, legal, dispute'
    });

    // Save PDF
    const pdfBytes = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Upload PDF to Base44
    const pdfFileName = fileName.replace(/\.[^/.]+$/, '') + '.pdf';
    const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    
    const { file_url: pdfUrl } = await base44.integrations.Core.UploadFile({ 
      file: pdfFile 
    });

    return Response.json({
      success: true,
      converted: true,
      pdfUrl,
      pdfFileName,
      originalFileName: fileName
    });
  } catch (error) {
    console.error('Image to PDF conversion failed:', error);
    return Response.json({
      success: false,
      converted: false,
      error: error.message
    });
  }
});

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getImageProperties(arrayBuffer) {
  // Simple image dimension detection
  const view = new DataView(arrayBuffer);
  
  // JPEG
  if (view.getUint16(0, false) === 0xFFD8) {
    let offset = 2;
    const length = view.byteLength;
    while (offset < length) {
      if (view.getUint16(offset, false) === 0xFFC0 || 
          view.getUint16(offset, false) === 0xFFC1 ||
          view.getUint16(offset, false) === 0xFFC2) {
        const height = view.getUint16(offset + 5, false);
        const width = view.getUint16(offset + 7, false);
        return { width, height, type: 'jpeg' };
      }
      offset += 2 + view.getUint16(offset + 2, false);
    }
  }
  
  // PNG
  if (view.getUint32(0, false) === 0x89504E47) {
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);
    return { width, height, type: 'png' };
  }
  
  // Default (assume reasonable size)
  return { width: 2480, height: 3508, type: 'jpeg' }; // A4 at 300 DPI
}

function getImageFormat(fileName) {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.') + 1);
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return ext === 'jpg' ? 'jpeg' : ext;
  }
  return 'jpeg';
}