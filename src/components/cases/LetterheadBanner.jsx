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

// Icons with coloured circle backgrounds matching the reference image
// Row 1: Banking (gold) | Evidence Vault (orange) | AI Assistant (teal)
// Row 2: Insurance (blue) | Timeline (teal) | Tutorials (teal)
// Row 3: NCAT (orange) | Progress (purple) | (empty)
const CATEGORY_ICONS = [
  { emoji: "🏛️", label: "Banking Disputes",    sub: "Transaction issues, fraud, fees, hardship & more.",        bg: "#c8860a" },
  { emoji: "🗂️", label: "Evidence Vault",       sub: "Securely store, organise & tag all your documents.",       bg: "#c0521a" },
  { emoji: "🤖", label: "AI Case Assistant",    sub: "Smart guidance, letter generation & analysis.",            bg: "#0e7a6e" },
  { emoji: "🛡️", label: "Insurance Claims",     sub: "Denied claims, delays, payout disputes & more.",           bg: "#1a4fa0" },
  { emoji: "🕐", label: "Timeline Builder",     sub: "AI-powered chronological timelines & event tracking.",     bg: "#0e7a6e" },
  { emoji: "🎓", label: "Tutorials & Guides",   sub: "Step-by-step video guides & helpful resources.",           bg: "#1a6a8a" },
  { emoji: "🏠", label: "NCAT & Residential",   sub: "Repairs, bonds, eviction notices, rent disputes.",         bg: "#c0521a" },
  { emoji: "📊", label: "Progress Analysis",    sub: "Track responses, deadlines & case strength.",              bg: "#6b2fa0" },
  { emoji: "",   label: "",                      sub: "",                                                          bg: "" },
];

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div style={{ background: "#0d0d0d" }}>
      {/* Full fist/logo image — full width, no crop, no object-fit */}
      <img src={CARD_FRONT} alt="Chaos Controller" style={{ width: "100%", display: "block", objectFit: "unset" }} />

      {/* Tagline bar */}
      <div style={{ background: "#0d0d0d", padding: "8px 20px", textAlign: "center", borderTop: "2px solid #333" }}>
        <span style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "2.5px", color: "#ffffff", fontFamily: "Arial Black, Arial, sans-serif" }}>UPLOAD THE CHAOS.&nbsp;&nbsp;&nbsp;WE BUILD THE CASE.&nbsp;&nbsp;&nbsp;</span>
        <span style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "2.5px", color: "#d4a017", fontFamily: "Arial Black, Arial, sans-serif" }}>TAKE BACK CONTROL.</span>
      </div>

      {/* 3-column icon grid — dark background */}
      <div style={{ background: "#0d0d0d", padding: "10px 16px 10px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 6px" }}>
          {CATEGORY_ICONS.map((cat, i) => (
            cat.label ? (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px" }}>
                  {cat.emoji}
                </div>
                <div>
                  <p style={{ fontSize: "7.5px", fontWeight: "900", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.3px", margin: 0, lineHeight: "1.2", fontFamily: "Arial, sans-serif" }}>{cat.label}</p>
                  <p style={{ fontSize: "6.5px", color: "#999999", margin: "2px 0 0 0", lineHeight: "1.3", fontFamily: "Arial, sans-serif" }}>{cat.sub}</p>
                </div>
              </div>
            ) : <div key={i} />
          ))}
        </div>
      </div>

      {/* Gold bottom line */}
      <div style={{ height: "3px", background: "#d4a017" }} />
    </div>
  );
}

/** HTML letterhead for print/PDF — returns an HTML string */
export function buildLetterheadHTML(caseItem, client, today) {
  const visibleIcons = CATEGORY_ICONS.filter(c => c.label);
  const rows = [];
  for (let i = 0; i < visibleIcons.length; i += 3) {
    const chunk = visibleIcons.slice(i, i + 3);
    while (chunk.length < 3) chunk.push({ emoji: "", label: "", sub: "", bg: "" });
    const cells = chunk.map(c =>
      `<td style="width:33%;padding:3pt 5pt;vertical-align:top;font-family:Arial,sans-serif;">
        ${c.label ? `<div style="display:flex;align-items:flex-start;gap:5pt;">
          <div style="width:16pt;height:16pt;border-radius:50%;background:${c.bg};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8pt;line-height:1;">${c.emoji}</div>
          <div>
            <strong style="font-size:6pt;color:#fff;text-transform:uppercase;letter-spacing:0.4pt;">${c.label}</strong>
            <br/><span style="font-size:5pt;color:#aaa;">${c.sub}</span>
          </div>
        </div>` : ""}
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
    <div style="padding:6pt 14pt;background:#1a1a1a;text-align:center;border-top:1px solid #2a2a2a;">
      <span style="font-size:8pt;font-weight:900;color:#fff;letter-spacing:1.5pt;font-family:Arial Black,Arial,sans-serif;">UPLOAD THE CHAOS.&nbsp;&nbsp;&nbsp;WE BUILD THE CASE.&nbsp;&nbsp;&nbsp;</span>
      <span style="font-size:8pt;font-weight:900;color:#d4a017;letter-spacing:1.5pt;font-family:Arial Black,Arial,sans-serif;">TAKE BACK CONTROL.</span>
    </div>
    <div style="padding:8pt 14pt 4pt 14pt;background:#1a1a1a;">
      ${iconGrid}
      <div style="text-align:right;font-size:6pt;font-style:italic;color:#666;font-family:Arial,sans-serif;margin-top:4pt;">${today}</div>
    </div>
    <div style="height:3pt;background:#d4a017;"></div>
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