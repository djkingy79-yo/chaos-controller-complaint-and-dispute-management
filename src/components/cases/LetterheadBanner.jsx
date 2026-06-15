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

/** React on-screen letterhead header */
export function LetterheadHeader({ today }) {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top banner — business card front image */}
      <div className="w-full overflow-hidden" style={{ maxHeight: 110 }}>
        <img
          src={CARD_FRONT}
          alt="Chaos Controller"
          className="w-full object-cover object-top"
          style={{ maxHeight: 110 }}
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
      {/* Date line */}
      <div className="px-6 py-1.5 bg-white flex justify-end">
        <span className="text-xs text-slate-500 italic">{today}</span>
      </div>
      {/* Blue separator */}
      <div className="h-0.5 bg-primary mx-6" />
    </div>
  );
}

/** HTML letterhead for print/PDF — returns an HTML string */
export function buildLetterheadHTML(caseItem, client, today) {
  const clientRows = [
    client?.name    ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">From:</td><td style="font-weight:bold;font-size:11pt;">${client.name}</td></tr>` : "",
    client?.address ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Address:</td><td style="font-size:11pt;">${client.address}</td></tr>` : "",
    client?.email   ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Email:</td><td style="font-size:11pt;">${client.email}</td></tr>` : "",
    client?.phone   ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Mobile:</td><td style="font-size:11pt;">${client.phone}</td></tr>` : "",
    client?.accounts?.length ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Account(s):</td><td style="font-weight:bold;font-size:11pt;">${client.accounts.join(", ")}</td></tr>` : "",
    client?.policies?.length ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Reference(s):</td><td style="font-size:11pt;">${client.policies.join(", ")}</td></tr>` : "",
    caseItem?.incident_date ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Incident Date:</td><td style="font-weight:bold;color:#cc0000;font-size:11pt;">${caseItem.incident_date}</td></tr>` : "",
    caseItem?.complaint_handler_name ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">Attn:</td><td style="font-size:11pt;">${caseItem.complaint_handler_name}</td></tr>` : "",
    caseItem?.organisation_name ? `<tr><td style="color:#555;padding:2pt 14pt 2pt 0;font-size:11pt;white-space:nowrap;">To:</td><td style="font-weight:bold;font-size:11pt;">${caseItem.organisation_name}${caseItem.organisation_complaints_email ? ` (${caseItem.organisation_complaints_email})` : ""}</td></tr>` : "",
    caseItem?.organisation_complaints_address ? `<tr><td></td><td style="color:#555;font-size:10pt;">${caseItem.organisation_complaints_address}</td></tr>` : "",
  ].filter(Boolean).join("");

  return `
  <!-- LETTERHEAD BANNER -->
  <div style="margin:-2cm -2cm 0 -2cm;">
    <img src="${CARD_FRONT}" alt="Chaos Controller" style="width:100%;max-height:90pt;object-fit:cover;object-position:top;display:block;" />
    <div style="background:#111;padding:6pt 16pt;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:9pt;color:#facc15;font-family:Arial,sans-serif;">🌐 ${CONTACT.website} &nbsp;|&nbsp; ✉ ${CONTACT.email} &nbsp;|&nbsp; 📞 ${CONTACT.phone} &nbsp;|&nbsp; 📍 ${CONTACT.location}</span>
      <span style="font-size:8pt;font-weight:bold;color:#facc15;font-family:Arial,sans-serif;text-transform:uppercase;">${CONTACT.tagline}</span>
    </div>
    <div style="height:2pt;background:#eab308;"></div>
  </div>
  <div style="margin-top:12pt;text-align:right;font-size:10pt;color:#555;font-style:italic;font-family:Arial,sans-serif;">${today}</div>
  <hr style="border:none;border-top:2pt solid #1d4ed8;margin:8pt 0 12pt 0;" />
  ${clientRows ? `<div style="background:#f8fafc;border:1pt solid #e2e8f0;padding:8pt 14pt;margin-bottom:14pt;"><table style="border-collapse:collapse;">${clientRows}</table></div>` : ""}`;
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