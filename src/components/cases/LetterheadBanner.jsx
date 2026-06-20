// Full letterhead with header and footer - page 1 only
const FULL_LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/06f2e0b00_E004AFA7-44DA-44FD-BE4D-38601D2B1F03.png";
// Minimal continuation header - pages 2+
const CONTINUATION_PAGE_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/08578d6a5_25C3D2EB-1058-4DE4-B540-D512DF00D788.png";

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
    @page { margin: 25mm 20mm 20mm 20mm; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; line-height: 1.6; }

    /* Page 1: FULL letterhead with header and footer */
    .letter-page {
      position: relative;
      width: 100%;
      min-height: 297mm;
      background-image: url('${FULL_LETTERHEAD_URL}');
      background-size: 100% auto;
      background-repeat: no-repeat;
      background-position: top center;
    }

    /* Letter body with 25mm margins - text spans full width between margins */
    .letter-content {
      position: relative;
      padding: 38mm 0 25mm 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      line-height: 1.6;
      width: 100%;
      max-width: none;
    }

    /* Continuation pages — MINIMAL header only, no footer */
    .letter-continuation {
      position: relative;
      width: 100%;
      min-height: 297mm;
      padding: 25mm 0 25mm 0;
      page-break-before: always;
      background-image: url('${CONTINUATION_PAGE_URL}');
      background-size: 100% auto;
      background-repeat: no-repeat;
      background-position: top center;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      line-height: 1.6;
      width: 100%;
      max-width: none;
    }

    h2.section-title {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a2e;
      margin: 14pt 0 10pt 0;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 4pt;
    }
    pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      margin: 0;
      color: #111;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10pt; }
    th { background: #f4f4f4; text-align: left; padding: 5pt 8pt; font-size: 10pt; font-weight: bold; border-bottom: 2px solid #ddd; }
    td { padding: 4.5pt 8pt; border-bottom: 1px solid #eee; vertical-align: top; font-size: 10pt; }
    p { margin: 0 0 8pt 0; }
  `;
}

// No-op — letterhead is handled via CSS background-image on .letter-page
export function buildLetterheadHTML() { return ""; }