const LOGO_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9d65d2d51_IMG_6994.jpeg";
const LETTERHEAD_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/7e2bca6fc_9E8BA4FC-02D7-4B9E-809C-6A24FA7522B1.png";

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

// Returns print styles that use the full A4 letterhead as background
// Letterhead image: ~28% header (fist/logo), ~10% footer (black bar) — body is white area in between
export function getLetterPageStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&display=swap');
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: white; }
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
    .letter-content {
      position: relative;
      /* top pad clears the header graphic (~28% of 297mm ≈ 83mm), bottom pad clears footer bar (~10% ≈ 30mm) */
      padding: 85mm 20mm 35mm 20mm;
      min-height: 297mm;
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      color: #111;
      line-height: 1.65;
    }
    h2.section-title {
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 14pt 0;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4pt;
    }
    pre {
      white-space: pre-wrap;
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      line-height: 1.7;
      margin: 0;
      color: #111;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; font-size: 11pt; }
    th { background: #f4f4f4; text-align: left; padding: 5pt 8pt; font-size: 10.5pt; font-weight: 600; border-bottom: 1px solid #ccc; }
    td { padding: 5pt 8pt; border-bottom: 1px solid #eee; vertical-align: top; }
    p { margin: 0 0 8pt 0; }
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