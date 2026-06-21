/**
 * CHAOS CONTROLLER™ - PRINT & DOCUMENT RENDERING UTILITIES
 * 
 * FROZEN - DO NOT MODIFY
 * All document rendering must use these standardized utilities.
 * 
 * Standards:
 * - 25mm margins on all sides
 * - 60px header/footer banners with 100% background scaling
 * - Plain-text rendering using <pre> tags with white-space: pre-wrap
 * - Times New Roman font, 10pt body, 1.2 line-height
 * - No HTML tags in letter content
 * - No URLs in printed output
 */

// ─────────────────────────────────────────────────────────────────────────────
// BANNER ASSETS (DO NOT CHANGE)
// ─────────────────────────────────────────────────────────────────────────────
export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// PRINT CSS (FROZEN - USE IN ALL PRINT WINDOWS)
// ─────────────────────────────────────────────────────────────────────────────
export const PRINT_CSS = `
  @page {
    margin: 25mm 25mm 25mm 25mm;
    size: A4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page:first { margin: 25mm 25mm 25mm 25mm; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { margin-top: 25mm !important; margin-bottom: 25mm !important; margin-left: 25mm !important; margin-right: 25mm !important; }
    body { -webkit-print-header: "" !important; -webkit-print-footer: "" !important; }
    nav, header, footer, button, [class*="banner"], .letterhead-banner, .letterhead-header, .letterhead-footer { display: none !important; }
    a[href]:after, a[href] { content: none !important; display: none !important; }
  }
  body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.2; }
  .print-content { margin: 0 25mm; padding: 0; }
  h1 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: #000; }
  h2 { font-size: 11pt; font-weight: bold; margin-bottom: 10pt; color: #000; }
  table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
  th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; }
  td { padding: 3pt 6pt; border-bottom: none; font-size: 10pt; color: #000; }
  pre { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 10pt; line-height: 1.2; margin: 0; color: #000; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS (FROZEN)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip all HTML tags from content for clean plain-text rendering
 * @param {string} content - Raw content that may contain HTML
 * @returns {string} - Clean plain text
 */
export function stripHtmlTags(content) {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
}

/**
 * Clean content for print - strips HTML and normalizes line breaks
 * @param {string} content - Raw content
 * @returns {string} - Cleaned content ready for print
 */
export function cleanContentForPrint(content) {
  if (!content) return '';
  const stripped = stripHtmlTags(content);
  return stripped.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Open a print window with standardized styling
 * @param {string} title - Document title
 * @param {string} bodyHtml - HTML content for the body
 * @param {string} customCss - Optional additional CSS (appended to standard PRINT_CSS)
 * @returns {Window} - The print window reference
 */
export function openPrintWindow(title, bodyHtml, customCss = '') {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>${PRINT_CSS}${customCss}</style>
  </head><body>
    <div class="letterhead-header"></div>
    ${bodyHtml}
    <div class="letterhead-footer"></div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
  return win;
}

/**
 * Build a complete print document with header, content, and footer
 * @param {Object} options - Print options
 * @param {string} options.title - Document title
 * @param {string} options.content - Main content (plain text or HTML)
 * @param {string} options.contentType - 'pre' for plain text, 'html' for formatted content
 * @param {string} options.customCss - Optional additional CSS
 * @returns {string} - Complete HTML document
 */
export function buildPrintDocument({ title, content, contentType = 'pre', customCss = '' }) {
  const cleanContent = contentType === 'pre' ? cleanContentForPrint(content) : content;
  const contentTag = contentType === 'pre' 
    ? `<pre class="print-content" style="white-space:pre-wrap;margin:0 25mm;">${cleanContent}</pre>`
    : `<div class="print-content" style="margin:0 25mm;">${content}</div>`;
  
  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>${PRINT_CSS}${customCss}</style>
  </head><body>
    <div class="letterhead-header"></div>
    ${contentTag}
    <div class="letterhead-footer"></div>
  </body></html>`;
}

/**
 * Print a letter with standardized formatting
 * @param {string} title - Letter title
 * @param {string} letterContent - Letter content (may contain HTML)
 * @param {Array} continuationPages - Optional array of continuation page content strings
 */
export function printLetter(title, letterContent, continuationPages = []) {
  const cleanContent = cleanContentForPrint(letterContent);
  const lines = cleanContent.split('\n');
  const firstPageLines = lines.slice(0, 45);
  const remainingLines = lines.slice(45);
  
  const continuationHTML = continuationPages.length > 0 
    ? continuationPages.map(chunk => `
        <div class="letter-continuation" style="page-break-before:always;min-height:297mm;">
          <div class="letterhead-header"></div>
          <pre style="margin:0 25mm;white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:10pt;line-height:1.2;">${chunk}</pre>
        </div>`).join('')
    : remainingLines.length > 0 ? `
        <div class="letter-continuation" style="page-break-before:always;min-height:297mm;">
          <div class="letterhead-header"></div>
          <pre style="margin:0 25mm;white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:10pt;line-height:1.2;">${remainingLines.join('\n')}</pre>
        </div>` 
    : '';
  
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      ${PRINT_CSS}
      .letter-page { min-height: 297mm; }
      .letter-continuation { background: white; }
    </style>
  </head><body>
    <div class="letter-page">
      <div class="letterhead-header"></div>
      <pre class="print-content" style="white-space:pre-wrap;margin:0 25mm;">${firstPageLines.join('\n')}</pre>
      <div class="letterhead-footer"></div>
    </div>
    ${continuationHTML}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

/**
 * Print a table-based document (timeline, evidence, checklist, etc.)
 * @param {string} title - Document title
 * @param {string} heading - Main heading
 * @param {string} subheading - Optional subheading
 * @param {string} tableRows - HTML table rows (<tr>...</tr>)
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// FROZEN - DO NOT MODIFY BELOW THIS LINE
// ─────────────────────────────────────────────────────────────────────────────
export const VERSION = '1.0.0-frozen';
export const FROZEN_DATE = '2026-06-21';