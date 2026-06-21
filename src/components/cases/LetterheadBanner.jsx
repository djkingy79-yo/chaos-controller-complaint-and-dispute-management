// Official header - full-width letterhead for page 1
const HEADER_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg";
// Official footer - black bar with contact info
const FOOTER_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/af960efe6_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg";
// Minimal continuation header - pages 2+
const CONTINUATION_PAGE_URL = HEADER_URL;

// Export for use in PrintBundle and other print contexts
export { HEADER_URL as LETTERHEAD_URL, FOOTER_URL, CONTINUATION_PAGE_URL };

export const CONTACT = {
  website: "chaoscontroller.com.au",
  email: "chaoscontrollerapp@gmail.com",
};

// React letterhead — full-page background letterhead image shown in the app preview
export function LetterheadHeader() {
  return (
    <div style={{ lineHeight: 0 }}>
      <img
        src={HEADER_URL}
        alt="Chaos Controller Letterhead"
        style={{ width: "100%", display: "block" }}
      />
    </div>
  );
}

// Print styles — full letterhead on page 1 only (with header and footer), minimal header on subsequent pages
export function getLetterPageStyles() {
  return `
    @page { margin: 0; size: A4; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .letter-page, .letter-continuation { break-inside: avoid; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.6; }

    /* Page 1: Full letterhead with header image */
    .letter-page {
      position: relative;
      width: 100%;
      min-height: 297mm;
      background: white;
    }
    
    .letterhead-header {
      width: 100%;
      height: 180px;
      background-image: url('${HEADER_URL}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center top;
    }
    
    .letterhead-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60px;
      background-image: url('${FOOTER_URL}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center bottom;
    }

    /* Letter body with EXACT 1.5 inch margins all sides */
    .letter-content {
      position: relative;
      padding: 1.5in 1.5in 1.5in 1.5in;
      margin: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #000;
      line-height: 1.6;
      width: 100%;
    }
    
    /* Date line - Heading 1 style - bold, left aligned at top */
    .letter-date {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      font-weight: bold;
      margin: 0 0 12pt 0;
      text-align: left;
    }
    
    /* Sender address - left aligned */
    .sender-address {
      text-align: left;
      line-height: 1.6;
      margin: 0 0 12pt 0;
    }
    
    /* Receiver address - right aligned */
    .receiver-address {
      text-align: right;
      line-height: 1.6;
      margin: 0 0 12pt 0;
    }
    
    /* Section headings - Heading 2 style */
    h2.section-title, .section-heading {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      font-weight: bold;
      margin: 12pt 0 8pt 0;
    }

    /* Continuation pages — plain white with minimal header */
    .letter-continuation {
      position: relative;
      width: 100%;
      min-height: 297mm;
      page-break-before: always;
      background: white;
    }
    
    .continuation-header {
      width: 100%;
      height: 40px;
      background-image: url('${CONTINUATION_PAGE_URL}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center top;
      margin-bottom: 10pt;
    }
    
    .continuation-content {
      padding: 0 1.5in 1.5in 1.5in;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #000;
      line-height: 1.6;
    }

    pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      margin: 0;
      color: #000;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 11pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 11pt; font-weight: bold; border-bottom: 1px solid #000; }
    td { padding: 3pt 6pt; border-bottom: none; vertical-align: top; font-size: 11pt; }
    p { margin: 0 0 10pt 0; line-height: 1.6; }
    
    /* Address blocks - single spaced */
    .address-block { line-height: 1.6; margin: 0 0 10pt 0; }
    .address-line { line-height: 1.6; margin: 0; }
  `;
}

export function buildLetterheadHTML() { return ""; }