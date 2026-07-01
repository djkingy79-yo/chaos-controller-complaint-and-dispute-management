/**
 * CHAOS CONTROLLER™ — THE ONLY PDF ENGINE IN THIS APP
 *
 * Every export (letter preview/download/print/email, dashboard report,
 * AI analysis, case transfer package) captures a live DOM node built from
 * components/letters/LetterDocument.jsx or components/reports/ReportDocument.jsx
 * via html2canvas, then paginates it into an A4 PDF here.
 *
 * captureDocumentPDF() is the ONLY PDF generation function in the app.
 * Do not add a second renderer or a second jsPDF text-drawing path —
 * extend LetterDocument / ReportDocument instead.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

const A4_W = 210; // mm
const A4_H = 297; // mm
const PAGE_NUM_ZONE = 6; // mm reserved at the very bottom for the page number ONLY (no other text)

// Page geometry in the document's own pixel space (documents are authored at 96dpi, 794px wide = 210mm)
const A4_PX_HEIGHT = 1122; // 297mm at 96dpi
const SAFETY_PX = 6; // small buffer so content never sits flush against the footer

// Wait for every <img> inside a node to finish loading (or time out) before
// capture — prevents blank/clipped images on the first render of a hidden node.
function waitForImages(el, timeoutMs = 5000) {
  const imgs = Array.from(el.querySelectorAll('img'));
  return Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, timeoutMs);
    });
  }));
}

function verticalPadding(el) {
  const cs = window.getComputedStyle(el);
  return (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
}

/**
 * Pre-capture pagination — splits a document's content into multiple full
 * page DOM trees (each with its own header + footer) BEFORE any image is
 * captured, so paragraphs/headings/bullets/rows are never sliced mid-element.
 * The block marked data-paginate-body="true" is the only splittable region;
 * everything before it (date/address/title/subject/rule) stays on page 1 only.
 */
function buildPaginatedPages(pageEl) {
  const [headerEl, contentEl, footerEl] = Array.from(pageEl.children);
  if (!headerEl || !contentEl || !footerEl) return [pageEl];

  const headerH = headerEl.getBoundingClientRect().height || 0;
  const footerH = footerEl.getBoundingClientRect().height || 0;
  const vPad = verticalPadding(contentEl);
  const availableHeight = A4_PX_HEIGHT - headerH - footerH - vPad - SAFETY_PX;

  const allChildren = Array.from(contentEl.children);
  const bodyIdx = allChildren.findIndex((c) => c.getAttribute && c.getAttribute('data-paginate-body') === 'true');

  const headBlocks = bodyIdx === -1 ? [] : allChildren.slice(0, bodyIdx);
  const bodyWrapperTemplate = bodyIdx === -1 ? null : allChildren[bodyIdx];
  const atomicUnits = bodyWrapperTemplate ? Array.from(bodyWrapperTemplate.children) : allChildren;

  const headHeight = headBlocks.reduce((sum, b) => sum + b.getBoundingClientRect().height, 0);

  const pageGroups = [];
  let current = [];
  let currentHeight = headHeight;
  let isFirstPage = true;

  atomicUnits.forEach((unit, idx) => {
    const h = unit.getBoundingClientRect().height;
    const isHeading = unit.getAttribute && unit.getAttribute('data-heading') === 'true';
    const isLastUnit = idx === atomicUnits.length - 1;

    if (currentHeight + h > availableHeight && current.length > 0) {
      pageGroups.push({ head: isFirstPage ? headBlocks : [], body: current });
      current = [];
      currentHeight = 0;
      isFirstPage = false;
    }

    // Never leave a heading alone at the bottom of a page with its content
    // pushed to the next page — move the heading itself down instead.
    if (isHeading && !isLastUnit && current.length > 0 && (availableHeight - currentHeight - h) < 40) {
      pageGroups.push({ head: isFirstPage ? headBlocks : [], body: current });
      current = [];
      currentHeight = 0;
      isFirstPage = false;
    }

    current.push(unit);
    currentHeight += h;
  });
  pageGroups.push({ head: isFirstPage ? headBlocks : [], body: current });

  return pageGroups.map(({ head, body }) => {
    const clonedPage = pageEl.cloneNode(false);
    const clonedHeader = headerEl.cloneNode(true);
    const clonedContent = contentEl.cloneNode(false);
    const clonedFooter = footerEl.cloneNode(true);

    head.forEach((n) => clonedContent.appendChild(n.cloneNode(true)));
    if (bodyWrapperTemplate) {
      const wrapper = bodyWrapperTemplate.cloneNode(false);
      body.forEach((n) => wrapper.appendChild(n.cloneNode(true)));
      clonedContent.appendChild(wrapper);
    } else {
      body.forEach((n) => clonedContent.appendChild(n.cloneNode(true)));
    }

    clonedPage.appendChild(clonedHeader);
    clonedPage.appendChild(clonedContent);
    clonedPage.appendChild(clonedFooter);
    return clonedPage;
  });
}

/**
 * captureDocumentPDF — the ONLY PDF generation function in the app.
 * Paginates the document BEFORE capture (never splits a paragraph/heading/
 * bullet/row), captures each page separately so the header and footer band
 * appear cleanly on every page with no overlap, and stamps only a page
 * number — no generated-by text, case IDs, timestamps or debug metadata.
 */
export async function captureDocumentPDF(domNode) {
  if (!domNode) throw new Error('captureDocumentPDF: domNode is null');

  const el = domNode.querySelector ? (domNode.querySelector('.letter-page') || domNode) : domNode;
  await waitForImages(el);

  const pages = buildPaginatedPages(el);

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:-10000px;left:0;z-index:-1;pointer-events:none;background:#fff;';
  document.body.appendChild(host);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalPages = pages.length;

  try {
    for (let i = 0; i < totalPages; i++) {
      const pageEl = pages[i];
      host.innerHTML = '';
      host.appendChild(pageEl);
      await waitForImages(pageEl);

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: pageEl.scrollWidth || 794,
        width: pageEl.scrollWidth || 794,
        height: pageEl.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgPxW = canvas.width;
      const imgPxH = canvas.height;
      // Scale to fill the printable width; height follows the image's own
      // aspect ratio and is capped so it never overlaps the page-number zone —
      // this never crops or stretches the page content.
      const scaledH = Math.min((imgPxH / imgPxW) * A4_W, A4_H - PAGE_NUM_ZONE);

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_W, scaledH);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text(`Page ${i + 1} of ${totalPages}`, A4_W - 10, A4_H - 3, { align: 'right' });
      pdf.setTextColor(0);
    }
  } finally {
    document.body.removeChild(host);
  }

  return pdf.output('blob');
}

// Backward-compatible alias — same function, used by letter call sites.
export const captureLetterDocumentPDF = captureDocumentPDF;

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