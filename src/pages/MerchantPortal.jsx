import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isBefore } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Clock, CheckCircle2, Zap, Calendar,
  ArrowUpRight, FolderOpen, LogOut, ChevronDown,
  ChevronUp, Flag, MessageSquare, AlertCircle, Shield,
  FileText, Scale, Building2, Loader2, Bell, RefreshCw, Send
} from "lucide-react";
import { invokeBase44Function } from "@/lib/invoke";
import { clearMerchantSession, readMerchantSession, writeMerchantSession } from "@/lib/merchantSession";

const statusConfig = {
  draft:              { label: "Draft",                color: "#888",    bg: "#88888820" },
  complaint_sent:     { label: "Complaint Sent",       color: "#0066CC", bg: "#0066CC20" },
  awaiting_response:  { label: "Awaiting Response",    color: "#FF8800", bg: "#FF880020" },
  response_received:  { label: "Response Received",    color: "#660099", bg: "#66009920" },
  escalation_ready:   { label: "Ready for Escalation", color: "#CC0000", bg: "#CC000020" },
  escalated:          { label: "Escalated",            color: "#CC0000", bg: "#CC000020" },
  resolved:           { label: "Resolved",             color: "#008000", bg: "#00800020" },
  closed:             { label: "Closed",               color: "#444",    bg: "#44444420" },
};

const statusSteps = [
  { key: "draft",             label: "Case Filed" },
  { key: "complaint_sent",    label: "Complaint Sent" },
  { key: "awaiting_response", label: "Awaiting Response" },
  { key: "response_received", label: "Response Received" },
  { key: "escalation_ready",  label: "Escalation Notice" },
  { key: "escalated",         label: "Escalated" },
  { key: "resolved",          label: "Resolved" },
];

const eventTypeConfig = {
  incident:        { icon: AlertCircle,   color: "#CC0000" },
  complaint:       { icon: MessageSquare, color: "#0066CC" },
  response:        { icon: MessageSquare, color: "#660099" },
  deadline:        { icon: Clock,         color: "#FF8800" },
  escalation:      { icon: ArrowUpRight,  color: "#CC0000" },
  evidence:        { icon: FolderOpen,    color: "#008000" },
  resolution:      { icon: CheckCircle2,  color: "#008000" },
  action_required: { icon: Zap,           color: "#FF8800" },
};

function CollapsibleSection({ title, icon: Icon, iconColor, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
          <span className="font-display font-black text-white text-sm">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function CaseCard({ caseData, isSelected, onClick }) {
  const { case: caseItem, summary } = caseData;
  const statusCfg = statusConfig[caseItem.status] || statusConfig.draft;
  const isUrgent = summary.overdue_count > 0 || ["escalation_ready", "escalated"].includes(caseItem.status);

  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-[#FFD700] bg-[#FFD700]/5"
          : isUrgent
            ? "border-red-500/40 bg-red-500/5 hover:border-red-500/70"
            : "border-gray-800 bg-gray-900 hover:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-bold text-white text-sm leading-tight flex-1">{caseItem.title}</p>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 mt-0.5"
          style={{ background: statusCfg.bg, color: statusCfg.color }}>
          {statusCfg.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 capitalize mb-3">{caseItem.category?.replace(/_/g, " ")} · {caseItem.organisation_name || "Organisation"}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {summary.overdue_count > 0 && (
          <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3" /> {summary.overdue_count} overdue
          </span>
        )}
        {summary.action_count > 0 && (
          <span className="flex items-center gap-1 text-orange-400 text-[10px] font-bold">
            <Zap className="w-3 h-3" /> {summary.action_count} actions
          </span>
        )}
        {summary.upcoming_deadlines.length > 0 && (
          <span className="flex items-center gap-1 text-[#FFD700] text-[10px] font-bold">
            <Clock className="w-3 h-3" />
            {format(new Date(summary.upcoming_deadlines[0].deadline_date), "d MMM")}
          </span>
        )}
        {summary.overdue_count === 0 && summary.action_count === 0 && summary.upcoming_deadlines.length === 0 && (
          <span className="text-gray-600 text-[10px]">No urgent items</span>
        )}
      </div>
    </motion.button>
  );
}

const RESPONSE_TYPES = [
  { value: "general_response", label: "General Response" },
  { value: "offer_settlement", label: "Offer Settlement" },
  { value: "deny_claim", label: "Deny Claim" },
  { value: "request_more_info", label: "Request More Information" },
  { value: "escalation_response", label: "Response to Escalation" },
];

function MerchantResponsePanel({ caseData, session, onResponseSent }) {
  const [responseType, setResponseType] = useState("general_response");
  const [responseText, setResponseText] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const responses = caseData.responses || [];

  const handleSubmit = async () => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await invokeBase44Function("submitMerchantResponse", {
        case_id: caseData.case.id,
        share_id: caseData.share.id,
        session_token: session.sessionToken,
        merchant_name: session.name || session.email,
        response_text: responseText.trim(),
        response_type: responseType,
        offer_amount: offerAmount.trim() || undefined,
      }, { requireSuccess: true });
      setSubmitted(true);
      setResponseText("");
      setOfferAmount("");
      onResponseSent();
    } catch (error) {
      alert(error.message || "Could not send your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2.5">
        <MessageSquare className="w-5 h-5 text-[#FFD700]" />
        <span className="font-display font-black text-white text-sm">Submit Your Response</span>
        {responses.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-400">{responses.length} previous response{responses.length > 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="px-5 pb-5 pt-4 space-y-4">
        {/* Previous responses */}
        {responses.length > 0 && (
          <div className="space-y-2">
            {responses.map(r => (
              <div key={r.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#FFD700] uppercase">{(r.response_type||"").replace(/_/g," ")}</span>
                  <span className="text-[10px] text-gray-500 ml-auto">{r.created_date ? new Date(r.created_date).toLocaleDateString("en-AU") : ""}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{r.response_text}</p>
                {r.offer_amount && <p className="text-xs text-green-400 font-bold mt-1">Offer: {r.offer_amount}</p>}
              </div>
            ))}
          </div>
        )}

        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="font-black text-white">Response Submitted</p>
            <p className="text-sm text-gray-400 mt-1">The complainant has been notified.</p>
            <button onClick={() => setSubmitted(false)} className="mt-3 text-xs text-[#FFD700] hover:underline font-bold">Submit Another Response</button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block">Response Type</label>
              <div className="flex flex-wrap gap-2">
                {RESPONSE_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => setResponseType(rt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${
                      responseType === rt.value
                        ? "bg-[#FFD700] text-black border-[#FFD700]"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {responseType === "offer_settlement" && (
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block">Offer Amount (AUD)</label>
                <input
                  type="text"
                  value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  placeholder="e.g. $500.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block">Your Response</label>
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                rows={5}
                placeholder="Write your formal response to this dispute..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#FFD700] resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !responseText.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:opacity-50 text-black font-black py-3 rounded-xl text-sm transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Submitting…" : "Submit Response"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CaseDetail({ caseData, session, onResponseSent }) {
  const { case: caseItem, deadlines, timeline, checklist, evidence_count, evidence_types, summary } = caseData;
  const statusCfg = statusConfig[caseItem.status] || statusConfig.draft;
  const today = new Date();
  const currentStepIdx = Math.max(0, statusSteps.findIndex(s => s.key === caseItem.status));
  const overdueDeadlines = deadlines.filter(d => d.status === "pending" && isBefore(new Date(d.deadline_date), today));
  const actionItems = timeline.filter(e => e.is_action_required);
  const daysUntilResponse = caseItem.response_deadline
    ? differenceInDays(new Date(caseItem.response_deadline), today)
    : null;
  const isEscalationStage = ["escalation_ready", "escalated"].includes(caseItem.status);
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;

  return (
    <motion.div key={caseItem.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Case header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-mono text-[#FFD700] font-bold mb-1">{caseRef}</p>
            <h2 className="font-display font-black text-white text-lg leading-tight">{caseItem.title}</h2>
          </div>
          <span className="text-xs font-black px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {statusSteps.map((step, i) => {
            const done = i < currentStepIdx;
            const active = i === currentStepIdx;
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center min-w-[54px] text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mb-1 ${
                    done ? "border-[#FFD700] bg-[#FFD700]" : active ? "border-[#FFD700] bg-[#FFD700]/20" : "border-gray-700 bg-gray-900"
                  }`}>
                    {done
                      ? <CheckCircle2 className="w-3 h-3 text-black" />
                      : <span className={`text-[10px] font-black ${active ? "text-[#FFD700]" : "text-gray-600"}`}>{i + 1}</span>
                    }
                  </div>
                  <p className={`text-[9px] font-bold leading-tight ${active ? "text-[#FFD700]" : done ? "text-gray-400" : "text-gray-600"}`}>
                    {step.label}
                  </p>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-3 ${done ? "bg-[#FFD700]" : "bg-gray-700"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Urgent alerts */}
      {(overdueDeadlines.length > 0 || isEscalationStage) && (
        <div className="bg-red-500/10 border-2 border-red-500/40 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-red-400 font-black text-xs">
            <AlertTriangle className="w-4 h-4" /> URGENT NOTICE
          </div>
          {overdueDeadlines.length > 0 && (
            <p className="text-red-300 text-sm"><strong>{overdueDeadlines.length} deadline{overdueDeadlines.length > 1 ? "s" : ""} overdue.</strong> Immediate action required to avoid escalation.</p>
          )}
          {isEscalationStage && caseItem.escalation_body && (
            <p className="text-red-300 text-sm"><strong>Referred to {caseItem.escalation_body}.</strong> Failure to respond may result in a binding determination.</p>
          )}
        </div>
      )}

      {/* Response deadline countdown */}
      {daysUntilResponse !== null && (
        <div className={`rounded-xl border-2 p-4 flex items-center gap-4 ${
          daysUntilResponse < 0 ? "border-red-500/50 bg-red-500/10"
          : daysUntilResponse <= 7 ? "border-orange-500/50 bg-orange-500/10"
          : "border-[#FFD700]/30 bg-[#FFD700]/5"
        }`}>
          <Bell className={`w-5 h-5 shrink-0 ${daysUntilResponse < 0 ? "text-red-400" : daysUntilResponse <= 7 ? "text-orange-400" : "text-[#FFD700]"}`} />
          <div className="flex-1">
            <p className="font-black text-white text-sm">Response Deadline</p>
            <p className="text-xs text-gray-400">{format(new Date(caseItem.response_deadline), "EEEE d MMMM yyyy")}</p>
          </div>
          <div className="text-right">
            {daysUntilResponse < 0
              ? <p className="text-red-400 font-black text-base">{Math.abs(daysUntilResponse)}d overdue</p>
              : daysUntilResponse === 0
                ? <p className="text-orange-400 font-black text-base">Due today</p>
                : <p className={`font-black text-base ${daysUntilResponse <= 7 ? "text-orange-400" : "text-[#FFD700]"}`}>{daysUntilResponse} days left</p>
            }
          </div>
        </div>
      )}

      {/* Required Actions */}
      {actionItems.length > 0 && (
        <CollapsibleSection
          title="Required Actions"
          icon={Zap}
          iconColor="#FF8800"
          defaultOpen={true}
          badge={<Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs ml-1">{actionItems.length}</Badge>}
        >
          <div className="space-y-2.5 pt-1">
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <Zap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                  {item.event_date && <p className="text-xs text-orange-400 font-bold mt-1">{format(new Date(item.event_date), "d MMM yyyy")}</p>}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Deadlines */}
      <CollapsibleSection
        title="Deadlines"
        icon={Clock}
        iconColor="#FF8800"
        defaultOpen={true}
        badge={overdueDeadlines.length > 0
          ? <Badge className="bg-red-500/20 text-red-400 border-0 text-xs ml-1">{overdueDeadlines.length} overdue</Badge>
          : null}
      >
        {deadlines.length === 0 ? (
          <p className="text-gray-500 text-sm pt-1">No deadlines set.</p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {[...deadlines].sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date)).map(dl => {
              const isOverdue = dl.status === "pending" && isBefore(new Date(dl.deadline_date), today);
              const isDone = dl.status === "completed";
              const daysLeft = differenceInDays(new Date(dl.deadline_date), today);
              return (
                <div key={dl.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isOverdue ? "border-red-500/40 bg-red-500/5" : isDone ? "border-green-500/30 bg-green-500/5" : "border-gray-700 bg-gray-800/50"
                }`}>
                  <Flag className="w-4 h-4 shrink-0" style={{ color: isOverdue ? "#CC0000" : isDone ? "#008000" : "#FF8800" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{dl.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{dl.deadline_type?.replace(/_/g, " ")} · {dl.responsibility}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black ${isOverdue ? "text-red-400" : isDone ? "text-green-400" : daysLeft <= 7 ? "text-orange-400" : "text-[#FFD700]"}`}>
                      {dl.deadline_date ? format(new Date(dl.deadline_date), "d MMM yyyy") : "TBD"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {isOverdue ? `⚠ ${Math.abs(daysLeft)}d overdue` : isDone ? "✓ Complete" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* Checklist */}
      <CollapsibleSection title="Checklist Progress" icon={CheckCircle2} iconColor="#008000" defaultOpen={false}>
        <div className="pt-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width: checklist.total > 0 ? `${Math.round((checklist.complete / checklist.total) * 100)}%` : "0%",
                  background: "linear-gradient(to right, #FFD700, #008000)"
                }}
              />
            </div>
            <span className="text-sm font-black text-[#FFD700] shrink-0">{checklist.complete}/{checklist.total}</span>
          </div>
          {checklist.items.map(item => (
            <div key={item.id} className="flex items-center gap-2.5">
              {item.status === "complete"
                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                : item.status === "missing"
                  ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  : <Clock className="w-4 h-4 text-orange-400 shrink-0" />
              }
              <span className={`text-sm flex-1 ${item.status === "complete" ? "text-gray-500 line-through" : "text-white"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Case Info */}
      <CollapsibleSection title="Case Information" icon={FileText} iconColor="#0066CC" defaultOpen={false}>
        <div className="space-y-3 pt-1">
          {caseItem.organisation_name && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div><p className="text-xs text-gray-500">Organisation</p><p className="text-sm font-bold text-white">{caseItem.organisation_name}</p></div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Scale className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div><p className="text-xs text-gray-500">Category</p><p className="text-sm font-bold text-white capitalize">{caseItem.category}</p></div>
          </div>
          {caseItem.incident_date && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div><p className="text-xs text-gray-500">Incident Date</p><p className="text-sm font-bold text-white">{format(new Date(caseItem.incident_date), "d MMM yyyy")}</p></div>
            </div>
          )}
          {caseItem.escalation_body && (
            <div className="flex items-start gap-2">
              <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div><p className="text-xs text-gray-500">Escalation Body</p><p className="text-sm font-bold text-red-300">{caseItem.escalation_body}</p></div>
            </div>
          )}
          {caseItem.desired_outcome && (
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Desired Outcome</p>
              <p className="text-sm text-white leading-relaxed">{caseItem.desired_outcome}</p>
            </div>
          )}
          {caseItem.issue_summary && (
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Issue Summary</p>
              <p className="text-sm text-gray-300 leading-relaxed">{caseItem.issue_summary}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Timeline */}
      <CollapsibleSection title="Case Timeline" icon={Calendar} iconColor="#0066CC" defaultOpen={false}>
        {timeline.length === 0 ? (
          <p className="text-gray-500 text-sm pt-1">No timeline events yet.</p>
        ) : (
          <div className="relative pl-5 pt-2">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-700" />
            {[...timeline]
              .sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date))
              .map((ev, i) => {
                const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.incident;
                const Icon = cfg.icon;
                return (
                  <div key={ev.id} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-3 top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: `${cfg.color}20`, border: `1.5px solid ${cfg.color}50` }}>
                      <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-xs font-mono" style={{ color: cfg.color }}>
                        {ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : ""}
                      </p>
                      <p className="text-sm font-bold text-white">{ev.title}</p>
                      {ev.description && <p className="text-xs text-gray-400 mt-0.5">{ev.description}</p>}
                      {ev.is_action_required && <Badge className="mt-1 bg-orange-500/20 text-orange-400 border-0 text-xs">Action Required</Badge>}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CollapsibleSection>

      {/* Evidence */}
      <CollapsibleSection title="Evidence on File" icon={FolderOpen} iconColor="#008000" defaultOpen={false}>
        <div className="pt-1">
          <p className="text-3xl font-display font-black text-[#FFD700]">{evidence_count}
            <span className="text-sm font-bold text-gray-400 ml-2">files</span>
          </p>
          {evidence_types.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {evidence_types.map(t => (
                <Badge key={t} variant="outline" className="capitalize text-xs border-gray-700 text-gray-300">{t?.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">File contents are private — only the complainant can access documents.</p>
        </div>
      </CollapsibleSection>

      {/* Merchant Response Panel */}
      <MerchantResponsePanel caseData={caseData} session={session} onResponseSent={onResponseSent} />
    </motion.div>
  );
}

export default function MerchantPortal() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sess = readMerchantSession();
    if (!sess) { navigate("/merchant-login", { replace: true }); return; }
    setSession(sess);
    loadCases(sess);
  }, [navigate]);

  async function loadCases(sess, isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await invokeBase44Function("getMerchantCases", { sessionToken: sess.sessionToken }, { requireSuccess: true });
      writeMerchantSession({
        ...sess,
        name: data.merchant_name || sess.name,
        sessionToken: data.session_token || sess.sessionToken,
        expiresAt: data.session_expires_at || sess.expiresAt,
      });
      setSession((current) => ({
        ...(current || sess),
        name: data.merchant_name || current?.name || sess.name,
        sessionToken: data.session_token || current?.sessionToken || sess.sessionToken,
        expiresAt: data.session_expires_at || current?.expiresAt || sess.expiresAt,
      }));
      setCases(data.cases || []);
    } catch (err) {
      const message = err.message || "Could not load your cases.";
      if (/session/i.test(message) || /Unauthorized/i.test(message)) {
        clearMerchantSession();
        navigate("/merchant-login", { replace: true });
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleLogout() {
    clearMerchantSession();
    navigate("/merchant-login", { replace: true });
  }

  const totalOverdue = cases.reduce((sum, c) => sum + c.summary.overdue_count, 0);
  const totalActions = cases.reduce((sum, c) => sum + c.summary.action_count, 0);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading your cases…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <h1 className="text-xl font-display font-black text-white mb-2">Unable to Load Cases</h1>
      <p className="text-gray-400 text-sm mb-6">{error}</p>
      <button onClick={handleLogout} className="text-[#FFD700] text-sm font-bold">Back to Login</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-[#FFD700] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9d65d2d51_IMG_6994.jpeg"
            alt="Chaos Controller"
            className="h-8 object-cover rounded shrink-0"
            style={{ width: "auto", maxWidth: 120 }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[#FFD700] font-mono text-[9px] font-bold uppercase tracking-widest">Merchant Portal</p>
            <p className="text-white font-bold text-sm truncate">{session?.name || session?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCases(session, true)}
              disabled={refreshing}
              className="text-gray-400 hover:text-white transition-colors p-1.5"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-400 transition-colors px-2 py-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* Summary KPIs */}
        {(totalOverdue > 0 || totalActions > 0) && (
          <div className="flex flex-wrap gap-3 mb-5">
            {totalOverdue > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm font-bold">{totalOverdue} overdue deadline{totalOverdue > 1 ? "s" : ""}</span>
              </div>
            )}
            {totalActions > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 text-sm font-bold">{totalActions} action{totalActions > 1 ? "s" : ""} required</span>
              </div>
            )}
          </div>
        )}

        {cases.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">No active cases shared with your account.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[320px_1fr] gap-5">
            {/* Case list sidebar */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                {cases.length} Active Dispute{cases.length > 1 ? "s" : ""}
              </p>
              {cases.map((c, idx) => (
                <CaseCard
                  key={c.case.id}
                  caseData={c}
                  isSelected={idx === selectedCaseIdx}
                  onClick={() => setSelectedCaseIdx(idx)}
                />
              ))}
            </div>

            {/* Case detail panel */}
            <div>
              <AnimatePresence mode="wait">
                {cases[selectedCaseIdx] && (
                  <CaseDetail
                    key={cases[selectedCaseIdx].case.id}
                    caseData={cases[selectedCaseIdx]}
                    session={session}
                    onResponseSent={() => loadCases(session, true)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-700 pt-8 border-t border-gray-900 mt-8 space-y-1">
          <p>Secure merchant portal — read-only access. Powered by <span className="text-[#FFD700] font-bold">Chaos Controller™</span></p>
          <p>Designed & Developed by Deb King 2025</p>
        </div>
      </div>
    </div>
  );
}