const LOGO_URL = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9d65d2d51_IMG_6994.jpeg";

export const CONTACT = {
  website: "www.chaoscontroller.com.au",
  email: "chaoscontrollerapp@gmail.com",
  phone: "1300 4 CHAOS (1300 424 267)",
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

export function buildLetterheadHTML(caseItem, client, today) {
  return `<div style="background:#000;line-height:0;">
    <img src="${LOGO_URL}" alt="Chaos Controller" style="width:100%;display:block;max-height:120px;object-fit:cover;object-position:center;" />
  </div>`;
}

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