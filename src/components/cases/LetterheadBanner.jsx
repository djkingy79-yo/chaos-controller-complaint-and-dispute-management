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
// Column layout: col1 = Banking, Insurance, NCAT, Utilities | col2 = Evidence Vault, Timeline, Progress | col3 = AI Assistant, Tutorials
const CATEGORY_ICONS = [
  // col 1
  { emoji: "🏛️", label: "Banking Disputes",     sub: "Transaction issues, fraud, fees, hardship & more." },
  // col 2
  { emoji: "🗂️", label: "Evidence Vault",        sub: "Securely store, organise & tag all your documents." },
  // col 3
  { emoji: "🤖", label: "AI Case Assistant",     sub: "Smart guidance, letter generation & analysis." },
  // col 1
  { emoji: "🛡️", label: "Insurance Claims",      sub: "Denied claims, delays, payout disputes & more." },
  // col 2
  { emoji: "🕐", label: "Timeline Builder",      sub: "AI-powered chronological timelines & event tracking." },
  // col 3
  { emoji: "🎓", label: "Tutorials & Guides",    sub: "Step-by-step video guides & helpful resources." },
  // col 1
  { emoji: "🏠", label: "NCAT & Residential",    sub: "Repairs, bonds, eviction notices, rent disputes." },
  // col 2
  { emoji: "📊", label: "Progress Analysis",     sub: "Track responses, deadlines & case strength." },
  // col 3 — empty placeholder to keep grid shape
  { emoji: "",   label: "",                       sub: "" },
  // col 1
  { emoji: "⚡", label: "Services & Utilities",  sub: "Energy, water, telco disputes & more." },
  // col 2 & 3 — empty
  { emoji: "",   label: "",                       sub: "" },
  { emoji: "",   label: "",                       sub: "" },
];

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div className="border-b border-slate-200" style={{ background: "#111" }}>
      {/* Full logo image — no crop */}
      <div className="w-full">
        <img src={CARD_FRONT} alt="Chaos Controller" className="w-full block" />
      </div>

      {/* Tagline bar */}
      <div className="text-center py-2 px-4" style={{ background: "#1a1a1a", borderTop: "1px solid #333" }}>
        <span className="text-[9px] font-bold tracking-widest text-white">UPLOAD THE CHAOS.&nbsp;&nbsp;</span>
        <span className="text-[9px] font-bold tracking-widest text-white">WE BUILD THE CASE.&nbsp;&nbsp;</span>
        <span className="text-[9px] font-bold tracking-widest" style={{ color: "#facc15" }}>TAKE BACK CONTROL.</span>
      </div>

      {/* 3-column icon grid matching reference image */}
      <div className="grid grid-cols-3 gap-x-2 px-3 py-2" style={{ background: "#111" }}>
        {CATEGORY_ICONS.map((cat, i) => (
          cat.label ? (
            <div key={i} className="flex items-start gap-1.5 py-1">
              <span className="text-base leading-none mt-0.5 shrink-0">{cat.emoji}</span>
              <div>
                <p className="text-[8px] font-bold text-white leading-tight uppercase tracking-wide">{cat.label}</p>
                <p className="text-[7px] text-slate-400 leading-tight mt-0.5">{cat.sub}</p>
              </div>
            </div>
          ) : <div key={i} />
        ))}
      </div>

      {/* Date + gold separator */}
      <div className="flex justify-end px-3 pb-1" style={{ background: "#111" }}>
        <span className="text-[7px] italic text-slate-500">{today}</span>
      </div>
      <div className="h-0.5 bg-yellow-500" />
    </div>
  );
}

/** HTML letterhead for print/PDF — returns an HTML string */
export function buildLetterheadHTML(caseItem, client, today) {
  const visibleIcons = CATEGORY_ICONS.filter(c => c.label);
  const rows = [];
  for (let i = 0; i < visibleIcons.length; i += 3) {
    const chunk = visibleIcons.slice(i, i + 3);
    // pad to 3 columns
    while (chunk.length < 3) chunk.push({ emoji: "", label: "", sub: "" });
    const cells = chunk.map(c =>
      `<td style="width:33%;padding:3pt 6pt;vertical-align:top;font-family:Arial,sans-serif;">
        ${c.emoji ? `<span style="font-size:11pt;">${c.emoji}</span>&nbsp;` : ""}
        <strong style="font-size:7pt;color:#fff;text-transform:uppercase;letter-spacing:0.5pt;">${c.label}</strong>
        ${c.sub ? `<br/><span style="font-size:6pt;color:#aaa;">${c.sub}</span>` : ""}
      </td>`
    ).join("");
    rows.push(`<tr>${cells}</tr>`);
  }
  const iconGrid = `<table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>`;

  return `
  <!-- LETTERHEAD BANNER -->
  <div style="margin:-2cm -2cm 0 -2cm;">
    <div style="width:100%;">
      <img src="${CARD_FRONT}" alt="Chaos Controller" style="width:100%;display:block;" />
    </div>
    <div style="padding:4pt 12pt;background:#1a1a1a;text-align:center;border-top:1px solid #333;">
      <span style="font-size:7pt;font-weight:bold;color:#fff;letter-spacing:1pt;font-family:Arial,sans-serif;">UPLOAD THE CHAOS.&nbsp;&nbsp;WE BUILD THE CASE.&nbsp;&nbsp;</span>
      <span style="font-size:7pt;font-weight:bold;color:#facc15;letter-spacing:1pt;font-family:Arial,sans-serif;">TAKE BACK CONTROL.</span>
    </div>
    <div style="padding:6pt 12pt 4pt 12pt;background:#111;">
      ${iconGrid}
      <div style="text-align:right;font-size:6pt;font-style:italic;color:#666;font-family:Arial,sans-serif;margin-top:2pt;">${today}</div>
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