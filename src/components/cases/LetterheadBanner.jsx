export const CARD_FRONT = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/30cf714ae_IMG_6998.jpeg";

export const CONTACT = {
  website: "www.chaoscontroller.com.au",
  email: "info@chaoscontroller.com.au",
  phone: "1300 4 CHAOS (1300 424 267)",
  location: "Australia Wide",
};

export function LetterheadHeader() {
  return (
    <img src={CARD_FRONT} alt="Chaos Controller" style={{ width: "100%", display: "block" }} />
  );
}

export function buildLetterheadHTML() {
  return `<div style="margin:-2cm -2cm 0 -2cm;">
    <img src="${CARD_FRONT}" alt="Chaos Controller" style="width:100%;display:block;" />
  </div>`;
}

export function buildFooterHTML(caseItem, client, pageNum, totalPages) {
  const year = new Date().getFullYear();
  const name = client?.name || caseItem?.complainant_name || "";
  const org = caseItem?.organisation_name || "";
  const title = caseItem?.title || "";
  const docDate = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pageText = pageNum && totalPages ? `Page ${pageNum} of ${totalPages}` : pageNum ? `Page ${pageNum}` : "";
  const line1 = `This App Chaos Controller was designed and developed by Deb King ${year}`;
  const line2 = `${name ? `${name} vs ${org}` : org}${title ? ` — ${title}` : ""} ${docDate}`;
  return `
  <div style="font-size:9pt;font-style:italic;border-top:1pt solid #ccc;margin-top:24pt;padding-top:6pt;color:#555;font-family:'Times New Roman',Times,serif;display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div>${line1}</div>
      <div>${line2}</div>
    </div>
    ${pageText ? `<div style="white-space:nowrap;padding-left:12pt;">${pageText}</div>` : ""}
  </div>`;
}