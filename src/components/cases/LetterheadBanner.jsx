// Full letterhead with header and footer - page 1 only (for preview)
const FULL_LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/06f2e0b00_E004AFA7-44DA-44FD-BE4D-38601D2B1F03.png";
// Minimal continuation header - pages 2+
const CONTINUATION_PAGE_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/08578d6a5_25C3D2EB-1058-4DE4-B540-D512DF00D788.png";
// Professional letterhead banner - smaller size for printed correspondence
const PROFESSIONAL_LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/06f2e0b00_E004AFA7-44DA-44FD-BE4D-38601D2B1F03.png";

// Export for use in PrintBundle and other print contexts
export { FULL_LETTERHEAD_URL as LETTERHEAD_URL, CONTINUATION_PAGE_URL };

export const CONTACT = {
  website: "chaoscontroller.com.au",
  email: "chaoscontrollerapp@gmail.com",
};

// React letterhead — full-page background letterhead image shown in the app preview
export function LetterheadHeader() {
  return (
    <div style={{ lineHeight: 0 }}>
      <img
        src={FULL_LETTERHEAD_URL}
        alt="Chaos Controller Letterhead"
        style={{ width: "100%", display: "block" }}
      />
    </div>
  );
}

// Print styles — full letterhead on page 1 only (with header and footer), minimal header on subsequent pages
export function getLetterPageStyles() {
  return `
    @page { margin: 1.5in 1.5in 1.5in 1.5in; size: A4; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .letter-page, .letter-continuation { break-inside: avoid; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; line-height: 1.0; }

    /* Page 1: Letterhead banner - smaller, professional size */
    .letter-page {
      position: relative;
      width: 100%;
      min-height: 297mm;
      background: white;
    }
    
    .letterhead-banner {
      width: 100%;
      height: 80px;
      background-image: url('${PROFESSIONAL_LETTERHEAD_URL}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center top;
      margin-bottom: 20pt;
    }

    /* Letter body with EXACT 1.5 inch margins all sides */
    .letter-content {
      position: relative;
      padding: 0;
      margin: 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.0;
      width: 100%;
    }
    
    /* Date line - Heading 1 style */
    .letter-date {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-weight: bold;
      margin: 0 0 12pt 0;
    }
    
    /* Section headings - Heading 2 style */
    h2.section-title, .section-heading {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: bold;
      margin: 10pt 0 6pt 0;
    }

    /* Continuation pages — plain white, no header/footer */
    .letter-continuation {
      position: relative;
      width: 100%;
      min-height: 297mm;
      page-break-before: always;
      background: white;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.0;
    }

    pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.0;
      margin: 0;
      color: #000;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10pt; }
    th { background: white; text-align: left; padding: 4pt 6pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #000; }
    td { padding: 3pt 6pt; border-bottom: none; vertical-align: top; font-size: 10pt; }
    p { margin: 0 0 6pt 0; line-height: 1.0; }
    
    /* Address blocks - single spaced */
    .address-block { line-height: 1.0; margin: 0 0 8pt 0; }
    .address-line { line-height: 1.0; margin: 0; }
  `;
}

export function buildLetterheadHTML() { return ""; }