/**
 * CHAOS CONTROLLER™ — UNIFIED PDF GENERATOR
 * ALL letters, snapshots, summaries, exports MUST use generateChaosDocumentPDF().
 * No window.print(), no printDocument(), no printLetterUniversal() anywhere.
 *
 * For LETTER documents: use captureLetterDocumentPDF(domNode, filename)
 * which captures the actual rendered LetterDocument component via html2canvas.
 * This guarantees preview = PDF = print output.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
// BODY STRIPPER — removes AI-generated header block, returns body from "Dear" onwards
// ─────────────────────────────────────────────────────────────────────────────
export function stripToLetterBody(text) {
  if (!text) return '';
  const clean = String(text).replace(/<[^>]*>/g, '');
  const dearMatch = clean.search(/\bDear\b/i);
  if (dearMatch === -1) return clean.trim();
  return clean.slice(dearMatch).trim();
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
    // Strip non-latin / unicode characters that corrupt jsPDF Times font
    .replace(/[^\x00-\x7F]/g, '')
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
  letterHeader = null,  // { receiverLines, senderLines, today, reSubject }
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

  // ── FORMAL LETTER HEADER (mutually exclusive with title/matter/date block) ──
  if (letterHeader) {
    const { receiverLines = [], senderLines = [], today = '', reSubject = '' } = letterHeader;
    const lineH = 5.5;
    const colWidth = contentWidth / 2 - 5;
    const rightCol = leftMargin + contentWidth / 2 + 5;

    // Date — right aligned
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    if (today) {
      pdf.text(today, leftMargin + contentWidth, yPos, { align: 'right' });
    }
    yPos += lineH * 2;

    // Two-column address block: receiver left, sender right
    const maxLines = Math.max(receiverLines.length, senderLines.length);
    const addrStartY = yPos;
    for (let i = 0; i < receiverLines.length; i++) {
      pdf.text(String(receiverLines[i]), leftMargin, addrStartY + i * lineH);
    }
    for (let i = 0; i < senderLines.length; i++) {
      pdf.text(String(senderLines[i]), rightCol, addrStartY + i * lineH);
    }
    yPos = addrStartY + maxLines * lineH + lineH;

    // RE line — bold
    if (reSubject) {
      pdf.setFont('times', 'bold');
      pdf.text(`Re: ${reSubject}`, leftMargin, yPos);
      pdf.setFont('times', 'normal');
      yPos += lineH + 2;
    }

    // Horizontal rule
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += lineH;
  } else {
    // ── TITLE (non-letter documents only) ──
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
// LETTER PDF CAPTURE — renders the actual LetterDocument DOM node into a PDF.
// This ensures preview = download = print with no separate layout.
//
// Usage:
//   const blob = await captureLetterDocumentPDF(ref.current);
//   downloadPDFBlob(blob, 'letter.pdf');
// ─────────────────────────────────────────────────────────────────────────────
export async function captureLetterDocumentPDF(domNode) {
  if (!domNode) throw new Error('captureLetterDocumentPDF: domNode is null');

  // Temporarily remove box-shadow so it doesn't bleed into capture
  const prevShadow = domNode.style.boxShadow;
  domNode.style.boxShadow = 'none';

  let canvas;
  try {
    canvas = await html2canvas(domNode, {
      scale: 2,                          // retina quality
      useCORS: true,                     // allow cross-origin images (letterhead/footer)
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      // Use the element's own rendered width so we don't clip
      windowWidth: domNode.scrollWidth,
      width: domNode.scrollWidth,
      height: domNode.scrollHeight,
    });
  } finally {
    domNode.style.boxShadow = prevShadow;
  }

  // A4 dimensions in mm
  const A4_W = 210;
  const A4_H = 297;

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgPxW  = canvas.width;
  const imgPxH  = canvas.height;

  // Scale captured image to fit A4 width; allow multi-page if taller
  const imgMmH = (imgPxH / imgPxW) * A4_W;
  const totalPages = Math.ceil(imgMmH / A4_H);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    // Offset the image vertically so each page shows a different slice
    const yOffset = -(page * A4_H);
    pdf.addImage(imgData, 'JPEG', 0, yOffset, A4_W, imgMmH);

    // Page number
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(`Page ${page + 1} of ${totalPages}`, A4_W / 2, A4_H - 4, { align: 'center' });
    pdf.setTextColor(0);
  }

  console.log('captureLetterDocumentPDF done', { pages: totalPages, imgPxW, imgPxH });
  return pdf.output('blob');
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
// PRINT: open PDF blob in a new tab and trigger the browser print dialog.
// Returns true on success, false if popup was blocked (caller falls back to download).
// ─────────────────────────────────────────────────────────────────────────────
export async function openPDFForPrint(blob, filename = 'document.pdf') {
  try {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      URL.revokeObjectURL(url);
      return false;
    }
    // Wait for load event, then print. Fallback setTimeout for Safari
    // which may not fire onload reliably for blob URLs.
    win.addEventListener('load', () => {
      try { win.focus(); win.print(); } catch (e) { console.error('Print after load failed:', e); }
    });
    setTimeout(() => {
      try { win.focus(); win.print(); } catch (e) { console.error('Print fallback failed:', e); }
    }, 1500);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch (error) {
    console.error('openPDFForPrint failed:', error);
    return false;
  }
}