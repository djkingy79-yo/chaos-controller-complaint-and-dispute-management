const NEW_LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/d7c82de93_9E8BA4FC-02D7-4B9E-809C-6A24FA7522B1.png";

// Export for use in PrintBundle and other print contexts
export { NEW_LETTERHEAD_URL as LETTERHEAD_URL };

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

// Print styles — the new letterhead as full-page A4 background
// Header ~28% top (~83mm), footer ~10% bottom (~30mm)
export function getLetterPageStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'Times New Roman', Times, serif; }
    .letter-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background-image: url('${NEW_LETTERHEAD_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: top left;
      page-break-after: always;
    }
    .letter-header { display: none; }
    .letter-content {
      position: relative;
      padding: 83mm 22mm 32mm 22mm;
      min-height: 297mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      line-height: 1.65;
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
      line-height: 1.65;
      margin: 0;
      color: #111;
    }
    .letter-footer { display: none; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10.5pt; }
    th { background: rgba(0,0,0,0.05); text-align: left; padding: 4pt 7pt; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #ccc; }
    td { padding: 4pt 7pt; border-bottom: 1px solid #eee; vertical-align: top; }
    p { margin: 0 0 6pt 0; }
  `;
}

// No-op — footer is baked into the letterhead image
export function buildLetterheadHTML() { return ""; }
export function buildFooterHTML() { return ""; }