/**
 * CHAOS CONTROLLER™ — DOCUMENT FORMAT ENGINE
 *
 * All document generation must use generateChaosDocumentPDF() from lib/pdfGenerator.
 * This file re-exports only the safe, non-window-opening utilities.
 * printDocument, printLetter, printTableDocument are REMOVED — they opened blank windows.
 */

export { generateChaosDocumentPDF, cleanForPDF, downloadPDFBlob, LETTERHEAD_URL, FOOTER_URL } from './pdfGenerator';
export { stripHtmlTags, cleanContentForPrint } from './printUtilities';