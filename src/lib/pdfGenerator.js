/**
 * CHAOS CONTROLLER™ — UNIFIED PDF GENERATOR
 * ALL letters, snapshots, summaries, exports MUST use generateChaosDocumentPDF().
 * No window.print(), no printDocument(), no printLetterUniversal() anywhere.
 */

import { jsPDF } from 'jspdf';

export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LOADER — never throws, returns null on failure
// ─────────────────────────────────────────────────────────────────────────────
function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => {
      console.warn('[PDF Generator] Image load timeout:', url);
      resolve(null);
    }, 8000);
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } catch (e) {
        console.warn('[PDF Generator] Canvas error:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('[PDF Generator] Image load failed:', url);
      resolve(null);
    };
    img.src = url + '?t=' + Date.now(); // bust cache
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT CLEANER
// ─────────────────────────────────────────────────────────────────────────────
export function cleanForPDF(content) {
  if (!content) return '';
  return String(content)
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function generateChaosDocumentPDF({
  documentType = 'general',
  title = 'Document',
  matter = '',
  date = '',
  body = '',
  sections = [],
  includeHeader = true,
  includeFooter = true,
}) {
  console.log('DASHBOARD PDF GENERATOR START', { type: documentType, title });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const pageHeight = 297;
  const leftMargin = 17.5;
  const rightMargin = 17.5;
  const topMargin = 12.5;
  const bottomMargin = 30; // reserve space for footer
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // Set Times New Roman 11pt as default
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);

  let yPos = topMargin;

  // ── HEADER ──
  let headerHeight = 0;
  if (includeHeader) {
    const headerImg = await loadImageAsDataURL(LETTERHEAD_URL);
    if (headerImg) {
      try {
        const imgProps = pdf.getImageProperties(headerImg);
        headerHeight = Math.min(imgProps.h * (contentWidth / imgProps.w), 25);
        pdf.addImage(headerImg, 'JPEG', leftMargin, yPos, contentWidth, headerHeight);
        yPos += headerHeight + 6;
      } catch (e) {
        console.warn('[PDF Generator] Header insert failed:', e);
        yPos += 8;
      }
    } else {
      yPos += 8;
    }
  }

  // Helper: add footer image to current page
  const addFooter = async () => {
    if (!includeFooter) return;
    const footerImg = await loadImageAsDataURL(FOOTER_URL);
    if (footerImg) {
      try {
        const fp = pdf.getImageProperties(footerImg);
        const fh = Math.min(fp.h * (contentWidth / fp.w), 20);
        pdf.addImage(footerImg, 'JPEG', leftMargin, pageHeight - fh - 5, contentWidth, fh);
      } catch (e) {
        console.warn('[PDF Generator] Footer insert failed:', e);
      }
    }
  };

  // Helper: check page overflow and add new page if needed
  const checkPageBreak = async (requiredHeight = 15) => {
    if (yPos + requiredHeight > pageHeight - bottomMargin) {
      await addFooter();
      pdf.addPage();
      yPos = topMargin + 8;
      // Re-add header on new pages? No — just reset position
    }
  };

  // Helper: write a bold section heading
  const writeHeading = async (text) => {
    await checkPageBreak(12);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(String(text).toUpperCase(), contentWidth);
    pdf.text(lines, leftMargin, yPos);
    yPos += lines.length * 6 + 2;
    // Underline
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos - 1, leftMargin + contentWidth, yPos - 1);
    yPos += 4;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
  };

  // Helper: write body text with line wrapping + page breaks
  const writeBody = async (text) => {
    if (!text || !String(text).trim()) return;
    const clean = cleanForPDF(text);
    const paragraphs = clean.split('\n');
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) {
        yPos += 3; // blank line gap
        continue;
      }
      const lines = pdf.splitTextToSize(trimmed, contentWidth);
      await checkPageBreak(lines.length * 5.5 + 2);
      pdf.text(lines, leftMargin, yPos);
      yPos += lines.length * 5.5 + 1;
    }
  };

  // ── TITLE ──
  if (title) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    const titleLines = pdf.splitTextToSize(String(title).toUpperCase(), contentWidth);
    pdf.text(titleLines, leftMargin, yPos);
    yPos += titleLines.length * 7 + 4;
  }

  if (matter) {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Matter: ${String(matter)}`, leftMargin, yPos);
    yPos += 6;
  }

  if (date) {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Date: ${String(date)}`, leftMargin, yPos);
    yPos += 6;
  }

  if (matter || date) {
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += 6;
  }

  // ── BODY (plain text / letters) ──
  if (body && String(body).trim()) {
    await writeBody(body);
  }

  // ── SECTIONS (snapshot / summary style) ──
  if (sections && sections.length > 0) {
    for (const section of sections) {
      if (section.title) {
        await writeHeading(section.title);
      }
      if (section.content) {
        await writeBody(section.content);
        yPos += 4;
      }
    }
  }

  // ── FOOTER on last page ──
  await addFooter();

  console.log('PDF GENERATED', { type: documentType, title, pages: pdf.getNumberOfPages() });
  return pdf.output('blob');
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE: download a PDF blob
// ─────────────────────────────────────────────────────────────────────────────
export function downloadPDFBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}