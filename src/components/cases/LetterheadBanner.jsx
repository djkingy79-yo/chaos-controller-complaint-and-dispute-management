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

export function buildFooterHTML(caseItem, client, pageNum) {
  const year = new Date().getFullYear();
  const name = client?.name || caseItem?.complainant_name || "";
  const org = caseItem?.organisation_name || "";
  const title = caseItem?.title || "";
  const text = `Chaos Controller by Deb King ${year}${name ? ` — ${name} vs ${org}` : ""} — ${title}`;
  const disclaimer = "Chaos Controller™ provides organisational and document management assistance only. It does not constitute legal advice.";
  return `
  <div style="font-size:9pt;font-style:italic;border-top:1pt solid #ccc;margin-top:24pt;padding-top:6pt;color:#888;font-family:Arial,sans-serif;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div>${text}</div>
        <div style="font-size:8pt;margin-top:2pt;color:#aaa;">${disclaimer}</div>
      </div>
      ${pageNum ? `<div style="font-size:9pt;color:#888;white-space:nowrap;padding-left:12pt;">p. ${pageNum}</div>` : ""}
    </div>
  </div>`;
}