/**
 * CHAOS CONTROLLER™ - PRINT & DOCUMENT RENDERING UTILITIES
 * 
 * DEPRECATED — Use lib/documentFormatEngine.js instead.
 * This file now re-exports from the universal document format engine.
 * 
 * NEW STANDARDS (via documentFormatEngine.js):
 * - A4 size, professional business/legal layout
 * - Margins: Left 1.75cm, Right 1.75cm, Top 1.25cm, Bottom 1.25cm
 * - Font: Times New Roman 11pt
 * - Header: Chaos Controller letterhead (60px)
 * - Spacing: 3 blank lines after header, 3 after date, 2 after party details, 2 after greeting
 * - Party details: Sender RIGHT aligned, Recipient LEFT aligned
 * - Footer: Chaos Controller footer (60px)
 */

// ─────────────────────────────────────────────────────────────────────────────
// BANNER ASSETS (DO NOT CHANGE)
// ─────────────────────────────────────────────────────────────────────────────
export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORT FROM UNIVERSAL DOCUMENT FORMAT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// All new code should use lib/documentFormatEngine.js directly
import { DOCUMENT_CSS } from './documentFormatEngine';

export {
  buildFormalLetter,
  printDocument,
  printLetter,
  cleanContentForPrint,
  stripHtmlTags,
  LETTERHEAD_URL as ENGINE_LETTERHEAD,
  FOOTER_URL as ENGINE_FOOTER,
} from './documentFormatEngine';

export const PRINT_CSS = DOCUMENT_CSS;

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY HELPER FUNCTIONS (for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export function printTableDocument({ title, heading, subheading = '', tableRows }) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>${PRINT_CSS}</style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="print-content" style="margin:0 25mm;">
      <h1>${heading}</h1>
      ${subheading ? `<h2>${subheading}</h2>` : ''}
      <table>${tableRows}</table>
    </div>
    <div class="letterhead-footer"></div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}