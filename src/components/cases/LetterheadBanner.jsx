export const CONTACT = {
  website: "www.chaoscontroller.com.au",
  email: "chaoscontrollerapp@gmail.com",
  phone: "1300 4 CHAOS (1300 424 267)",
  location: "Australia Wide",
};

// Professional letterhead header — compact logo with clean branding
export function LetterheadHeader({ today }) {
  return (
    <div style={{ background: "#000", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
      <img 
        src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/30cf714ae_IMG_6998.jpeg" 
        alt="Chaos Controller" 
        style={{ width: "40px", height: "40px", objectFit: "contain" }} 
      />
      <div style={{ flex: 1 }}>
        <div style={{ color: "#FFD700", fontSize: "14pt", fontWeight: "bold", fontFamily: "Times New Roman, serif" }}>
          CHAOS CONTROLLER™
        </div>
        <div style={{ color: "#888", fontSize: "8pt", fontFamily: "Times New Roman, serif" }}>
          Consumer Advocacy Platform — {today}
        </div>
      </div>
    </div>
  );
}

export function buildLetterheadHTML(caseItem, client, today) {
  return `<div style="background:#000;padding:12px 20px;display:flex;align-items:center;">
    <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/30cf714ae_IMG_6998.jpeg" style="width:40px;height:40px;object-fit:contain;" />
    <div style="flex:1;padding-left:12px;">
      <div style="color:#FFD700;font-size:14pt;font-weight:bold;font-family:'Times New Roman',serif;">CHAOS CONTROLLER™</div>
      <div style="color:#888;font-size:8pt;font-family:'Times New Roman',serif;">Consumer Advocacy Platform — ${today}</div>
    </div>
  </div>`;
}

export function buildFooterHTML(caseItem, client, pageNum, totalPages) {
  const year = new Date().getFullYear();
  const name = client?.name || caseItem?.complainant_name || "";
  const org = caseItem?.organisation_name || "";
  const title = caseItem?.title || "";
  const docDate = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const pageText = pageNum && totalPages ? `Page ${pageNum} of ${totalPages}` : pageNum ? `Page ${pageNum}` : (pageNum ? `Page ${pageNum}` : "");
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