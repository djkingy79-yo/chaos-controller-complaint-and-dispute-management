import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, MapPin, Mail, Phone, Hash, Calendar,
  DollarSign, Building2, FileText, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";

const Field = ({ icon: Icon, label, value, formatList = false }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const isArray = Array.isArray(value);
  const displayValue = isArray && formatList 
    ? value.reduce((lines, item, i) => {
        const currentLine = lines[lines.length - 1];
        if (!currentLine || (currentLine + ", " + item).length > 50) {
          lines.push(item);
        } else {
          lines[lines.length - 1] = currentLine + ", " + item;
        }
        return lines;
      }, []).join("\n      ")
    : (isArray ? value.join(", ") : value);
  
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
      <div className="break-words">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium text-foreground whitespace-pre-line">{displayValue}</span>
      </div>
    </div>
  );
};

export default function DocumentScanResult({ extracted, onConfirm, confirmed }) {
  const [expanded, setExpanded] = useState(true);
  if (!extracted) return null;

  const hasData = extracted.complainant_name || extracted.merchant_name ||
    extracted.account_numbers?.length || extracted.policy_numbers?.length ||
    extracted.complainant_email || extracted.complainant_address ||
    extracted.complainant_phone || extracted.key_amounts?.length;

  return (
    <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs"
      >
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <CheckCircle2 className="w-3.5 h-3.5" />
          AI Scan Complete
          {confirmed && <Badge className="text-[9px] px-1 py-0 bg-success text-success-foreground ml-1">Applied</Badge>}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {extracted.document_summary && (
            <p className="text-xs text-muted-foreground italic border-t border-primary/10 pt-2">
              {extracted.document_summary}
            </p>
          )}

          {hasData && (
            <div className="space-y-1.5 pt-1">
              <Field icon={User} label="Complainant" value={extracted.complainant_name} />
              <Field icon={MapPin} label="Address" value={extracted.complainant_address} />
              <Field icon={Mail} label="Email" value={extracted.complainant_email} />
              <Field icon={Phone} label="Phone" value={extracted.complainant_phone} />
              <Field icon={Building2} label="Merchant / Provider" value={extracted.merchant_name} />
              <Field icon={Hash} label="Account #" value={extracted.account_numbers} formatList={true} />
              <Field icon={Hash} label="Policy #" value={extracted.policy_numbers} formatList={true} />
              <Field icon={DollarSign} label="Amounts" value={extracted.key_amounts} formatList={true} />
              <Field icon={Calendar} label="Dates" value={extracted.dates_mentioned} formatList={true} />
            </div>
          )}

          {extracted.timeline_events?.length > 0 && (
            <div className="pt-1 border-t border-primary/10">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Timeline events detected ({extracted.timeline_events.length})
              </p>
              <div className="space-y-1">
                {extracted.timeline_events.slice(0, 3).map((ev, i) => (
                  <div key={i} className="text-xs flex items-start gap-1.5">
                    <Calendar className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{ev.date && <strong>{ev.date}: </strong>}{ev.description}</span>
                  </div>
                ))}
                {extracted.timeline_events.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{extracted.timeline_events.length - 3} more events</p>
                )}
              </div>
            </div>
          )}

          {!confirmed && onConfirm && (
            <Button size="sm" className="w-full h-7 text-xs mt-2 gap-1.5" onClick={onConfirm}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply to Case & Generate Timeline
            </Button>
          )}
        </div>
      )}
    </div>
  );
}