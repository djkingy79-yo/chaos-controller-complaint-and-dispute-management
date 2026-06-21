/**
 * CHAOS CONTROLLER™ - PRINT & DOCUMENT RENDERING UTILITIES
 * 
 * Legacy print utilities - now uses shared PDF generator.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BANNER ASSETS
// ─────────────────────────────────────────────────────────────────────────────
export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

export const DOCUMENT_CSS = `
  @page { margin: 25mm; size: A4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    nav, header, footer, aside, button, [class*="chrome"], [class*="url"], [class*="timestamp"], [class*="browser"], iframe { display: none !important; }
    a[href]:after, a[href] { content: none !important; display: none !important; }
  }
  html, body { margin: 0; padding: 0; background: white; width: 100%; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.3; }
  .letterhead-header { width: 100%; height: 60px; background-image: url('${LETTERHEAD_URL}'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; }
  .letterhead-footer { width: 100%; height: 60px; background-image: url('${FOOTER_URL}'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; }
  .document-content { width: 100%; max-width: 100%; margin: 0; padding: 0 17.5mm; box-sizing: border-box; }
  .section-title { font-size: 13pt; font-weight: bold; margin: 12pt 0 8pt 0; color: #000; border-bottom: 1px solid #000; padding-bottom: 4pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 10pt; font-size: 10pt; }
  th { background: white; text-align: left; padding: 4pt 6pt; font-weight: bold; border-bottom: 1px solid #000; font-size: 10pt; color: #000; }
  td { padding: 3pt 6pt; border-bottom: none; vertical-align: top; font-size: 10pt; color: #000; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Times New Roman', Times, serif; font-size: 10pt; line-height: 1.2; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function stripHtmlTags(content) {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
}

export function cleanContentForPrint(content) {
  if (!content) return '';
  return stripHtmlTags(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function printTableDocument({ title, heading, subheading = '', tableRows }) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      @page { margin: 25mm; size: A4; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        nav, header, footer, aside, button { display: none !important; }
      }
      body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.3; background: white; }
      .letterhead-header { width: 100%; height: 60px; background-image: url('${LETTERHEAD_URL}'); background-size: 100% 100%; }
      .letterhead-footer { width: 100%; height: 60px; background-image: url('${FOOTER_URL}'); background-size: 100% 100%; }
      .print-content { margin: 0 25mm; }
      h1 { font-size: 13pt; font-weight: bold; margin: 12pt 0 8pt 0; }
      h2 { font-size: 12pt; font-weight: bold; margin: 10pt 0 6pt 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 10pt; font-size: 10pt; }
      th { background: white; text-align: left; padding: 4pt 6pt; font-weight: bold; border-bottom: 1px solid #000; }
      td { padding: 3pt 6pt; border-bottom: none; vertical-align: top; font-size: 10pt; }
    </style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="print-content">
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

export function buildFormalLetter({ title, date, senderDetails, recipientDetails, reLine, greeting, body, closing, signature }) {
  const cleanBody = cleanContentForPrint(body);
  const senderLines = senderDetails.split('\n').filter(l => l.trim());
  const recipientLines = recipientDetails.split('\n').filter(l => l.trim());
  
  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      @page { margin: 0; size: A4; }
      @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
      body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.3; margin: 0; padding: 0; }
      .letterhead-header { width: 100%; height: 60px; background-image: url('${LETTERHEAD_URL}'); background-size: 100% 100%; }
      .letterhead-footer { width: 100%; height: 60px; background-image: url('${FOOTER_URL}'); background-size: 100% 100%; }
      .document-content { padding: 0 17.5mm; }
      .blank-line { line-height: 1.3; }
      .date-line { font-size: 11pt; margin: 0 0 1em 0; }
      .party-details { display: flex; justify-content: space-between; margin: 0 0 1em 0; }
      .sender-details { text-align: right; }
      .recipient-details { text-align: left; }
      .party-line { line-height: 1.1; font-size: 10.5pt; margin: 0; }
      .re-line { font-size: 11pt; font-weight: bold; margin: 0 0 1em 0; }
      .greeting { font-size: 11pt; margin: 0 0 1em 0; }
      .letter-body { font-size: 11pt; line-height: 1.3; margin: 0 0 1em 0; white-space: pre-wrap; }
      .closing { font-size: 11pt; margin: 0 0 0.5em 0; }
      .signature { font-size: 11pt; margin: 0; }
    </style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="document-content">
      <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
      <div class="date-line">${date}</div>
      <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
      <div class="party-details">
        <div class="sender-details">${senderLines.map(l => `<div class="party-line">${l}</div>`).join('')}</div>
        <div class="recipient-details">${recipientLines.map(l => `<div class="party-line">${l}</div>`).join('')}</div>
      </div>
      <div class="blank-line"></div><div class="blank-line"></div>
      <div class="re-line">${reLine}</div>
      <div class="blank-line"></div><div class="blank-line"></div>
      <div class="greeting">${greeting}</div>
      <div class="blank-line"></div><div class="blank-line"></div>
      <div class="letter-body">${cleanBody}</div>
      <div class="blank-line"></div><div class="blank-line"></div>
      <div class="closing">${closing}</div>
      <div class="signature">${signature}</div>
    </div>
    <div class="letterhead-footer"></div>
  </body></html>`;
}

export function printDocument(htmlContent) {
  const win = window.open('', '_blank');
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
  return win;
}

export function printLetter({ title, letterContent }) {
  const html = buildFormalLetter({
    title,
    date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    senderDetails: 'CHAOS CONTROLLER™',
    recipientDetails: '',
    reLine: 'Re: Formal Complaint',
    greeting: 'Dear Sir/Madam,',
    body: letterContent,
    closing: 'Yours sincerely,',
    signature: '',
  });
  printDocument(html);
}