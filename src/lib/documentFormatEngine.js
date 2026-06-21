/**
 * CHAOS CONTROLLER™ — UNIVERSAL DOCUMENT FORMAT ENGINE
 * 
 * SINGLE SOURCE OF TRUTH for all document generation.
 * ALL letters, snapshots, summaries, exports MUST use these functions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────────────────────────────────────
export const LETTERHEAD_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';
export const FOOTER_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT CSS (UNIVERSAL)
// ─────────────────────────────────────────────────────────────────────────────
export const DOCUMENT_CSS = `
  @page {
    margin: 12.5mm 17.5mm 12.5mm 17.5mm;
    size: A4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { -webkit-print-header: "" !important; -webkit-print-footer: "" !important; }
    nav, header, footer, button, [class*="chrome"], [class*="url"], [class*="timestamp"] { display: none !important; }
    a[href]:after, a[href] { content: none !important; display: none !important; }
  }
  html, body { margin: 0; padding: 0; background: white; width: 100%; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.3; }
  
  .letterhead-header { width: 100%; height: 60px; background-image: url('${LETTERHEAD_URL}'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; margin: 0; padding: 0; }
  .letterhead-footer { width: 100%; height: 60px; background-image: url('${FOOTER_URL}'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center center; margin: 0; padding: 0; }
  
  .document-content { width: 100%; max-width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
  .blank-line { margin: 0; padding: 0; line-height: 1.3; }
  
  .date-line { font-size: 11pt; margin: 0 0 1em 0; text-align: left; }
  
  .party-details { display: flex; justify-content: space-between; margin: 0 0 1em 0; }
  .sender-details { text-align: right; margin: 0; }
  .recipient-details { text-align: left; margin: 0; }
  .party-line { margin: 0; padding: 0; line-height: 1.1; font-size: 10.5pt; }
  
  .re-line { font-size: 11pt; font-weight: bold; margin: 0 0 1em 0; }
  .greeting { font-size: 11pt; margin: 0 0 1em 0; }
  
  .letter-body { font-size: 11pt; line-height: 1.3; margin: 0 0 1em 0; white-space: pre-wrap; word-wrap: break-word; }
  .paragraph { margin: 0 0 1em 0; }
  
  .closing { font-size: 11pt; margin: 0 0 0.5em 0; }
  .signature { font-size: 11pt; margin: 0; }
  
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; margin: 0; padding: 0; color: #000; width: 100%; }
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOCUMENT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a complete formal letter document
 * @param {Object} options
 * @param {string} options.title - Document title for window
 * @param {string} options.date - Date line (e.g., "21 June 2026")
 * @param {string} options.senderDetails - Sender details (multi-line string)
 * @param {string} options.recipientDetails - Recipient details (multi-line string)
 * @param {string} options.reLine - RE: subject line
 * @param {string} options.greeting - Greeting (e.g., "Dear Sir/Madam,")
 * @param {string} options.body - Letter body text
 * @param {string} options.closing - Closing (e.g., "Yours sincerely,")
 * @param {string} options.signature - Signature name/phone
 * @param {string} options.customCss - Optional additional CSS
 */
export function buildFormalLetter({
  title,
  date,
  senderDetails,
  recipientDetails,
  reLine,
  greeting,
  body,
  closing,
  signature,
  customCss = '',
}) {
  const cleanBody = cleanContentForPrint(body);
  
  const senderLines = senderDetails.split('\n').filter(l => l.trim());
  const recipientLines = recipientDetails.split('\n').filter(l => l.trim());
  
  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>${DOCUMENT_CSS}${customCss}</style>
  </head><body>
    <div class="letterhead-header"></div>
    <div class="document-content" style="padding: 0 17.5mm;">
      
      <!-- 3 blank lines after header -->
      <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
      
      <!-- Date -->
      <div class="date-line">${date}</div>
      
      <!-- 3 blank lines after date -->
      <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
      
      <!-- Party Details -->
      <div class="party-details">
        <div class="sender-details">
          ${senderLines.map(l => `<div class="party-line">${l}</div>`).join('')}
        </div>
        <div class="recipient-details">
          ${recipientLines.map(l => `<div class="party-line">${l}</div>`).join('')}
        </div>
      </div>
      
      <!-- 2 blank lines after party details -->
      <div class="blank-line"></div><div class="blank-line"></div>
      
      <!-- RE Line -->
      <div class="re-line">${reLine}</div>
      
      <!-- 2 blank lines after RE -->
      <div class="blank-line"></div><div class="blank-line"></div>
      
      <!-- Greeting -->
      <div class="greeting">${greeting}</div>
      
      <!-- 2 blank lines after greeting -->
      <div class="blank-line"></div><div class="blank-line"></div>
      
      <!-- Body -->
      <div class="letter-body">${cleanBody}</div>
      
      <!-- 2 blank lines after body -->
      <div class="blank-line"></div><div class="blank-line"></div>
      
      <!-- Closing -->
      <div class="closing">${closing}</div>
      
      <!-- Signature -->
      <div class="signature">${signature}</div>
      
    </div>
    <div class="letterhead-footer"></div>
  </body></html>`;
}

/**
 * Print a document
 */
export function printDocument(htmlContent) {
  const win = window.open('', '_blank');
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
  return win;
}

/**
 * Parse a plain-text letter and render it with formal formatting
 */
export function renderPlainLetter({ title, letterContent }) {
  const clean = cleanContentForPrint(letterContent);
  const lines = clean.split('\n');
  
  let date = '';
  let senderLines = [];
  let recipientLines = [];
  let reLine = '';
  let greeting = '';
  let bodyLines = [];
  let closing = '';
  let signatureLines = [];
  
  let state = 'date';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (state === 'sender' && senderLines.length > 0 && recipientLines.length === 0) {
        state = 'recipient';
      } else if (state === 'recipient' && recipientLines.length > 0) {
        state = 're';
      } else if (state === 're' && reLine) {
        state = 'greeting';
      } else if (state === 'greeting' && greeting) {
        state = 'body';
      } else if (state === 'body' && bodyLines.length > 0 && trimmed.match(/^(yours|dear|regards|sincerely|faithfully)/i)) {
        state = 'closing';
      }
      continue;
    }
    
    switch (state) {
      case 'date':
        date = trimmed;
        state = 'sender';
        break;
      case 'sender':
        if (trimmed.match(/^(re:|subject:)/i)) {
          reLine = trimmed;
          state = 're';
        } else if (trimmed.match(/^dear/i)) {
          greeting = trimmed;
          state = 'greeting';
        } else {
          senderLines.push(trimmed);
        }
        break;
      case 'recipient':
        if (trimmed.match(/^(re:|subject:)/i)) {
          reLine = trimmed;
          state = 're';
        } else if (trimmed.match(/^dear/i)) {
          greeting = trimmed;
          state = 'greeting';
        } else {
          recipientLines.push(trimmed);
        }
        break;
      case 're':
        reLine = trimmed;
        state = 'greeting';
        break;
      case 'greeting':
        greeting = trimmed;
        state = 'body';
        break;
      case 'body':
        if (trimmed.match(/^(yours|dear|regards|sincerely|faithfully)/i)) {
          closing = trimmed;
          state = 'signature';
        } else {
          bodyLines.push(trimmed);
        }
        break;
      case 'signature':
        signatureLines.push(trimmed);
        break;
    }
  }
  
  const body = bodyLines.join('\n\n');
  const signature = signatureLines.join('\n');
  
  return buildFormalLetter({
    title,
    date: date || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    senderDetails: senderLines.join('\n'),
    recipientDetails: recipientLines.join('\n'),
    reLine: reLine || 'Re: Formal Complaint',
    greeting: greeting || 'Dear Sir/Madam,',
    body,
    closing: closing || 'Yours sincerely,',
    signature,
  });
}

/**
 * Print a letter with automatic parsing
 */
export function printLetter({ title, letterContent }) {
  const html = renderPlainLetter({ title, letterContent });
  printDocument(html);
}