import React from "react";
import { Link } from "react-router-dom";
import { FileText, ExternalLink, Printer } from "lucide-react";
import { buildFooterHTML } from "@/components/cases/LetterheadBanner";
import { format } from "date-fns";

function buildClientContext(caseItem) {
  return {
    name: caseItem?.complainant_name || "",
    address: caseItem?.complainant_address || "",
    email: caseItem?.complainant_email || "",
    phone: caseItem?.complainant_phone || "",
    accounts: caseItem?.account_number ? [caseItem.account_number] : [],
  };
}

export default function LetterPreview({ cases }) {
  const caseWithLetter = cases.find((c) => c.complaint_letter);
  if (!caseWithLetter) return null;

  const today = format(new Date(), "d MMMM yyyy");
  const letter = caseWithLetter.complaint_letter || "";
  const preview = letter.slice(0, 500) + (letter.length > 500 ? "…" : "");
  const client = buildClientContext(caseWithLetter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Latest Complaint Letter
        </h2>
        <Link
          to={`/case/${caseWithLetter.id}`}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
        >
          View Case <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Compact professional letterhead */}
        <div style={{ background: "#000", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <img 
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/30cf714ae_IMG_6998.jpeg" 
            alt="Chaos Controller" 
            style={{ width: "32px", height: "32px", objectFit: "contain" }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#FFD700", fontSize: "11pt", fontWeight: "bold", fontFamily: "Times New Roman, serif" }}>
              CHAOS CONTROLLER™
            </div>
            <div style={{ color: "#888", fontSize: "7pt", fontFamily: "Times New Roman, serif" }}>
              Consumer Advocacy Platform
            </div>
          </div>
        </div>

        <div className="px-5 pt-2 pb-1 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{caseWithLetter.title}</p>
            {caseWithLetter.organisation_name && (
              <p className="text-[10px] text-muted-foreground">vs. {caseWithLetter.organisation_name}</p>
            )}
          </div>
          <p className="text-[10px] italic text-muted-foreground">{today}</p>
        </div>
        <div className="h-px bg-primary mx-5" />

        {(caseWithLetter.complainant_name || caseWithLetter.account_number) && (
          <div className="px-5 py-2 bg-secondary/30 border-b border-border flex flex-wrap gap-x-5 gap-y-0.5">
            {caseWithLetter.complainant_name && (
              <span className="text-[10px]"><span className="text-muted-foreground">From: </span><span className="font-semibold">{caseWithLetter.complainant_name}</span></span>
            )}
            {caseWithLetter.account_number && (
              <span className="text-[10px]"><span className="text-muted-foreground">Account: </span><span className="font-semibold">{caseWithLetter.account_number}</span></span>
            )}
            {caseWithLetter.incident_date && (
              <span className="text-[10px]"><span className="text-muted-foreground">Incident: </span><span className="font-semibold text-destructive">{format(new Date(caseWithLetter.incident_date), "d MMM yyyy")}</span></span>
            )}
          </div>
        )}

        <div className="px-5 py-4">
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed line-clamp-6 overflow-hidden" style={{ fontFamily: "'Times New Roman', Times, serif", maxHeight: 100, overflow: "hidden" }}>
            {preview}
          </pre>
          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
            <Link to={`/case/${caseWithLetter.id}`} className="text-[10px] text-primary font-medium hover:underline">
              View & print full letter →
            </Link>
            <Link to={`/case/${caseWithLetter.id}?tab=print`} className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1">
              <Printer className="w-3 h-3" /> Print
            </Link>
          </div>
        </div>

        <div className="px-5 py-2 bg-secondary/30 border-t border-border" dangerouslySetInnerHTML={{ __html: buildFooterHTML(caseWithLetter, client, 1, "") }} />
      </div>
    </div>
  );
}