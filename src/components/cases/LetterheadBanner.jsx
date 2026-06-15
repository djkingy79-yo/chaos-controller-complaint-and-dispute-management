// Shared letterhead constants and builder used by ComplaintLetter and PrintBundle
export const CARD_FRONT = "https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/f88aafad8_9EAF5A1A-1F18-4B58-B7A9-95DEB22B373F.png";

// The business card back contact details
export const CONTACT = {
  website: "www.chaoscontroller.com.au",
  email: "info@chaoscontroller.com.au",
  phone: "1300 4 CHAOS (1300 424 267)",
  location: "Australia Wide",
  tagline: "CONFIDENTIAL. SECURE. YOUR INFORMATION STAYS YOURS.",
};

// Category icons shown in the letterhead (matches business card left column)
const CATEGORY_ICONS = [
  { emoji: "🏛️", label: "Banking Disputes" },
  { emoji: "🛡️", label: "Insurance Claims" },
  { emoji: "🏠", label: "NCAT & Residential" },
  { emoji: "⚖️", label: "Court Preparation" },
];

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top banner — full business card front image (includes logo + dark strip) */}
      <div className="w-full overflow-hidden" style={{ height: "160px" }}>
        <img
          src={CARD_FRONT}
          alt="Chaos Controller"
          className="w-full object-cover object-top"
        />
      </div>

      {/* Category icons row */}
      <div className="px-6 py-2 bg-white flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-slate-100">
        {CATEGORY_ICONS.map((cat) => (
          <span key={cat.label} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
            <span className="text-base">{cat.emoji}</span>
            {cat.label}
          </span>
        ))}
        <span className="ml-auto text-[10px] italic text-slate-400">{today}</span>
      </div>

      {/* Blue separator */}
      <div className="h-0.5 bg-blue-600 mx-6" />
    </div>
  );
}

/** HTML letterhead for print/PDF — returns an HTML string */
export function buildLetterheadHTML(caseItem, client, today) {
  const iconRow = CATEGORY_ICONS.map(
    (c) => `<span style="font-size:10pt;margin-right:18pt;">${c.emoji} <span style="font-size:9pt;color:#444;font-weight:600;">${c.label}</span></span>`
  ).join("");

  return `
  <!-- LETTERHEAD BANNER -->
  <div style="margin:-2cm -2cm 0 -2cm;">
    <div style="width:100%;height:110pt;overflow:hidden;">
      <img src="${CARD_FRONT}" alt="Chaos Controller" style="width:100%;display:block;object-fit:cover;object-position:top center;" />
    </div>
    <div style="padding:6pt 16pt;background:#fff;border-bottom:1pt solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
      <div>${iconRow}</div>
      <span style="font-size:9pt;font-style:italic;color:#888;font-family:Arial,sans-serif;">${today}</span>
    </div>
    <div style="height:2pt;background:#1d4ed8;margin:0 16pt;"></div>
  </div>`;
}

/** Footer HTML string for print documents */
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