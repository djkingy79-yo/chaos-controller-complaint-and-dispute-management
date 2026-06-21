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
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.2; }

    /* Page 1: Full letterhead with header image - thinner but full width */
    .letter-page {
      position: relative;
      width: 100%;
      min-height: 297mm;
      background: white;
    }
    
    .letterhead-header {
      width: 100%;
      height: 60px;
      background-image: url('${HEADER_URL}');
      background-size: 100% 100%;
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
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center bottom;
    }

    /* Letter body - compact spacing, left-aligned addresses */
    .letter-content {
      position: relative;
      padding: 0 25mm 20mm 25mm;
      margin: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.2;
      width: 100%;
    }
    
    .letter-content p {
      margin: 0 0 8pt 0;
      line-height: 1.2;
    }
    
    /* Date line - left aligned at top */
    .letter-date {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      margin: 0 0 8pt 0;
      text-align: left;
    }
    
    /* Sender address - LEFT aligned, ZERO spacing between lines */
    .sender-address {
      text-align: left;
      line-height: 1.0;
      margin: 0 0 8pt 0;
    }
    
    /* Receiver address - LEFT aligned under sender, ZERO spacing */
    .receiver-address {
      text-align: left;
      line-height: 1.0;
      margin: 0 0 8pt 0;
    }
    
    /* Address blocks - single spaced, no gaps */
    .address-block { line-height: 1.0; margin: 0 0 6pt 0; }
    .address-line { line-height: 1.0; margin: 0; }
    
    /* Section headings */
    h2.section-title, .section-heading {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      font-weight: bold;
      margin: 10pt 0 6pt 0;
    }

    /* Continuation pages */
    .letter-continuation {
      position: relative;
      width: 100%;
      min-height: 297mm;
      page-break-before: always;
      background: white;
    }
    
    .continuation-header {
      width: 100%;
      height: 60px;
      background-image: url('${CONTINUATION_PAGE_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center top;
      margin-bottom: 0;
    }
    
    .continuation-content {
      padding: 0 25mm 20mm 25mm;
      margin-top: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.2;
    }
    
    .continuation-content p {
      margin: 0 0 8pt 0;
      line-height: 1.2;
    }

    pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.2;
      margin: 0;
      color: #000;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; }
    td { padding: 3pt 6pt; border-bottom: none; vertical-align: top; font-size: 10pt; }
  `;
}

export function buildLetterheadHTML() { return ""; }