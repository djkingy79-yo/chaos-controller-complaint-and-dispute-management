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

// Column 1: Banking, Insurance, NCAT, Utilities
// Column 2: Evidence Vault, Timeline, Progress
// Column 3: AI Assistant, Tutorials
// Grid flows left-to-right per row, so we interleave columns manually:
// Row 1: col1[0], col2[0], col3[0]
// Row 2: col1[1], col2[1], col3[1]
// Row 3: col1[2], col2[2], col3[2] (col3 empty)
// Row 4: col1[3], col2 empty, col3 empty
const COL1 = [
  { emoji: "🏛️", label: "Banking Disputes",    sub: "Transaction issues, fraud, fees, hardship & more." },
  { emoji: "🛡️", label: "Insurance Claims",     sub: "Denied claims, delays, payout disputes & more." },
  { emoji: "🏠", label: "NCAT & Residential",   sub: "Repairs, bonds, eviction notices, rent disputes." },
  { emoji: "⚡", label: "Services & Utilities", sub: "Energy, water, telco disputes & more." },
];
const COL2 = [
  { emoji: "🗂️", label: "Evidence Vault",      sub: "Securely store, organise & tag all your documents." },
  { emoji: "🕐", label: "Timeline Builder",    sub: "AI-powered chronological timelines & event tracking." },
  { emoji: "📊", label: "Progress Analysis",   sub: "Track responses, deadlines & case strength." },
];
const COL3 = [
  { emoji: "🤖", label: "AI Case Assistant",   sub: "Smart guidance, letter generation & analysis." },
  { emoji: "🎓", label: "Tutorials & Guides",  sub: "Step-by-step video guides & helpful resources." },
];

const EMPTY = { emoji: "", label: "", sub: "" };
const numRows = Math.max(COL1.length, COL2.length, COL3.length);
const CATEGORY_ICONS = [];
for (let i = 0; i < numRows; i++) {
  CATEGORY_ICONS.push(COL1[i] || EMPTY);
  CATEGORY_ICONS.push(COL2[i] || EMPTY);
  CATEGORY_ICONS.push(COL3[i] || EMPTY);
}

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div className="border-b border-slate-200">
      {/* Full logo image — no crop */}
      <img src={CARD_FRONT} alt="Chaos Controller" className="w-full block" />

      {/* Tagline bar — dark with gold accent, matches reference */}
      <div style={{ background: "#1c1c1c", borderTop: "2px solid #333", borderBottom: "1px solid #333", padding: "10px 16px", textAlign: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "2px", color: "#ffffff", fontFamily: "Arial, sans-serif" }}>UPLOAD THE CHAOS.&nbsp;&nbsp;&nbsp;WE BUILD THE CASE.&nbsp;&nbsp;&nbsp;</span>
        <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "2px", color: "#f59e0b", fontFamily: "Arial, sans-serif" }}>TAKE BACK CONTROL.</span>
      </div>

      {/* 3-column icon grid — white background matching reference */}
      <div style={{ background: "#ffffff", padding: "12px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px" }}>
          {CATEGORY_ICONS.map((cat, i) => (
            cat.label ? (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingBottom: "6px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1c1c1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px" }}>
                  {cat.emoji}
                </div>
                <div>
                  <p style={{ fontSize: "8px", fontWeight: "800", color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, lineHeight: "1.2", fontFamily: "Arial, sans-serif" }}>{cat.label}</p>
                  <p style={{ fontSize: "7px", color: "#555", margin: "2px 0 0 0", lineHeight: "1.3", fontFamily: "Arial, sans-serif" }}>{cat.sub}</p>
                </div>
              </div>
            ) : <div key={i} />
          ))}
        </div>
        <div style={{ textAlign: "right", fontSize: "7px", fontStyle: "italic", color: "#999", marginTop: "6px", fontFamily: "Arial, sans-serif" }}>{today}</div>
      </div>

      {/* Gold separator */}
      <div style={{ height: "3px", background: "#f59e0b" }} />
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
        <div style="display:flex;align-items:flex-start;gap:5pt;">
          ${c.emoji ? `<div style="width:18pt;height:18pt;border-radius:50%;background:#1c1c1c;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:9pt;line-height:1;">${c.emoji}</div>` : ""}
          <div>
            <strong style="font-size:6.5pt;color:#111;text-transform:uppercase;letter-spacing:0.4pt;">${c.label}</strong>
            ${c.sub ? `<br/><span style="font-size:5.5pt;color:#555;">${c.sub}</span>` : ""}
          </div>
        </div>
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
    <div style="padding:6pt 14pt;background:#1c1c1c;text-align:center;border-top:2px solid #333;border-bottom:1px solid #444;">
      <span style="font-size:8pt;font-weight:900;color:#fff;letter-spacing:1.5pt;font-family:Arial,sans-serif;">UPLOAD THE CHAOS.&nbsp;&nbsp;&nbsp;WE BUILD THE CASE.&nbsp;&nbsp;&nbsp;</span>
      <span style="font-size:8pt;font-weight:900;color:#f59e0b;letter-spacing:1.5pt;font-family:Arial,sans-serif;">TAKE BACK CONTROL.</span>
    </div>
    <div style="padding:8pt 14pt 4pt 14pt;background:#fff;">
      ${iconGrid}
      <div style="text-align:right;font-size:6pt;font-style:italic;color:#999;font-family:Arial,sans-serif;margin-top:4pt;">${today}</div>
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