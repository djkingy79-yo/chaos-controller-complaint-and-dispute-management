/**
 * CHAOS CONTROLLER™ — UNIFIED PDF GENERATOR
 *
 * All PDF export paths use captureLetterDocumentPDF() which captures
 * the live LetterDocument DOM node via html2canvas → jsPDF.
 *
 * Print path uses printPDFBlob() which renders the PDF in a hidden
 * iframe — this suppresses browser URL bar, header, and footer entirely.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LOADER — fault-tolerant, never throws
// ─────────────────────────────────────────────────────────────────────────────
function loadImageAsDataURL(url, label) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error(`${label} image timeout`);
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
        if (!canvas.width || !canvas.height) { resolve(null); return; }
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (e) {
        console.error(`${label} canvas error`, e);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.error(`${label} load error`);
      resolve(null);
    };

    img.src = url + '?cb=' + Date.now();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY STRIPPER
// ─────────────────────────────────────────────────────────────────────────────
export function stripToLetterBody(text) {
  if (!text) return '';
  const clean = String(text).replace(/<[^>]*>/g, '');
  const idx = clean.search(/\bDear\b/i);
  return idx === -1 ? clean.trim() : clean.slice(idx).trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT CLEANER — strips markdown, HTML, non-latin chars for jsPDF text mode
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
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// LETTER PDF CAPTURE
// Captures the live LetterDocument DOM node into an A4 PDF.
// preview == download == print (all use the same rendered component).
//
// Usage:
//   const blob = await captureLetterDocumentPDF(ref.current);
// ─────────────────────────────────────────────────────────────────────────────
export async function captureLetterDocumentPDF(domNode) {
  if (!domNode) throw new Error('captureLetterDocumentPDF: domNode is null');

  // Remove shadow temporarily so it doesn't bleed into capture
  const el = domNode.querySelector ? domNode.querySelector('.letter-page') || domNode : domNode;
  const prevShadow = el.style.boxShadow;
  el.style.boxShadow = 'none';

  let canvas;
  try {
    canvas = await html2canvas(el, {
      scale: 2,              // 2× for retina quality
      useCORS: true,         // allow cross-origin images
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: el.scrollWidth,
      width: el.scrollWidth,
      height: el.scrollHeight,
    });
  } finally {
    el.style.boxShadow = prevShadow;
  }

  const A4_W = 210; // mm
  const A4_H = 297; // mm

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgPxW  = canvas.width;
  const imgPxH  = canvas.height;

  // Scale captured image to fill A4 width
  const imgMmH  = (imgPxH / imgPxW) * A4_W;
  const totalPages = Math.ceil(imgMmH / A4_H);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    const yOffset = -(page * A4_H);
    pdf.addImage(imgData, 'JPEG', 0, yOffset, A4_W, imgMmH);

    // Page number — bottom centre, below the captured image strip
    if (totalPages > 1) {
      pdf.setFont('times', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(`Page ${page + 1} of ${totalPages}`, A4_W / 2, A4_H - 3, { align: 'center' });
      pdf.setTextColor(0);
    }
  }

  console.log('[PDF] captureLetterDocumentPDF done', { pages: totalPages, imgPxW, imgPxH });
  return pdf.output('blob');
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL DOCUMENT PDF — for executive summaries, reports (non-letter jsPDF text mode)
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
  letterHeader = null,
}) {
  console.log('[PDF] generateChaosDocumentPDF START', { type: documentType, title });

  const warnings = [];
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth  = 210;
  const pageHeight = 297;
  const leftMargin = 17.5;
  const rightMargin = 17.5;
  const topMargin  = 12.5;
  const bottomMargin = 30;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  let yPos = topMargin;

  // Header image
  if (includeHeader) {
    const headerImg = await loadImageAsDataURL(LETTERHEAD_URL, 'Header');
    if (headerImg) {
      try {
        const p = pdf.getImageProperties(headerImg);
        const h = Math.min(p.h * (contentWidth / p.w), 25);
        pdf.addImage(headerImg, 'JPEG', leftMargin, yPos, contentWidth, h);
        yPos += h + 6;
      } catch (e) {
        warnings.push('Header image failed.');
        yPos += 8;
      }
    } else {
      warnings.push('Header image failed to load.');
      yPos += 8;
    }
  }

  // Footer image — load once, stamp each page
  let footerImgData = null;
  let footerH = 0;
  if (includeFooter) {
    footerImgData = await loadImageAsDataURL(FOOTER_URL, 'Footer');
    if (footerImgData) {
      try {
        const fp = pdf.getImageProperties(footerImgData);
        footerH = Math.min(fp.h * (contentWidth / fp.w), 20);
      } catch (e) {
        footerImgData = null;
      }
    }
  }

  const addFooter = () => {
    if (!footerImgData) return;
    try {
      pdf.addImage(footerImgData, 'JPEG', leftMargin, pageHeight - footerH - 5, contentWidth, footerH);
    } catch (e) {}
  };

  const checkPageBreak = (needed = 15) => {
    if (yPos + needed > pageHeight - bottomMargin) {
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
    pdf.setDrawColor(0); pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos - 1, leftMargin + contentWidth, yPos - 1);
    yPos += 4;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
  };

  const writeBody = (text) => {
    if (!text || !String(text).trim()) return;
    const clean = cleanForPDF(text);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    for (const para of clean.split('\n')) {
      const t = para.trim();
      if (!t) { yPos += 3; continue; }
      const lines = pdf.splitTextToSize(t, contentWidth);
      checkPageBreak(lines.length * 5.5 + 2);
      pdf.text(lines, leftMargin, yPos);
      yPos += lines.length * 5.5 + 1;
    }
  };

  // Letter header block
  if (letterHeader) {
    const { receiverLines = [], senderLines = [], today = '', reSubject = '' } = letterHeader;
    const lineH = 5.5;
    const rightCol = leftMargin + contentWidth / 2 + 5;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    if (today) { pdf.text(today, leftMargin + contentWidth, yPos, { align: 'right' }); }
    yPos += lineH * 2;

    const maxLines = Math.max(receiverLines.length, senderLines.length);
    const addrY = yPos;
    receiverLines.forEach((l, i) => pdf.text(String(l), leftMargin, addrY + i * lineH));
    senderLines.forEach((l, i) => pdf.text(String(l), rightCol, addrY + i * lineH));
    yPos = addrY + maxLines * lineH + lineH;

    if (reSubject) {
      pdf.setFont('times', 'bold');
      pdf.text(`Re: ${reSubject}`, leftMargin, yPos);
      pdf.setFont('times', 'normal');
      yPos += lineH + 2;
    }
    pdf.setDrawColor(0); pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += lineH;
  } else {
    if (title) {
      pdf.setFont('times', 'bold'); pdf.setFontSize(14);
      const tl = pdf.splitTextToSize(String(title).toUpperCase(), contentWidth);
      pdf.text(tl, leftMargin, yPos);
      yPos += tl.length * 7 + 4;
    }
    if (matter) { pdf.setFont('times', 'normal'); pdf.setFontSize(11); pdf.text(`Matter: ${matter}`, leftMargin, yPos); yPos += 6; }
    if (date) { pdf.setFont('times', 'normal'); pdf.setFontSize(11); pdf.text(`Date: ${date}`, leftMargin, yPos); yPos += 6; }
    if (matter || date) {
      pdf.setDrawColor(0); pdf.setLineWidth(0.3);
      pdf.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
      yPos += 6;
    }
  }

  if (body && String(body).trim()) writeBody(body);

  if (sections && sections.length > 0) {
    for (const s of sections) {
      if (s.title) writeHeading(s.title);
      if (s.content) { writeBody(s.content); yPos += 4; }
    }
  }

  addFooter();
  console.log('[PDF] generateChaosDocumentPDF done', { pages: pdf.getNumberOfPages(), warnings });
  const blob = pdf.output('blob');
  blob._warnings = warnings;
  return blob;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD — triggers browser file save
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
// PRINT — renders PDF in a hidden iframe to suppress browser URL/header/footer.
// Falls back to download if iframe fails.
// ─────────────────────────────────────────────────────────────────────────────
export async function openPDFForPrint(blob, filename = 'document.pdf') {
  try {
    const url = URL.createObjectURL(blob);

    // Create a hidden iframe and load the PDF blob URL into it
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    await new Promise((resolve, reject) => {
      const cleanup = () => {
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (e) {}
          URL.revokeObjectURL(url);
        }, 60000);
      };

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          cleanup();
          resolve(true);
        } catch (e) {
          cleanup();
          reject(e);
        }
      };

      iframe.onerror = () => { cleanup(); reject(new Error('iframe load failed')); };
      iframe.src = url;

      // Safari fallback — onload may not fire for blob URLs
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          cleanup();
          resolve(true);
        } catch (e) {
          cleanup();
          reject(e);
        }
      }, 2000);
    });

    return true;
  } catch (error) {
    console.error('[PDF] openPDFForPrint failed, falling back to download:', error);
    downloadPDFBlob(blob, filename);
    return false;
  }
}