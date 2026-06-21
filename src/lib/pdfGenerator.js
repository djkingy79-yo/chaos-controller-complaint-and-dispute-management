/**
 * CHAOS CONTROLLER™ — UNIFIED PDF GENERATOR
 * 
 * SINGLE SHARED SERVICE for all document generation.
 * ALL letters, snapshots, summaries, exports MUST use generateChaosDocumentPDF().
 */

import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────────────────────────────────────
export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load image as data URL for jsPDF
 */
function loadImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      console.error('[loadImageAsDataURL] Timeout loading:', url);
      reject(new Error('Image load timeout'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        console.log('[loadImageAsDataURL] Success, size:', dataUrl.length, 'bytes');
        resolve(dataUrl);
      } catch (err) {
        console.error('[loadImageAsDataURL] Canvas conversion failed:', err);
        reject(err);
      }
    };
    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error('[loadImageAsDataURL] Image load error:', e, 'URL:', url);
      reject(new Error('Failed to load image: ' + url));
    };
    
    console.log('[loadImageAsDataURL] Loading:', url);
    img.src = url;
  });
}

/**
 * Clean content for PDF - remove markdown, HTML tags, normalize
 */
export function cleanForPDF(content) {
  if (!content) return '';
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/^>/gm, '')
    .replace(/---/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Generate Chaos Document PDF - UNIFIED GENERATOR
 * All document types must use this function
 * 
 * @param {Object} options
 * @param {string} options.documentType - 'letter' | 'snapshot' | 'summary' | 'general'
 * @param {string} options.title - Document title
 * @param {string} options.matter - Case/matter name
 * @param {string} options.claimant - Claimant details (multi-line)
 * @param {string} options.recipient - Recipient details (multi-line)
 * @param {string} options.date - Date string
 * @param {string} options.reLine - RE: subject line (for letters)
 * @param {string} options.greeting - Greeting (for letters)
 * @param {string} options.body - Main content
 * @param {string} options.closing - Closing (for letters)
 * @param {string} options.signature - Signature block
 * @param {string} options.letterContent - Pre-formatted letter content (alternative to structured params)
 * @param {Array} options.sections - Array of {title, content} for snapshots/summaries
 * @param {boolean} options.includeHeader - Include Chaos header (default: true)
 * @param {boolean} options.includeFooter - Include Chaos footer (default: true)
 * 
 * @returns {Promise<Blob>} PDF blob
 */
export async function generateChaosDocumentPDF({
  documentType = 'general',
  title = 'Document',
  matter = '',
  claimant = '',
  recipient = '',
  date = '',
  reLine = '',
  greeting = '',
  body = '',
  closing = '',
  signature = '',
  letterContent = '',
  sections = [],
  includeHeader = true,
  includeFooter = true,
}) {
  console.log('[PDF Generator] Starting:', documentType, title);
  console.log('[PDF Generator] Params:', { documentType, hasLetterContent: !!letterContent, hasBody: !!body, letterContentLength: letterContent?.length });
  
  // CRITICAL: Validate letterContent
  if (documentType === 'letter' && !letterContent) {
    console.error('[PDF Generator] ERROR: letterContent is required for letter type');
  }
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const leftMargin = 17.5;
  const rightMargin = 17.5;
  const topMargin = 12.5;
  const bottomMargin = 12.5;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  
  let yPos = topMargin;
  
  // Add header
  if (includeHeader) {
    try {
      console.log('[PDF Generator] Loading header image...');
      const headerImg = await loadImageAsDataURL(LETTERHEAD_URL);
      console.log('[PDF Generator] Header loaded, adding to PDF...');
      pdf.addImage(headerImg, 'JPEG', leftMargin, yPos, 175, 0);
      const imgProps = pdf.getImageProperties(headerImg);
      const imgHeight = imgProps.h * (175 / imgProps.w);
      console.log('[PDF Generator] Header height:', imgHeight, 'mm');
      yPos += Math.min(imgHeight, 22);
      console.log('[PDF Generator] yPos after header:', yPos);
    } catch (err) {
      console.error('[PDF Generator] Header image failed:', err);
      yPos += 22; // Reserve space even if image fails
    }
  } else {
    yPos += 22;
  }
  
  yPos += 8;
  console.log('[PDF Generator] Final yPos before content:', yPos);
  
  // Document-specific formatting
  if (documentType === 'letter') {
    console.log('[PDF Generator] Letter mode');
    
    // If letterContent is provided (pre-formatted), use it directly
    if (letterContent) {
      console.log('[PDF Generator] ✅ letterContent provided, length:', letterContent.length);
      console.log('[PDF Generator] First 300 chars:', letterContent.substring(0, 300));
      const cleanContent = cleanForPDF(letterContent);
      console.log('[PDF Generator] After cleaning, length:', cleanContent.length);
      console.log('[PDF Generator] Clean content length:', cleanContent.length);
      console.log('[PDF Generator] Clean content (first 200 chars):', cleanContent.substring(0, 200));
      const lines = cleanContent.split('\n');
      console.log('[PDF Generator] Lines count:', lines.length);
      console.log('[PDF Generator] First 5 lines:', lines.slice(0, 5));
      
      for (const line of lines) {
        if (yPos > pageHeight - bottomMargin - 30) {
          if (includeFooter) {
            try {
              const footerImg = await loadImageAsDataURL(FOOTER_URL);
              const footerProps = pdf.getImageProperties(footerImg);
              const footerHeight = footerProps.h * (175 / footerProps.w);
              pdf.addImage(footerImg, 'JPEG', leftMargin, pageHeight - bottomMargin - footerHeight, 175, 0);
            } catch (err) {
              console.error('[PDF Generator] Footer failed:', err);
            }
          }
          pdf.addPage();
          yPos = topMargin;
          if (includeHeader) {
            try {
              const headerImg = await loadImageAsDataURL(LETTERHEAD_URL);
              pdf.addImage(headerImg, 'JPEG', leftMargin, yPos, 175, 0);
              const imgProps = pdf.getImageProperties(headerImg);
              const imgHeight = imgProps.h * (175 / imgProps.w);
              yPos += Math.min(imgHeight, 22);
            } catch (err) {
              console.error('[PDF Generator] Header failed:', err);
            }
            yPos += 8;
          }
        }
        
        const trimmed = line.trim();
        if (trimmed && typeof trimmed === 'string' && trimmed.length > 0) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0); // FORCE BLACK TEXT
          const textLines = pdf.splitTextToSize(trimmed, contentWidth);
          if (textLines && Array.isArray(textLines) && textLines.length > 0) {
            pdf.text(textLines, leftMargin, yPos);
            yPos += textLines.length * 4.5;
          }
        } else {
          yPos += 3;
        }
      }
    } else {
      // Structured letter format
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      if (date && typeof date === 'string') {
        try {
          pdf.text(date, leftMargin, yPos);
          yPos += 15;
        } catch (textErr) {
          console.error('[PDF Generator] date text() failed:', textErr);
        }
      }
      
      const claimantLines = claimant && typeof claimant === 'string' ? claimant.split('\n').filter(l => l.trim()) : [];
      const recipientLines = recipient && typeof recipient === 'string' ? recipient.split('\n').filter(l => l.trim()) : [];
      
      const maxLines = Math.max(claimantLines.length, recipientLines.length);
      const claimantHeight = maxLines * 5;
      
      if (claimantLines.length > 0) {
        try {
          pdf.text(claimantLines, pageWidth - rightMargin, yPos, { align: 'right' });
        } catch (textErr) {
          console.error('[PDF Generator] claimant text() failed:', textErr);
        }
      }
      if (recipientLines.length > 0) {
        try {
          pdf.text(recipientLines, leftMargin, yPos);
        } catch (textErr) {
          console.error('[PDF Generator] recipient text() failed:', textErr);
        }
      }
      yPos += claimantHeight + 10;
      
      if (reLine && typeof reLine === 'string') {
        pdf.setFont('helvetica', 'bold');
        try {
          pdf.text(reLine, leftMargin, yPos);
          yPos += 10;
        } catch (textErr) {
          console.error('[PDF Generator] reLine text() failed:', textErr);
        }
      }
      
      if (greeting && typeof greeting === 'string') {
        pdf.setFont('helvetica', 'normal');
        try {
          pdf.text(greeting, leftMargin, yPos);
          yPos += 10;
        } catch (textErr) {
          console.error('[PDF Generator] greeting text() failed:', textErr);
        }
      }
      
      if (body && typeof body === 'string') {
        const cleanBody = cleanForPDF(body);
        try {
          const bodyLines = pdf.splitTextToSize(cleanBody, contentWidth);
          if (bodyLines && Array.isArray(bodyLines) && bodyLines.length > 0) {
            pdf.text(bodyLines, leftMargin, yPos);
            yPos += bodyLines.length * 5.5 + 10;
          }
        } catch (textErr) {
          console.error('[PDF Generator] body text() failed:', textErr);
        }
      }
      
      if (closing && typeof closing === 'string') {
        try {
          pdf.text(closing, leftMargin, yPos);
          yPos += 8;
        } catch (textErr) {
          console.error('[PDF Generator] closing text() failed:', textErr);
        }
      }
      
      if (signature && typeof signature === 'string') {
        try {
          const sigLines = signature.split('\n');
          pdf.text(sigLines, leftMargin, yPos);
          yPos += sigLines.length * 5.5 + 10;
        } catch (textErr) {
          console.error('[PDF Generator] signature text() failed:', textErr);
        }
      }
    }
    
  } else if (documentType === 'snapshot' || documentType === 'summary') {
    // Title block
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    if (title && typeof title === 'string') {
      try {
        pdf.text(title.toUpperCase(), leftMargin, yPos);
      } catch (textErr) {
        console.error('[PDF Generator] title text() failed:', textErr);
      }
    }
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    if (matter && typeof matter === 'string') {
      try {
        pdf.text(`Matter: ${matter}`, leftMargin, yPos);
        yPos += 6;
      } catch (textErr) {
        console.error('[PDF Generator] matter text() failed:', textErr);
      }
    }
    if (date && typeof date === 'string') {
      try {
        pdf.text(`Date: ${date}`, leftMargin, yPos);
        yPos += 6;
      } catch (textErr) {
        console.error('[PDF Generator] date text() failed:', textErr);
      }
    }
    yPos += 3;
    
    // Separator
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 8;
    
    // Sections
    for (const section of sections) {
      if (yPos > pageHeight - bottomMargin - 30) {
        if (includeFooter) {
          try {
            const footerImg = await loadImageAsDataURL(FOOTER_URL);
            const footerProps = pdf.getImageProperties(footerImg);
            const footerHeight = footerProps.h * (175 / footerProps.w);
            pdf.addImage(footerImg, 'JPEG', leftMargin, pageHeight - bottomMargin - footerHeight, 175, 0);
          } catch (err) {
            console.error('[PDF Generator] Footer failed:', err);
          }
        }
        pdf.addPage();
        yPos = topMargin;
      }
      
      if (section.title && typeof section.title === 'string') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        try {
          const titleLines = pdf.splitTextToSize(section.title.toUpperCase(), contentWidth);
          if (titleLines && Array.isArray(titleLines) && titleLines.length > 0) {
            pdf.text(titleLines, leftMargin, yPos);
            yPos += (titleLines.length * 6) + 2;
          }
        } catch (textErr) {
          console.error('[PDF Generator] title text() failed:', textErr);
        }
        pdf.setFont('helvetica', 'normal');
      }
      
      if (section.content && typeof section.content === 'string') {
        try {
          const contentLines = pdf.splitTextToSize(section.content, contentWidth);
          pdf.setFontSize(11);
          if (contentLines && Array.isArray(contentLines) && contentLines.length > 0) {
            pdf.text(contentLines, leftMargin, yPos);
            yPos += (contentLines.length * 5.5) + 4;
          }
        } catch (textErr) {
          console.error('[PDF Generator] section text() failed:', textErr);
        }
      }
    }
  }
  
  // Add footer - ALWAYS add on last page
  if (includeFooter) {
    try {
      const footerImg = await loadImageAsDataURL(FOOTER_URL);
      const footerProps = pdf.getImageProperties(footerImg);
      const footerHeight = footerProps.h * (175 / footerProps.w);
      console.log('[PDF Generator] Footer height:', footerHeight, 'mm at Y:', pageHeight - bottomMargin - footerHeight);
      pdf.addImage(footerImg, 'JPEG', leftMargin, pageHeight - bottomMargin - footerHeight, 175, 0);
      console.log('[PDF Generator] Footer added successfully');
    } catch (err) {
      console.error('[PDF Generator] Footer image failed:', err);
    }
  } else {
    console.log('[PDF Generator] Footer disabled');
  }
  
  console.log('[PDF Generator] Complete');
  
  // Return as blob
  return pdf.output('blob');
}