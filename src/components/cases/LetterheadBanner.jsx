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

// Category icons shown in the letterhead (matches business card grid)
const CATEGORY_ICONS = [
  { emoji: "🏛️", label: "Banking Disputes" },
  { emoji: "🗂️", label: "Evidence Vault" },
  { emoji: "🤖", label: "AI Case Assistant" },
  { emoji: "🛡️", label: "Insurance Claims" },
  { emoji: "🕐", label: "Timeline Builder" },
  { emoji: "🎓", label: "Tutorials & Guides" },
  { emoji: "🏠", label: "NCAT & Residential" },
  { emoji: "📊", label: "Progress Analysis" },
  { emoji: "⚡", label: "Services & Utilities" },
];

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top banner image */}
      <div className="w-full overflow-hidden" style={{ height: "110px" }}>
        <img src={CARD_FRONT} alt="Chaos Controller" className="w-full object-cover object-top" />
      </div>

      {/* 3-column icon grid matching the business card */}
      <div className="px-4 py-2 bg-slate-950 grid grid-cols-3 gap-x-4 gap-y-1.5">
        {CATEGORY_ICONS.map((cat) => (
          <span key={cat.label} className="flex items-center gap-1.5 text-[9px] text-slate-300 font-medium">
            <span className="text-sm">{cat.emoji}</span>
            {cat.label}
          </span>
        ))}
        <span className="col-span-3 text-right text-[8px] italic text-slate-500 mt-0.5">{today}</span>
      </div>

      {/* Gold separator */}
      <div className="h-0.5 bg-yellow-500" />
    </div>
  );
}

/** HTML letterhead for print/PDF — returns an HTML string */
export function buildLetterheadHTML(caseItem, client, today) {
  // 3-column grid: 3 icons per row
  const rows = [];
  for (let i = 0; i < CATEGORY_ICONS.length; i += 3) {
    const chunk = CATEGORY_ICONS.slice(i, i + 3);
    const cells = chunk.map(
      (c) => `<td style="width:33%;padding:3pt 6pt;font-size:8pt;color:#ccc;font-family:Arial,sans-serif;">${c.emoji} <strong style="color:#fff;">${c.label}</strong></td>`
    ).join("");
    rows.push(`<tr>${cells}</tr>`);
  }
  const iconGrid = `<table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>`;

  return `
  <!-- LETTERHEAD BANNER -->
  <div style="margin:-2cm -2cm 0 -2cm;">
    <div style="width:100%;height:90pt;overflow:hidden;">
      <img src="${CARD_FRONT}" alt="Chaos Controller" style="width:100%;display:block;object-fit:cover;object-position:top center;" />
    </div>
    <div style="padding:6pt 16pt 4pt 16pt;background:#0a0f1e;">
      ${iconGrid}
      <div style="text-align:right;font-size:8pt;font-style:italic;color:#666;font-family:Arial,sans-serif;margin-top:2pt;">${today}</div>
    </div>
    <div style="height:2pt;background:#eab308;"></div>
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