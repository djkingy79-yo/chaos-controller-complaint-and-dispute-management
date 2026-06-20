// Full letterhead with header and footer - page 1 only
const FULL_LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/06f2e0b00_E004AFA7-44DA-44FD-BE4D-38601D2B1F03.png";
// Minimal continuation header - pages 2+
const CONTINUATION_PAGE_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/08578d6a5_25C3D2EB-1058-4DE4-B540-D512DF00D788.png";

// Export for use in PrintBundle and other print contexts
export { FULL_LETTERHEAD_URL as LETTERHEAD_URL, CONTINUATION_PAGE_URL };

export const CONTACT = {
  website: "app.base44.com/6a2ac3b012e45642b1f94671",
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
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; }

    /* Page 1: FULL letterhead with header and footer */
    .letter-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background-image: url('${FULL_LETTERHEAD_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: top left;
    }

    /* Letter body starts below the full letterhead header (~35% from top) */
    .letter-content {
      position: relative;
      padding: 35% 25mm 15mm 25mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #111;
      line-height: 1.6;
      max-width: 160mm;
    }

    /* Continuation pages — MINIMAL header only, no footer */
    .letter-continuation {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 25mm 20mm 25mm;
      page-break-before: always;
      background-image: url('${CONTINUATION_PAGE_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: top left;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #111;
      line-height: 1.6;
      max-width: 160mm;
    }

    h2.section-title {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a2e;
      margin: 0 0 10pt 0;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3pt;
    }
    pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.6;
      margin: 0;
      color: #111;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10pt; }
    th { background: rgba(0,0,0,0.05); text-align: left; padding: 4pt 7pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #ccc; }
    td { padding: 4pt 7pt; border-bottom: 1px solid #eee; vertical-align: top; font-size: 10pt; }
    p { margin: 0 0 6pt 0; }
  `;
}

// No-op — letterhead is handled via CSS background-image on .letter-page
export function buildLetterheadHTML() { return ""; }

// Plain text footer for printed pages
export function buildFooterHTML(caseItem, client, pageNum) {
  const ref = caseItem ? `CC-${caseItem.id?.slice(0, 8).toUpperCase()}` : "";
  const now = new Date().toLocaleString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return `<div class="letter-footer">
    <span>${CONTACT.email}</span>
    <span>${ref} &nbsp;|&nbsp; ${now} &nbsp;|&nbsp; Page ${pageNum}</span>
  </div>`;
}