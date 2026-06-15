import React from "react";
import { Link } from "react-router-dom";
import { FileText, ExternalLink } from "lucide-react";
import { CARD_FRONT } from "@/components/cases/LetterheadBanner";
import { format } from "date-fns";

export default function LetterPreview({ cases }) {
  // Find the most recent case with a generated complaint letter
  const caseWithLetter = cases.find((c) => c.complaint_letter);
  if (!caseWithLetter) return null;

  const today = format(new Date(), "d MMMM yyyy");
  const letter = caseWithLetter.complaint_letter || "";
  const preview = letter.slice(0, 500) + (letter.length > 500 ? "…" : "");

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

      {/* Letter preview card mimicking the letterhead layout */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Banner — full image, no crop */}
        <img src={CARD_FRONT} alt="Chaos Controller" className="w-full block" />

        {/* Date + blue rule */}
        <div className="px-5 pt-2 pb-1 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{caseWithLetter.title}</p>
            {caseWithLetter.organisation_name && (
              <p className="text-[10px] text-slate-400">vs. {caseWithLetter.organisation_name}</p>
            )}
          </div>
          <p className="text-[10px] italic text-slate-400">{today}</p>
        </div>
        <div className="h-px bg-primary mx-5" />

        {/* Complainant summary strip */}
        {(caseWithLetter.complainant_name || caseWithLetter.account_number) && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-x-5 gap-y-0.5">
            {caseWithLetter.complainant_name && (
              <span className="text-[10px]"><span className="text-slate-400">From: </span><span className="font-semibold text-slate-700">{caseWithLetter.complainant_name}</span></span>
            )}
            {caseWithLetter.account_number && (
              <span className="text-[10px]"><span className="text-slate-400">Account: </span><span className="font-semibold text-slate-700">{caseWithLetter.account_number}</span></span>
            )}
            {caseWithLetter.incident_date && (
              <span className="text-[10px]"><span className="text-slate-400">Incident: </span><span className="font-semibold text-red-500">{format(new Date(caseWithLetter.incident_date), "d MMM yyyy")}</span></span>
            )}
          </div>
        )}

        {/* Letter body preview */}
        <div className="px-5 py-4 bg-white">
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-700 line-clamp-6 overflow-hidden" style={{ fontFamily: "'Times New Roman', Times, serif", maxHeight: 100, overflow: "hidden" }}>
            {preview}
          </pre>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <Link to={`/case/${caseWithLetter.id}`} className="text-[10px] text-primary font-medium hover:underline">
              View & print full letter →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex justify-between">
          <p className="text-[8px] italic text-slate-300">Chaos Controller by Deb King {new Date().getFullYear()} — {caseWithLetter.complainant_name || ""}{caseWithLetter.organisation_name ? ` vs ${caseWithLetter.organisation_name}` : ""}</p>
          <p className="text-[8px] text-slate-300">p. 1</p>
        </div>
      </div>
    </div>
  );
}