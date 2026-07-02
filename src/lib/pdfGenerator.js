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
 * page DOM trees BEFORE any image is captured, so paragraphs/headings/
 * bullets/rows are never sliced mid-element. The block marked
 * data-paginate-body="true" is the only splittable region; everything before
 * it (date/address/title/subject/rule) stays on page 1 only.
 *
 * The large image header banner is rendered ONLY on page 1 — continuation
 * pages get no header band at all, which frees up extra body height and
 * matches the "header only on first page" requirement.
 */
function buildPaginatedPages(pageEl) {
  const [headerEl, contentEl, footerEl] = Array.from(pageEl.children);
  if (!headerEl || !contentEl || !footerEl) return [pageEl];

  const headerH = headerEl.getBoundingClientRect().height || 0;
  const footerH = footerEl.getBoundingClientRect().height || 0;
  const vPad = verticalPadding(contentEl);
  // Floor of 250px guards against a bad measurement ever collapsing the
  // printable area to near-zero and cascading into a run of near-blank pages.
  const availableHeightPage1 = Math.max(A4_PX_HEIGHT - headerH - footerH - vPad - SAFETY_PX, 250);
  const availableHeightNextPages = Math.max(A4_PX_HEIGHT - footerH - vPad - SAFETY_PX, 250);

  const allChildren = Array.from(contentEl.children);
  const bodyIdx = allChildren.findIndex((c) => c.getAttribute && c.getAttribute('data-paginate-body') === 'true');

  const headBlocks = bodyIdx === -1 ? [] : allChildren.slice(0, bodyIdx);
  const bodyWrapperTemplate = bodyIdx === -1 ? null : allChildren[bodyIdx];
  const atomicUnits = bodyWrapperTemplate ? Array.from(bodyWrapperTemplate.children) : allChildren;

  const headHeight = headBlocks.reduce((sum, b) => sum + b.getBoundingClientRect().height, 0);

  // Group each heading together with the unit immediately following it so a
  // heading can NEVER be split from its first line of content — this removes
  // the old "orphan heading" heuristic (the source of near-blank pages) and
  // replaces it with a hard guarantee: a group is placed as a whole or moved
  // to the next page as a whole.
  const groups = [];
  for (let i = 0; i < atomicUnits.length; i++) {
    const unit = atomicUnits[i];
    const isHeading = unit.getAttribute && unit.getAttribute('data-heading') === 'true';
    if (isHeading && atomicUnits[i + 1]) {
      groups.push([unit, atomicUnits[i + 1]]);
      i++; // consumed the next unit as part of this group
    } else {
      groups.push([unit]);
    }
  }

  const pageGroups = [];
  let current = [];
  let currentHeight = headHeight;
  let isFirstPage = true;

  groups.forEach((group) => {
    const groupHeight = group.reduce((sum, u) => sum + u.getBoundingClientRect().height, 0);
    const availableHeight = isFirstPage ? availableHeightPage1 : availableHeightNextPages;

    if (currentHeight + groupHeight > availableHeight && current.length > 0) {
      pageGroups.push({ head: isFirstPage ? headBlocks : [], body: current, isFirstPage });
      current = [];
      currentHeight = 0;
      isFirstPage = false;
    }

    current.push(...group);
    currentHeight += groupHeight;
  });
  if (current.length > 0) {
    pageGroups.push({ head: isFirstPage ? headBlocks : [], body: current, isFirstPage });
  }

  return pageGroups.map(({ head, body, isFirstPage: isFirst }) => {
    const clonedPage = pageEl.cloneNode(false);
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

    // Header banner only on page 1 — continuation pages carry no header band.
    if (isFirst) {
      clonedPage.appendChild(headerEl.cloneNode(true));
    }
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
// PRINT — opens the generated PDF blob as the top-level document of a new tab
// and prints THAT window.
//
// WHY NOT A HIDDEN IFRAME: Safari has a long-standing bug where calling
// `iframe.contentWindow.print()` on an iframe whose content is a native PDF
// (rendered via the browser's built-in PDF plugin, not HTML) does NOT print
// the PDF — it prints the PARENT page instead. That parent page is the app's
// own webpage, which is why the print preview showed the browser's page
// title/URL/date footer and only "1 of 1" (the on-screen app page), even
// though the downloaded blob had multiple pages. Chrome happens to handle
// this case correctly, which is why the bug only showed up in Safari.
//
// FIX: open the blob URL with window.open() so the PDF becomes the actual
// top-level document being printed. Printing a native PDF document never
// adds browser page-title/URL/date headers (those are only injected by the
// browser when printing an HTML page) — so the print output is the PDF
// itself, correctly multi-paged, exactly like the Download PDF button
// produces from the SAME blob.
// ─────────────────────────────────────────────────────────────────────────────
export async function openPDFForPrint(blob, filename = 'document.pdf') {
  try {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      // Popup blocked — fall back to a plain download so the user still gets the PDF.
      URL.revokeObjectURL(url);
      downloadPDFBlob(blob, filename);
      return false;
    }

    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        // Window may already be closed by the user — nothing to do.
      }
    };

    // The native PDF viewer's 'load' event isn't reliable across browsers for
    // blob URLs, so we fire on load AND on a fallback timer (whichever first).
    printWindow.addEventListener?.('load', triggerPrint, { once: true });
    setTimeout(triggerPrint, 800);

    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch (error) {
    console.error('[PDF] openPDFForPrint failed, falling back to download:', error);
    downloadPDFBlob(blob, filename);
    return false;
  }
}