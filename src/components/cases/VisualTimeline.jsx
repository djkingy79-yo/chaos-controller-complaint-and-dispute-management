import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle, FileText, Clock, CheckCircle2, Zap, ArrowUpRight,
  MessageSquare, Calendar, FolderOpen, Flag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const eventTypeConfig = {
  incident:        { icon: AlertCircle,   color: "#CC0000",  label: "Incident" },
  complaint:       { icon: MessageSquare, color: "#0066CC",  label: "Complaint" },
  response:        { icon: MessageSquare, color: "#660099",  label: "Response" },
  deadline:        { icon: Clock,         color: "#FF8800",  label: "Deadline" },
  escalation:      { icon: ArrowUpRight,  color: "#CC0000",  label: "Escalation" },
  evidence:        { icon: FolderOpen,    color: "#008000",  label: "Evidence" },
  resolution:      { icon: CheckCircle2,  color: "#008000",  label: "Resolution" },
  action_required: { icon: Zap,           color: "#FF8800",  label: "Action Required" },
};

const deadlineTypeConfig = {
  response_due:       { color: "#CC0000",  label: "Response Due" },
  submission:         { color: "#0066CC",  label: "Submission" },
  tribunal_date:      { color: "#660099",  label: "Tribunal" },
  escalation_window:  { color: "#FF8800",  label: "Escalation Window" },
  review_period:      { color: "#008000",  label: "Review Period" },
  other:              { color: "#888888",  label: "Other" },
};

export default function VisualTimeline({ caseId, events = [], evidence = [] }) {
  const [filter, setFilter] = useState("all");

  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseId],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  // Combine all items into a unified list
  const allItems = [
    ...events.map(e => ({
      id: e.id,
      date: e.event_date || e.created_date,
      type: "event",
      subtype: e.event_type || "incident",
      title: e.title,
      description: e.description,
      isActionRequired: e.is_action_required,
    })),
    ...evidence.map(e => ({
      id: `ev-${e.id}`,
      date: e.event_date || e.created_date,
      type: "evidence",
      subtype: "evidence",
      title: e.file_name || "Evidence file",
      description: e.description || e.file_type,
      badge: e.file_type,
    })),
    ...deadlines.map(d => ({
      id: `dl-${d.id}`,
      date: d.deadline_date,
      type: "deadline",
      subtype: d.deadline_type || "other",
      title: d.title,
      description: d.notes,
      status: d.status,
      responsibility: d.responsibility,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const filtered = filter === "all" ? allItems
    : filter === "deadlines" ? allItems.filter(i => i.type === "deadline")
    : filter === "evidence" ? allItems.filter(i => i.type === "evidence")
    : allItems.filter(i => i.type === "event");

  const today = new Date();
  const upcoming = allItems.filter(i => i.type === "deadline" && i.status === "pending" && isAfter(new Date(i.date), today));
  const overdue = allItems.filter(i => i.type === "deadline" && i.status === "pending" && isBefore(new Date(i.date), today));

  if (allItems.length === 0) {
    return (
      <div className="bg-secondary/20 rounded-xl border border-dashed border-border p-10 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No events, evidence or deadlines yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add timeline events, upload evidence, or set deadlines to see them plotted here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-black text-foreground">{allItems.length}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${overdue.length > 0 ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"}`}>
          <p className={`text-2xl font-display font-black ${overdue.length > 0 ? "text-red-500" : "text-foreground"}`}>{overdue.length}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
        <div className={`rounded-xl p-3 text-center border ${upcoming.length > 0 ? "bg-orange-500/10 border-orange-500/30" : "bg-card border-border"}`}>
          <p className={`text-2xl font-display font-black ${upcoming.length > 0 ? "text-orange-500" : "text-foreground"}`}>{upcoming.length}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["all", "All"], ["event", "Events"], ["evidence", "Evidence"], ["deadlines", "Deadlines"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === val
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Visual timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-1">
          {filtered.map((item, i) => {
            const itemDate = new Date(item.date);
            const isPast = isBefore(itemDate, today);
            const isDeadline = item.type === "deadline";
            const isOverdue = isDeadline && item.status === "pending" && isPast;
            const isDone = isDeadline && item.status === "completed";

            let iconColor = "#888";
            let Icon = Calendar;

            if (item.type === "event") {
              const cfg = eventTypeConfig[item.subtype] || eventTypeConfig.incident;
              iconColor = cfg.color;
              Icon = cfg.icon;
            } else if (item.type === "evidence") {
              iconColor = "#008000";
              Icon = FolderOpen;
            } else if (item.type === "deadline") {
              const cfg = deadlineTypeConfig[item.subtype] || deadlineTypeConfig.other;
              iconColor = isOverdue ? "#CC0000" : isDone ? "#008000" : cfg.color;
              Icon = isOverdue ? AlertCircle : isDone ? CheckCircle2 : Flag;
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative flex gap-4 pb-3 last:pb-0"
              >
                {/* Icon node */}
                <div
                  className="relative z-10 w-11 h-11 rounded-full shrink-0 flex items-center justify-center border-2"
                  style={{
                    backgroundColor: `${iconColor}18`,
                    borderColor: `${iconColor}50`,
                  }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
                </div>

                {/* Content */}
                <div
                  className={`flex-1 bg-card rounded-xl border p-3.5 ${
                    isOverdue ? "border-red-500/40 bg-red-500/5" :
                    item.isActionRequired ? "border-orange-500/40 bg-orange-500/5" :
                    "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: iconColor }}
                        >
                          {item.date ? format(new Date(item.date), "d MMM yyyy") : "No date"}
                          {isToday(new Date(item.date)) && <span className="ml-1 text-orange-500">· TODAY</span>}
                        </span>
                        {item.type === "deadline" && (
                          <Badge
                            className="text-xs border-0 font-bold"
                            style={{
                              background: `${iconColor}20`,
                              color: iconColor
                            }}
                          >
                            {isOverdue ? "⚠ OVERDUE" : isDone ? "✓ Done" : deadlineTypeConfig[item.subtype]?.label || "Deadline"}
                          </Badge>
                        )}
                        {item.type === "evidence" && (
                          <Badge variant="outline" className="text-xs capitalize">{item.badge || "file"}</Badge>
                        )}
                        {item.isActionRequired && (
                          <Badge className="text-xs bg-orange-500/20 text-orange-500 border-0">Action Required</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize shrink-0">
                      {item.type === "event" ? (eventTypeConfig[item.subtype]?.label || item.subtype) :
                       item.type === "evidence" ? "Evidence" : "Deadline"}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}