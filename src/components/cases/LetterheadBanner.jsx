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

// Category icons shown in the letterhead
const CATEGORY_ICONS = [
  { emoji: "🏦", label: "Bank Dispute" },
  { emoji: "🏠", label: "Tenancy Dispute" },
  { emoji: "📡", label: "Telco Dispute" },
  { emoji: "⚖️", label: "Other Dispute" },
];

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top banner — business card front image, no fixed height */}
      <div className="w-full overflow-hidden">
        <img
          src={CARD_FRONT}
          alt="Chaos Controller"
          className="w-full object-cover object-top"
        />
      </div>

      {/* Contact strip — card back details */}
      <div className="px-6 py-2 bg-slate-900 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-[10px] text-yellow-400">🌐 {CONTACT.website}</span>
          <span className="text-[10px] text-slate-300">✉ {CONTACT.email}</span>
          <span className="text-[10px] text-slate-300">📞 {CONTACT.phone}</span>
          <span className="text-[10px] text-slate-400">📍 {CONTACT.location}</span>
        </div>
        <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-wide">{CONTACT.tagline}</span>
      </div>

      {/* Gold rule */}
      <div className="h-0.5 bg-yellow-500" />

      {/* Category icons row */}
      <div className="px-6 py-2 bg-slate-50 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-100">
        {CATEGORY_ICONS.map((cat) => (
          <span key={cat.label} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="text-sm">{cat.emoji}</span>
            {cat.label}
          </span>
        ))}
        <span className="ml-auto text-[10px] italic text-slate-400">{today}</span>
      </div>

      {/* Blue separator */}
      <div className="h-0.5 bg-primary mx-6 mt-1" />
    </div>
  );
}

/** HTML letterhead for print/PDF — returns an HTML string */
export function buildLetterheadHTML(caseItem, client, today) {
  const iconRow = CATEGORY_ICONS.map(
    (c) => `<span style="font-size:10pt;margin-right:14pt;">${c.emoji} <span style="font-size:8pt;color:#555;">${c.label}</span></span>`
  ).join("");

  return `
  <!-- LETTERHEAD BANNER -->
  <div style="margin:-2cm -2cm 0 -2cm;">
    <img src="${CARD_FRONT}" alt="Chaos Controller" style="width:100%;display:block;" />
    <div style="background:#111;padding:6pt 16pt;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:9pt;color:#facc15;font-family:Arial,sans-serif;">🌐 ${CONTACT.website} &nbsp;|&nbsp; ✉ ${CONTACT.email} &nbsp;|&nbsp; 📞 ${CONTACT.phone} &nbsp;|&nbsp; 📍 ${CONTACT.location}</span>
      <span style="font-size:8pt;font-weight:bold;color:#facc15;font-family:Arial,sans-serif;text-transform:uppercase;">${CONTACT.tagline}</span>
    </div>
    <div style="height:2pt;background:#eab308;"></div>
    <div style="padding:6pt 16pt;background:#f8fafc;border-bottom:1pt solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
      <div>${iconRow}</div>
      <span style="font-size:9pt;font-style:italic;color:#888;font-family:Arial,sans-serif;">${today}</span>
    </div>
  </div>
  <hr style="border:none;border-top:2pt solid #1d4ed8;margin:14pt 0 12pt 0;" />`;
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