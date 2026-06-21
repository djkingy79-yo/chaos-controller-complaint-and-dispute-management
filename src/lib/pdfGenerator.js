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
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
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
  sections = [],
  includeHeader = true,
  includeFooter = true,
}) {
  console.log('[PDF Generator] Starting:', documentType, title);
  
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
      const headerImg = await loadImageAsDataURL(LETTERHEAD_URL);
      pdf.addImage(headerImg, 'JPEG', leftMargin, yPos, 175, 0);
      const imgProps = pdf.getImageProperties(headerImg);
      const imgHeight = imgProps.h * (175 / imgProps.w);
      yPos += Math.min(imgHeight, 22);
    } catch (err) {
      console.error('[PDF Generator] Header image failed:', err);
    }
  }
  
  yPos += 8;
  
  // Document-specific formatting
  if (documentType === 'letter') {
    // Date - only if provided
    if (date && date.trim()) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(String(date).trim(), leftMargin, yPos);
      yPos += 15;
    }
    
    // Party details - only if provided
    const claimantStr = String(claimant || '').trim();
    const recipientStr = String(recipient || '').trim();
    const claimantLines = claimantStr ? claimantStr.split('\n').filter(l => l.trim()) : [];
    const recipientLines = recipientStr ? recipientStr.split('\n').filter(l => l.trim()) : [];
    
    if (claimantLines.length > 0 || recipientLines.length > 0) {
      const maxLines = Math.max(claimantLines.length, recipientLines.length, 1);
      const claimantHeight = maxLines * 5;
      
      if (claimantLines.length > 0) {
        pdf.text(claimantLines, pageWidth - rightMargin, yPos, { align: 'right' });
      }
      if (recipientLines.length > 0) {
        pdf.text(recipientLines, leftMargin, yPos);
      }
      yPos += claimantHeight + 10;
    }
    
    // RE line - only if provided
    const reLineStr = String(reLine || '').trim();
    if (reLineStr) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(reLineStr, leftMargin, yPos);
      yPos += 10;
    }
    
    // Greeting - only if provided
    const greetingStr = String(greeting || '').trim();
    if (greetingStr) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(greetingStr, leftMargin, yPos);
      yPos += 10;
    }
    
    // Body - ALWAYS required for letters
    const cleanBody = cleanForPDF(body || '');
    if (cleanBody && cleanBody.trim()) {
      const bodyLines = pdf.splitTextToSize(cleanBody, contentWidth);
      pdf.text(bodyLines, leftMargin, yPos);
      yPos += bodyLines.length * 5.5 + 10;
    } else {
      console.warn('[PDF Generator] Letter body is empty!');
    }
    
    // Closing - only if provided
    const closingStr = String(closing || '').trim();
    if (closingStr) {
      pdf.text(closingStr, leftMargin, yPos);
      yPos += 8;
    }
    
    // Signature - only if provided
    const sigStr = String(signature || '').trim();
    if (sigStr) {
      const sigLines = sigStr.split('\n');
      pdf.text(sigLines, leftMargin, yPos);
      yPos += sigLines.length * 5.5 + 10;
    }
    
  } else if (documentType === 'snapshot' || documentType === 'summary') {
    // Title block
    const titleStr = String(title || 'Document').trim();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(titleStr.toUpperCase(), leftMargin, yPos);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const matterStr = String(matter || '').trim();
    if (matterStr) {
      pdf.text(`Matter: ${matterStr}`, leftMargin, yPos);
      yPos += 6;
    }
    const dateStr = String(date || '').trim();
    if (dateStr) {
      pdf.text(`Date: ${dateStr}`, leftMargin, yPos);
      yPos += 6;
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
      
      const sectionTitle = String(section.title || '').trim();
      if (sectionTitle) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        const titleLines = pdf.splitTextToSize(sectionTitle.toUpperCase(), contentWidth);
        pdf.text(titleLines, leftMargin, yPos);
        yPos += (titleLines.length * 6) + 2;
        pdf.setFont('helvetica', 'normal');
      }
      
      const sectionContent = String(section.content || '').trim();
      if (sectionContent) {
        const contentLines = pdf.splitTextToSize(sectionContent, contentWidth);
        pdf.setFontSize(11);
        pdf.text(contentLines, leftMargin, yPos);
        yPos += (contentLines.length * 5.5) + 4;
      }
    }
  } else if (documentType === 'general') {
    // General document - just body text
    const titleStr = String(title || 'Document').trim();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(titleStr.toUpperCase(), leftMargin, yPos);
    yPos += 10;
    
    const bodyStr = String(body || '').trim();
    if (bodyStr) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const bodyLines = pdf.splitTextToSize(bodyStr, contentWidth);
      pdf.text(bodyLines, leftMargin, yPos);
      yPos += bodyLines.length * 5.5;
    }
  }
  
  // Add footer
  if (includeFooter) {
    try {
      const footerImg = await loadImageAsDataURL(FOOTER_URL);
      const footerProps = pdf.getImageProperties(footerImg);
      const footerHeight = footerProps.h * (175 / footerProps.w);
      pdf.addImage(footerImg, 'JPEG', leftMargin, pageHeight - bottomMargin - footerHeight, 175, 0);
    } catch (err) {
      console.error('[PDF Generator] Footer image failed:', err);
    }
  }
  
  console.log('[PDF Generator] Complete');
  
  // Return as blob
  return pdf.output('blob');
}