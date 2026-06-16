import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { format, isBefore, isAfter } from "date-fns";
import {
  AlertCircle, Clock, CheckCircle2, FolderOpen, Calendar,
  ArrowUpRight, MessageSquare, FileText, Zap, Shield, Flag,
  Loader2, XCircle, Scale
} from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  draft:              { label: "Draft",              color: "#888", bg: "#88888820" },
  complaint_sent:     { label: "Complaint Sent",     color: "#0066CC", bg: "#0066CC20" },
  awaiting_response:  { label: "Awaiting Response",  color: "#FF8800", bg: "#FF880020" },
  response_received:  { label: "Response Received",  color: "#660099", bg: "#66009920" },
  escalation_ready:   { label: "Ready for Escalation", color: "#CC0000", bg: "#CC000020" },
  escalated:          { label: "Escalated",          color: "#CC0000", bg: "#CC000020" },
  resolved:           { label: "Resolved",           color: "#008000", bg: "#00800020" },
  closed:             { label: "Closed",             color: "#444", bg: "#44444420" },
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

export default function SharedCasePortal() {
  const token = window.location.pathname.split("/shared-case/")[1];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setError("No share token found."); setLoading(false); return; }
    base44.functions.invoke("getSharedCase", { token })
      .then(res => setData(res.data))
      .catch(err => setError(err.message || "Failed to load case."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#FFD700] animate-spin" />
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-[#FFD700]">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png" alt="Chaos Controller" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-[#FFD700] font-mono text-xs font-bold uppercase tracking-widest">Chaos Controller™ — Shared Case Portal</p>
            <h1 className="text-xl font-display font-black text-white">{caseItem.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Greeting banner */}
        {share?.recipient_name && (
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-4">
            <p className="text-[#FFD700] font-bold text-sm">
              👋 This case has been shared with you, <span className="text-white">{share.recipient_name}</span>. You have read-only access to the case status, timeline, deadlines, and checklist below.
            </p>
          </div>
        )}

        {/* Status + summary cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Current Status</p>
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-black"
                style={{ background: statusCfg.bg, color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <p><span className="text-gray-500">Organisation:</span> <span className="font-bold">{caseItem.organisation_name || "N/A"}</span></p>
              <p><span className="text-gray-500">Category:</span> <span className="font-bold capitalize">{caseItem.category || "N/A"}</span></p>
              {caseItem.incident_date && (
                <p><span className="text-gray-500">Incident Date:</span> <span className="font-bold">{format(new Date(caseItem.incident_date), "d MMM yyyy")}</span></p>
              )}
              {caseItem.response_deadline && (
                <p>
                  <span className="text-gray-500">Response Deadline:</span>{" "}
                  <span className={`font-black ${isBefore(new Date(caseItem.response_deadline), today) ? "text-red-400" : "text-[#FFD700]"}`}>
                    {format(new Date(caseItem.response_deadline), "d MMM yyyy")}
                    {isBefore(new Date(caseItem.response_deadline), today) && " ⚠ OVERDUE"}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">What We Want</p>
            <p className="text-sm text-white leading-relaxed">{caseItem.desired_outcome || "Not specified."}</p>
            {caseItem.issue_summary && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Summary</p>
                <p className="text-sm text-gray-300">{caseItem.issue_summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Deadlines */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-display font-black text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FF8800]" /> Deadlines
            {overdueDeadlines.length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-0 text-xs font-bold">{overdueDeadlines.length} OVERDUE</Badge>
            )}
          </h2>
          {deadlines.length === 0 ? (
            <p className="text-gray-500 text-sm">No deadlines set.</p>
          ) : (
            <div className="space-y-3">
              {[...deadlines].sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date)).map(dl => {
                const isOverdue = dl.status === "pending" && isBefore(new Date(dl.deadline_date), today);
                const isDone = dl.status === "completed";
                return (
                  <div key={dl.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? "border-red-500/30 bg-red-500/5" : isDone ? "border-green-500/30 bg-green-500/5" : "border-gray-700"}`}>
                    <Flag className="w-4 h-4 shrink-0" style={{ color: isOverdue ? "#CC0000" : isDone ? "#008000" : "#FF8800" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{dl.title}</p>
                      <p className="text-xs text-gray-400">{dl.deadline_type?.replace(/_/g, " ")} · Responsibility: {dl.responsibility}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${isOverdue ? "text-red-400" : isDone ? "text-green-400" : "text-[#FFD700]"}`}>
                        {dl.deadline_date ? format(new Date(dl.deadline_date), "d MMM yyyy") : "TBD"}
                      </p>
                      <p className="text-xs text-gray-500">{isOverdue ? "⚠ OVERDUE" : isDone ? "✓ Done" : "Pending"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Checklist progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-display font-black text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" /> Checklist Progress
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-gray-800 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: checklist.total > 0 ? `${Math.round((checklist.complete / checklist.total) * 100)}%` : "0%",
                  background: "linear-gradient(to right, #FFD700, #008000)"
                }}
              />
            </div>
            <span className="text-sm font-black text-[#FFD700]">
              {checklist.complete}/{checklist.total}
            </span>
          </div>
          <div className="space-y-2">
            {checklist.items.map(item => {
              const cfg = checklistStatusConfig[item.status] || checklistStatusConfig.missing;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                  <span className={`text-sm ${item.status === "complete" ? "text-gray-500 line-through" : "text-white"}`}>{item.label}</span>
                  <Badge variant="outline" className="text-xs capitalize ml-auto">{item.category}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-display font-black text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0066CC]" /> Case Timeline
          </h2>
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-sm">No timeline events recorded yet.</p>
          ) : (
            <div className="relative pl-5">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-700" />
              {[...timeline].sort((a, b) => new Date(a.event_date || a.created_date) - new Date(b.event_date || b.created_date)).map((ev, i) => {
                const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.incident;
                const Icon = cfg.icon;
                return (
                  <motion.div key={ev.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-3 top-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}20`, border: `1.5px solid ${cfg.color}50` }}>
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
        </div>

        {/* Evidence summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-display font-black text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-green-400" /> Evidence on File
          </h2>
          <p className="text-3xl font-display font-black text-[#FFD700]">{evidence_count} <span className="text-base font-bold text-gray-400">files uploaded</span></p>
          {evidence_types.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {evidence_types.map(t => (
                <Badge key={t} variant="outline" className="capitalize text-xs">{t?.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-800">
          <p>This is a read-only shared view. Powered by <span className="text-[#FFD700] font-bold">Chaos Controller™</span></p>
          <p className="mt-1">Designed & Developed by Deb King, Glenmore Park 2025</p>
        </div>
      </div>
    </div>
  );
}