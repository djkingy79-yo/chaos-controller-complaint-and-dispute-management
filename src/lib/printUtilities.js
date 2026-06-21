/**
 * CHAOS CONTROLLER™ - DEPRECATED PRINT UTILITIES
 *
 * All functions in this file are DEPRECATED.
 * Use generateChaosDocumentPDF() from lib/pdfGenerator.js instead.
 * This file is kept only for reference — no app code imports from here.
 */

export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const DOCUMENT_CSS = '';
export const PRINT_CSS = '';

export function stripHtmlTags(content) {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
}

export function cleanContentForPrint(content) {
  if (!content) return '';
  return stripHtmlTags(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * @deprecated Use generateChaosDocumentPDF() instead. Never opens a blank window.
 */
export function printDocument(htmlContent) {
  console.error('[DEPRECATED] printDocument() called — use generateChaosDocumentPDF() instead. No blank window opened.');
}

/**
 * @deprecated Use generateChaosDocumentPDF() instead.
 */
export function printTableDocument() {
  console.error('[DEPRECATED] printTableDocument() called — use generateChaosDocumentPDF() instead. No blank window opened.');
}

/**
 * @deprecated Use generateChaosDocumentPDF() instead.
 */
export function buildFormalLetter() {
  console.error('[DEPRECATED] buildFormalLetter() called — use generateChaosDocumentPDF() instead.');
  return '';
}

/**
 * @deprecated Use generateChaosDocumentPDF() instead.
 */
export function printLetter() {
  console.error('[DEPRECATED] printLetter() called — use generateChaosDocumentPDF() instead. No blank window opened.');
}