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
        {/* Clean compact header bar — no full letterhead image */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-amber-400 font-mono tracking-wider">CHAOS CONTROLLER™</p>
            <p className="text-[10px] text-slate-400">{caseWithLetter.title}{caseWithLetter.organisation_name ? ` — vs. ${caseWithLetter.organisation_name}` : ""}</p>
          </div>
          <p className="text-[10px] text-slate-400 italic">{today}</p>
        </div>

        {(caseWithLetter.complainant_name || caseWithLetter.account_number) && (
          <div className="px-4 py-2 bg-muted/40 border-b border-border flex flex-wrap gap-x-4 gap-y-0.5">
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

        <div className="px-4 py-3">
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed overflow-hidden text-muted-foreground" style={{ fontFamily: "'Times New Roman', Times, serif", maxHeight: 90, overflow: "hidden" }}>
            {preview}
          </pre>
          <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between">
            <Link to={`/case/${caseWithLetter.id}`} className="text-[10px] text-primary font-medium hover:underline">
              View full letter →
            </Link>
            <Link to={`/case/${caseWithLetter.id}?tab=print`} className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1">
              <Printer className="w-3 h-3" /> Print
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}