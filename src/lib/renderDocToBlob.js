/**
 * CHAOS CONTROLLER — headless renderer for the Case Transfer Package.
 *
 * Renders a LetterDocument / ReportDocument React element into a detached,
 * off-screen container and captures it via captureDocumentPDF — the SAME
 * pipeline used for the on-page preview/download/print/email flows. This is
 * the only way documents are rendered when there is no live on-page preview
 * to capture (e.g. building the 18-section transfer package in the background).
 */

import { createRoot } from 'react-dom/client';
import { captureDocumentPDF } from './pdfGenerator';

export async function renderDocToBlob(element, options = {}) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-10000px;left:0;z-index:-1;pointer-events:none;background:#fff;';
  document.body.appendChild(container);

  const root = createRoot(container);
  await new Promise((resolve) => {
    root.render(element);
    // Two rAFs — ensures React has committed and the browser has laid out the DOM
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  try {
    const node = container.firstElementChild || container;
    return await captureDocumentPDF(node, options);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}