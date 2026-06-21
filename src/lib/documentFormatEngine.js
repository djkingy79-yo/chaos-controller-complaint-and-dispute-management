/**
 * CHAOS CONTROLLER™ — UNIVERSAL DOCUMENT FORMAT ENGINE
 * 
 * Re-exports from unified PDF generator.
 * ALL letters, snapshots, summaries, exports MUST use generateChaosDocumentPDF() from lib/pdfGenerator.
 */

// Re-export unified PDF generator and assets
export { generateChaosDocumentPDF, cleanForPDF, LETTERHEAD_URL, FOOTER_URL } from './pdfGenerator';

// Re-export legacy helpers for backward compatibility
export { 
  stripHtmlTags, 
  cleanContentForPrint, 
  buildFormalLetter, 
  printDocument, 
  printLetter,
  PRINT_CSS,
  DOCUMENT_CSS
} from './printUtilities';