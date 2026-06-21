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
  
  if (documentType === 'letter') {
    if (letterContent) {
      const cleanContent = cleanForPDF(letterContent);
      const lines = cleanContent.split('\n');
      
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
          const textLines = pdf.splitTextToSize(trimmed, contentWidth);
          if (textLines && Array.isArray(textLines) && textLines.length > 0) {
            pdf.text(textLines, leftMargin, yPos);
            yPos += textLines.length * 4.5;
          }
        } else {
          yPos += 3;
        }
      }
    }
  } else if (documentType === 'snapshot' || documentType === 'summary') {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    if (title && typeof title === 'string') {
      pdf.text(title.toUpperCase(), leftMargin, yPos);
    }
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    if (matter && typeof matter === 'string') {
      pdf.text(`Matter: ${matter}`, leftMargin, yPos);
      yPos += 6;
    }
    if (date && typeof date === 'string') {
      pdf.text(`Date: ${date}`, leftMargin, yPos);
      yPos += 6;
    }
    yPos += 3;
    
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 8;
    
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
        const titleLines = pdf.splitTextToSize(section.title.toUpperCase(), contentWidth);
        if (titleLines && Array.isArray(titleLines) && titleLines.length > 0) {
          pdf.text(titleLines, leftMargin, yPos);
          yPos += (titleLines.length * 6) + 2;
        }
        pdf.setFont('helvetica', 'normal');
      }
      
      if (section.content && typeof section.content === 'string') {
        const contentLines = pdf.splitTextToSize(section.content, contentWidth);
        pdf.setFontSize(11);
        if (contentLines && Array.isArray(contentLines) && contentLines.length > 0) {
          pdf.text(contentLines, leftMargin, yPos);
          yPos += (contentLines.length * 5.5) + 4;
        }
      }
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
  
  return pdf.output('blob');
}