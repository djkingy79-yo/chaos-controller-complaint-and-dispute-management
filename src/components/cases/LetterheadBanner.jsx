const LOGO_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9d65d2d51_IMG_6994.jpeg";
const LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/d6c4951bb_9E8BA4FC-02D7-4B9E-809C-6A24FA7522B1.png";

export const CONTACT = {
  website: "www.chaoscontroller.com.au",
  email: "chaoscontrollerapp@gmail.com",
  phone: "0413 572 850",
  location: "Australia Wide",
};

// React letterhead header — full-width banner image
export function LetterheadHeader({ today }) {
  return (
    <div style={{ background: "#000", lineHeight: 0 }}>
      <img
        src={LOGO_URL}
        alt="Chaos Controller"
        style={{ width: "100%", display: "block", maxHeight: "120px", objectFit: "cover", objectPosition: "center" }}
      />
    </div>
  );
}

// Returns professional print styles using the full-page letterhead as background
// The letterhead image has: header ~25% top, footer ~12% bottom, white body in between
export function getLetterPageStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; font-family: 'EB Garamond', 'Times New Roman', Times, serif; }
    .letter-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background-image: url('${LETTERHEAD_URL}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: top left;
      page-break-after: always;
    }
    .letter-header { display: none; }
    .letter-content {
      position: relative;
      /* top ~25% of 297mm = 74mm, bottom ~12% = 36mm — text sits in white body */
      padding: 76mm 22mm 38mm 22mm;
      min-height: 297mm;
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #111;
      line-height: 1.55;
    }
    h2.section-title {
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 10pt 0;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3pt;
    }
    pre {
      white-space: pre-wrap;
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.55;
      margin: 0;
      color: #111;
    }
    .letter-footer { display: none; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 10pt; }
    th { background: rgba(0,0,0,0.05); text-align: left; padding: 4pt 7pt; font-size: 9.5pt; font-weight: 600; border-bottom: 1px solid #ccc; }
    td { padding: 4pt 7pt; border-bottom: 1px solid #eee; vertical-align: top; }
    p { margin: 0 0 6pt 0; }
  `;
}

export function buildLetterheadHTML(caseItem, client, today) {
  return `<div style="background:#000;line-height:0;">
    <img src="${LOGO_URL}" alt="Chaos Controller" style="width:100%;display:block;max-height:120px;object-fit:cover;object-position:center;" />
  </div>`;
}

export { LETTERHEAD_URL };

export function buildFooterHTML(caseItem, client, pageNum, totalPages) {
  const year = new Date().getFullYear();
  const name = client?.name || caseItem?.complainant_name || "";
  const org = caseItem?.organisation_name || "";
  const title = caseItem?.title || "";
  const docDate = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pageText = pageNum && totalPages ? `Page ${pageNum} of ${totalPages}` : pageNum ? `Page ${pageNum}` : "";
  const line1 = `Chaos Controller™ — Designed & Developed by Deb King ${year}`;
  const caseRef = title ? `${title}` : `${name ? name + " vs " + org : org}`;
  return `
  <div style="font-size:8pt;border-top:1pt solid #ccc;margin-top:24pt;padding-top:6pt;color:#666;font-family:'Times New Roman',Times,serif;display:flex;justify-content:space-between;align-items:center;">
    <div style="color:#666;">
      <div style="margin-bottom:2px;">${line1}</div>
      <div style="color:#888;">${caseRef}${docDate ? ` — ${docDate}` : ""}</div>
    </div>
    ${pageText ? `<div style="white-space:nowrap;padding-left:12pt;color:#888;">${pageText}</div>` : ""}
  </div>`;
}