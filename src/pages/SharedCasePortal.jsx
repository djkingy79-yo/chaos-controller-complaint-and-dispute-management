import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { format, isBefore, isAfter, differenceInDays } from "date-fns";
import {
  AlertCircle, Clock, CheckCircle2, FolderOpen, Calendar,
  ArrowUpRight, MessageSquare, FileText, Zap, Shield, Flag,
  Loader2, XCircle, Scale, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, Eye, Users, Building2, Target, Bell
} from "lucide-react";
import { motion } from "framer-motion";

const statusSteps = [
  { key: "draft",              label: "Case Filed",          desc: "Complaint prepared" },
  { key: "complaint_sent",     label: "Complaint Sent",      desc: "Formal complaint delivered" },
  { key: "awaiting_response",  label: "Awaiting Response",   desc: "Response window open" },
  { key: "response_received",  label: "Response Received",   desc: "Reply under review" },
  { key: "escalation_ready",   label: "Escalation Notice",   desc: "Heading to ombudsman" },
  { key: "escalated",          label: "Escalated",           desc: "External body notified" },
  { key: "resolved",           label: "Resolved",            desc: "Matter settled" },
];

const statusIndex = (status) => {
  const i = statusSteps.findIndex(s => s.key === status);
  return i >= 0 ? i : 0;
};

const statusConfig = {
  draft:              { label: "Draft",                   color: "#888",    bg: "#88888820" },
  complaint_sent:     { label: "Complaint Sent",          color: "#0066CC", bg: "#0066CC20" },
  awaiting_response:  { label: "Awaiting Response",       color: "#FF8800", bg: "#FF880020" },
  response_received:  { label: "Response Received",       color: "#660099", bg: "#66009920" },
  escalation_ready:   { label: "Ready for Escalation",    color: "#CC0000", bg: "#CC000020" },
  escalated:          { label: "Escalated",               color: "#CC0000", bg: "#CC000020" },
  resolved:           { label: "Resolved",                color: "#008000", bg: "#00800020" },
  closed:             { label: "Closed",                  color: "#444",    bg: "#44444420" },
};

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

const checklistStatusConfig = {
  complete:     { icon: CheckCircle2, color: "#008000" },
  needs_review: { icon: AlertCircle,  color: "#FF8800" },
  missing:      { icon: XCircle,      color: "#CC0000" },
  locked:       { icon: Shield,       color: "#888" },
};

function Section({ title, icon: Icon, iconColor, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
          <span className="font-display font-black text-white text-base">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function SharedCasePortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setError("No share token found."); setLoading(false); return; }
    base44.functions.invoke("getSharedCase", { token })
      .then(res => {
        if (res.data?.error) {
          setError(res.data.error || "Invalid share link");
        } else {
          setData(res.data);
        }
      })
      .catch(err => {
        console.error("Error loading shared case:", err);
        setError(err.message || "This share link is invalid or has expired. Please contact the sender.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#FFD700] animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading case portal…</p>
      </div>
    </div>
  );

  if (error || !data?.case) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
      <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png" alt="Chaos Controller" className="w-24 h-24 mb-6 object-contain" />
      <h1 className="text-2xl font-display font-black text-[#FFD700] mb-2">Link Expired or Invalid</h1>
      <p className="text-gray-400">{error || "This case portal link is no longer active."}</p>
    </div>
  );

  const { case: caseItem, deadlines, timeline, checklist, evidence_count, evidence_types, share } = data;
  const statusCfg = statusConfig[caseItem.status] || statusConfig.draft;
  const today = new Date();
  const overdueDeadlines = deadlines.filter(d => d.status === "pending" && isBefore(new Date(d.deadline_date), today));
  const upcomingDeadlines = deadlines.filter(d => d.status === "pending" && isAfter(new Date(d.deadline_date), today));
  const actionItems = timeline.filter(e => e.is_action_required);
  const currentStepIdx = statusIndex(caseItem.status);
  const isEscalationStage = ["escalation_ready", "escalated"].includes(caseItem.status);
  const daysUntilResponse = caseItem.response_deadline
    ? differenceInDays(new Date(caseItem.response_deadline), today)
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-[#FFD700] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png" alt="Chaos Controller" className="w-10 h-10 object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[#FFD700] font-mono text-[10px] font-bold uppercase tracking-widest">Chaos Controller™ — Merchant Portal</p>
            <h1 className="text-lg font-display font-black text-white truncate">{caseItem.title}</h1>
          </div>
          <span className="px-3 py-1.5 rounded-lg text-xs font-black shrink-0" style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        {share?.recipient_name && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-4 flex items-start gap-3">
            <Eye className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#FFD700] font-bold text-sm">Shared with {share.recipient_name}</p>
              <p className="text-gray-400 text-xs mt-0.5">Read-only view of case status, progress, deadlines and required actions. Updated in real time.</p>
            </div>
          </motion.div>
        )}

        {/* ⚠ Urgent Alerts Banner */}
        {(overdueDeadlines.length > 0 || isEscalationStage) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-black text-sm">
              <AlertTriangle className="w-5 h-5" /> URGENT NOTICE
            </div>
            {overdueDeadlines.length > 0 && (
              <p className="text-sm text-red-300">
                <strong>{overdueDeadlines.length} deadline{overdueDeadlines.length > 1 ? "s are" : " is"} overdue.</strong> Immediate action is required to avoid escalation.
              </p>
            )}
            {isEscalationStage && caseItem.escalation_body && (
              <p className="text-sm text-red-300">
                <strong>This matter has been referred to {caseItem.escalation_body}.</strong> Failure to respond may result in a binding determination.
              </p>
            )}
          </motion.div>
        )}

        {/* Response Deadline Countdown */}
        {daysUntilResponse !== null && (
          <div className={`rounded-xl border-2 p-4 flex items-center gap-4 ${daysUntilResponse < 0 ? "border-red-500/50 bg-red-500/10" : daysUntilResponse <= 7 ? "border-orange-500/50 bg-orange-500/10" : "border-[#FFD700]/30 bg-[#FFD700]/5"}`}>
            <Bell className={`w-6 h-6 shrink-0 ${daysUntilResponse < 0 ? "text-red-400" : daysUntilResponse <= 7 ? "text-orange-400" : "text-[#FFD700]"}`} />
            <div className="flex-1">
              <p className="font-black text-white text-sm">Response Deadline</p>
              <p className="text-xs text-gray-400">{format(new Date(caseItem.response_deadline), "EEEE d MMMM yyyy")}</p>
            </div>
            <div className="text-right">
              {daysUntilResponse < 0 ? (
                <p className="text-red-400 font-black text-lg">{Math.abs(daysUntilResponse)}d overdue</p>
              ) : daysUntilResponse === 0 ? (
                <p className="text-orange-400 font-black text-lg">Due today</p>
              ) : (
                <p className={`font-black text-lg ${daysUntilResponse <= 7 ? "text-orange-400" : "text-[#FFD700]"}`}>{daysUntilResponse} days left</p>
              )}
            </div>
          </div>
        )}

        {/* Dispute Progress Tracker */}
        <Section title="Dispute Progress" icon={TrendingUp} iconColor="#FFD700" defaultOpen={true}>
          <div className="pt-2">
            {/* Mobile: vertical stepper */}
            <div className="space-y-3 sm:hidden">
              {statusSteps.map((step, i) => {
                const done = i < currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 ${done ? "border-[#FFD700] bg-[#FFD700]" : active ? "border-[#FFD700] bg-[#FFD700]/20" : "border-gray-700 bg-gray-900"}`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-black" /> : (
                        <span className={`text-xs font-black ${active ? "text-[#FFD700]" : "text-gray-600"}`}>{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${active ? "text-[#FFD700]" : done ? "text-gray-300" : "text-gray-600"}`}>{step.label}</p>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop: horizontal stepper */}
            <div className="hidden sm:flex items-start gap-1 overflow-x-auto pb-2">
              {statusSteps.map((step, i) => {
                const done = i < currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center min-w-[80px] text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1.5 ${done ? "border-[#FFD700] bg-[#FFD700]" : active ? "border-[#FFD700] bg-[#FFD700]/20" : "border-gray-700 bg-gray-900"}`}>
                        {done ? <CheckCircle2 className="w-4 h-4 text-black" /> : (
                          <span className={`text-xs font-black ${active ? "text-[#FFD700]" : "text-gray-600"}`}>{i + 1}</span>
                        )}
                      </div>
                      <p className={`text-[10px] font-bold leading-tight ${active ? "text-[#FFD700]" : done ? "text-gray-300" : "text-gray-600"}`}>{step.label}</p>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mt-4 ${done ? "bg-[#FFD700]" : "bg-gray-700"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Current stage callout */}
            <div className="mt-4 rounded-lg p-3 border" style={{ background: statusCfg.bg, borderColor: `${statusCfg.color}40` }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: statusCfg.color }}>Current Stage</p>
              <p className="text-sm font-bold text-white mt-0.5">{statusCfg.label}</p>
              {statusSteps[currentStepIdx]?.desc && (
                <p className="text-xs text-gray-400 mt-0.5">{statusSteps[currentStepIdx].desc}</p>
              )}
            </div>
          </div>
        </Section>

        {/* Required Actions */}
        {actionItems.length > 0 && (
          <Section
            title="Required Actions"
            icon={Zap}
            iconColor="#FF8800"
            defaultOpen={true}
            badge={<Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs font-bold">{actionItems.length} pending</Badge>}
          >
            <div className="space-y-3 pt-1">
              {actionItems.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <Zap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                    {item.event_date && (
                      <p className="text-xs text-orange-400 font-bold mt-1">{format(new Date(item.event_date), "d MMM yyyy")}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* Case Summary */}
        <Section title="Case Summary" icon={FileText} iconColor="#0066CC" defaultOpen={true}>
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2.5">
              {caseItem.organisation_name && (
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div><span className="text-gray-500 text-xs">Organisation</span><p className="font-bold text-white">{caseItem.organisation_name}</p></div>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <Scale className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div><span className="text-gray-500 text-xs">Category</span><p className="font-bold text-white capitalize">{caseItem.category}</p></div>
              </div>
              {caseItem.incident_date && (
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div><span className="text-gray-500 text-xs">Incident Date</span><p className="font-bold text-white">{format(new Date(caseItem.incident_date), "d MMM yyyy")}</p></div>
                </div>
              )}
              {caseItem.escalation_body && (
                <div className="flex items-start gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div><span className="text-gray-500 text-xs">Escalation Body</span><p className="font-bold text-red-300">{caseItem.escalation_body}</p></div>
                </div>
              )}
            </div>
            <div className="space-y-3">
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
          </div>
        </Section>

        {/* Deadlines */}
        <Section
          title="Deadlines"
          icon={Clock}
          iconColor="#FF8800"
          defaultOpen={true}
          badge={overdueDeadlines.length > 0 ? (
            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs font-bold">{overdueDeadlines.length} overdue</Badge>
          ) : upcomingDeadlines.length > 0 ? (
            <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">{upcomingDeadlines.length} upcoming</Badge>
          ) : null}
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
                  <div key={dl.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? "border-red-500/40 bg-red-500/8" : isDone ? "border-green-500/30 bg-green-500/5" : "border-gray-700 bg-gray-800/50"}`}>
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
        </Section>

        {/* Checklist Progress */}
        <Section title="Checklist Progress" icon={CheckCircle2} iconColor="#008000" defaultOpen={true}>
          <div className="pt-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{
                    width: checklist.total > 0 ? `${Math.round((checklist.complete / checklist.total) * 100)}%` : "0%",
                    background: "linear-gradient(to right, #FFD700, #008000)"
                  }}
                />
              </div>
              <span className="text-sm font-black text-[#FFD700] shrink-0">
                {checklist.complete}/{checklist.total} done
              </span>
            </div>
            {checklist.items.length === 0 ? (
              <p className="text-gray-500 text-sm">No checklist items yet.</p>
            ) : (
              <div className="space-y-2">
                {checklist.items.map(item => {
                  const cfg = checklistStatusConfig[item.status] || checklistStatusConfig.missing;
                  const Icon = cfg.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                      <span className={`text-sm flex-1 ${item.status === "complete" ? "text-gray-500 line-through" : "text-white"}`}>{item.label}</span>
                      <Badge variant="outline" className="text-[10px] capitalize border-gray-700 text-gray-400">{item.category}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        {/* Case Timeline */}
        <Section title="Case Timeline" icon={Calendar} iconColor="#0066CC" defaultOpen={false}>
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-sm pt-1">No timeline events recorded yet.</p>
          ) : (
            <div className="relative pl-5 pt-2">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-700" />
              {[...timeline]
                .sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date))
                .map((ev, i) => {
                  const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.incident;
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative pb-4 last:pb-0">
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
                        {ev.is_action_required && (
                          <Badge className="mt-1 bg-orange-500/20 text-orange-400 border-0 text-xs">Action Required</Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </Section>

        {/* Evidence on File */}
        <Section title="Evidence on File" icon={FolderOpen} iconColor="#008000" defaultOpen={false}>
          <div className="pt-1">
            <p className="text-4xl font-display font-black text-[#FFD700]">{evidence_count}
              <span className="text-base font-bold text-gray-400 ml-2">files</span>
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
        </Section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pt-2 border-t border-gray-800 space-y-1">
          <p>This is a read-only shared view. Powered by <span className="text-[#FFD700] font-bold">Chaos Controller™</span></p>
          <p>Designed & Developed by Deb King, Glenmore Park 2025</p>
        </div>
      </div>
    </div>
  );
}