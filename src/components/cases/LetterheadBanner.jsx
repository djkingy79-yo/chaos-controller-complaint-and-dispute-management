const NEW_LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/d7c82de93_9E8BA4FC-02D7-4B9E-809C-6A24FA7522B1.png";
const CONTINUATION_PAGE_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/0cbc19cc4_5596A320-E07C-48EE-8743-6D15F12CE701.png";

// Export for use in PrintBundle and other print contexts
export { NEW_LETTERHEAD_URL as LETTERHEAD_URL, CONTINUATION_PAGE_URL };

export const CONTACT = {
  website: "www.chaoscontroller.com.au",
  email: "chaoscontrollerapp@gmail.com",
  phone: "0413 572 850",
  location: "Australia Wide",
};

// React letterhead — full-page background letterhead image shown in the app preview
export function LetterheadHeader() {
  return (
    <div style={{ lineHeight: 0 }}>
      <img
        src={NEW_LETTERHEAD_URL}
        alt="Chaos Controller Letterhead"
        style={{ width: "100%", display: "block" }}
      />
    </div>
  );
}

// Print styles — letterhead as background on page 1 only; overflow pages are plain white with a text footer
export function getLetterPageStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; }

    /* Page 1: full letterhead background */
    .letter-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background-image: url('${NEW_LETTERHEAD_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: top left;
    }
    .letter-header { display: none; }

    /* Letter body starts below the letterhead image (~40% from top = ~119mm) */
    .letter-content {
      position: relative;
      padding: 40% 22mm 20mm 22mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      line-height: 1.7;
    }

    /* Continuation pages — continuation letterhead background */
    .letter-continuation {
      width: 210mm;
      min-height: 297mm;
      padding: 38mm 22mm 28mm 22mm;
      page-break-before: always;
      background-image: url('${CONTINUATION_PAGE_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: top left;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      line-height: 1.7;
    }

    h2.section-title {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-weight: bold;
      color: #1a1a2e;
      margin: 0 0 10pt 0;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3pt;
    }
    pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.7;
      margin: 0;
      color: #111;
    }

    /* Plain text footer on every printed page */
    .letter-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6pt 22mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 8pt;
      color: #666;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 0.5pt solid #ccc;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10.5pt; }
    th { background: rgba(0,0,0,0.05); text-align: left; padding: 4pt 7pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #ccc; }
    td { padding: 4pt 7pt; border-bottom: 1px solid #eee; vertical-align: top; }
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
    <span>${CONTACT.website} | ${CONTACT.email} | ${CONTACT.phone}</span>
    <span>${ref} &nbsp;|&nbsp; ${now} &nbsp;|&nbsp; Page ${pageNum}</span>
  </div>`;
}