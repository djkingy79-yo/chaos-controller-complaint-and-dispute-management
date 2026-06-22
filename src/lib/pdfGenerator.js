/**
 * CHAOS CONTROLLER™ — UNIFIED PDF GENERATOR
 * ALL letters, snapshots, summaries, exports MUST use generateChaosDocumentPDF().
 * No window.print(), no printDocument(), no printLetterUniversal() anywhere.
 */

import { jsPDF } from 'jspdf';

export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LOADER — never throws, never crashes PDF generation, returns null on any failure
// ─────────────────────────────────────────────────────────────────────────────
function loadImageAsDataURL(url, label) {
  return new Promise((resolve) => {
    // Timeout: 6 seconds — don't stall PDF generation
    const timeout = setTimeout(() => {
      console.error(`${label} image failed`, new Error(`Timeout loading: ${url}`));
      resolve(null);
    }, 6000);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        if (canvas.width === 0 || canvas.height === 0) {
          console.error(`${label} image failed`, new Error('Image has zero dimensions'));
          resolve(null);
          return;
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (e) {
        console.error(`${label} image failed`, e);
        resolve(null);
      }
    };

    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error(`${label} image failed`, new Error(`Failed to load: ${url}`));
      resolve(null);
    };

    // Cache-bust to avoid stale CORS failures
    img.src = url + '?cb=' + Date.now();
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
// Returns: { blob: Blob, warnings: string[] }
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
  console.log('PDF GENERATOR START', { type: documentType, title });

  const warnings = [];
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const pageHeight = 297;
  const leftMargin = 17.5;
  const rightMargin = 17.5;
  const topMargin = 12.5;
  const bottomMargin = 30;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);

  let yPos = topMargin;

  // ── HEADER ──
  if (includeHeader) {
    const headerImg = await loadImageAsDataURL(LETTERHEAD_URL, 'Header');
    if (headerImg) {
      try {
        const imgProps = pdf.getImageProperties(headerImg);
        const headerHeight = Math.min(imgProps.h * (contentWidth / imgProps.w), 25);
        pdf.addImage(headerImg, 'JPEG', leftMargin, yPos, contentWidth, headerHeight);
        yPos += headerHeight + 6;
      } catch (e) {
        console.error('Header image failed', e);
        warnings.push('Header branding image failed to embed.');
        yPos += 8;
      }
    } else {
      warnings.push('Header branding image failed to load.');
      yPos += 8;
    }
  }

  // ── FOOTER helper — load once, embed on each page ──
  let footerImgData = null;
  let footerHeight = 0;
  if (includeFooter) {
    footerImgData = await loadImageAsDataURL(FOOTER_URL, 'Footer');
    if (footerImgData) {
      try {
        const fp = pdf.getImageProperties(footerImgData);
        footerHeight = Math.min(fp.h * (contentWidth / fp.w), 20);
      } catch (e) {
        console.error('Footer image failed', e);
        warnings.push('Footer branding image failed to embed.');
        footerImgData = null;
      }
    } else {
      warnings.push('Footer branding image failed to load.');
    }
  }

  const addFooter = () => {
    if (!footerImgData) return;
    try {
      pdf.addImage(footerImgData, 'JPEG', leftMargin, pageHeight - footerHeight - 5, contentWidth, footerHeight);
    } catch (e) {
      console.error('Footer image failed', e);
    }
  };

  const checkPageBreak = (requiredHeight = 15) => {
    if (yPos + requiredHeight > pageHeight - bottomMargin) {
      addFooter();
      pdf.addPage();
      yPos = topMargin + 8;
    }
  };

  const writeHeading = (text) => {
    checkPageBreak(12);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(String(text).toUpperCase(), contentWidth);
    pdf.text(lines, leftMargin, yPos);
    yPos += lines.length * 6 + 2;
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos - 1, leftMargin + contentWidth, yPos - 1);
    yPos += 4;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
  };

  const writeBody = (text) => {
    if (!text || !String(text).trim()) return;
    const clean = cleanForPDF(text);
    const paragraphs = clean.split('\n');
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) {
        yPos += 3;
        continue;
      }
      const lines = pdf.splitTextToSize(trimmed, contentWidth);
      checkPageBreak(lines.length * 5.5 + 2);
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

  // ── BODY ──
  if (body && String(body).trim()) {
    writeBody(body);
  }

  // ── SECTIONS ──
  if (sections && sections.length > 0) {
    for (const section of sections) {
      if (section.title) writeHeading(section.title);
      if (section.content) {
        writeBody(section.content);
        yPos += 4;
      }
    }
  }

  // ── FOOTER on last page ──
  addFooter();

  console.log('PDF GENERATED', { type: documentType, title, pages: pdf.getNumberOfPages(), warnings });

  const blob = pdf.output('blob');
  // Attach warnings to blob so callers can surface them
  blob._warnings = warnings;
  return blob;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE: trigger browser file download from a PDF blob
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

// ─────────────────────────────────────────────────────────────────────────────
// PRINT: open PDF in new tab/window and trigger browser print dialog inside that tab.
// Returns true if window opened successfully, false if popup blocked.
// Caller should fallback to downloadPDFBlob() when this returns false.
// ─────────────────────────────────────────────────────────────────────────────
export function openPDFForPrint(blob, filename) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win || win.closed || typeof win.closed === 'undefined') {
    URL.revokeObjectURL(url);
    return false;
  }
  win.addEventListener('load', () => {
    try { win.print(); } catch (e) { /* mobile Safari may block — window still open */ }
  });
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  return true;
}