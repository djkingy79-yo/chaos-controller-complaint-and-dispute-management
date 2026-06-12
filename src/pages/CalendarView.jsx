import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const eventTypeConfig = {
  deadline: { color: "bg-destructive text-destructive-foreground", dot: "bg-destructive", label: "Deadline" },
  response_due: { color: "bg-destructive text-destructive-foreground", dot: "bg-destructive", label: "Response Due" },
  incident: { color: "bg-warning text-warning-foreground", dot: "bg-warning", label: "Incident" },
  complaint: { color: "bg-primary text-primary-foreground", dot: "bg-primary", label: "Complaint" },
  response: { color: "bg-success text-success-foreground", dot: "bg-success", label: "Response" },
  escalation: { color: "bg-accent text-accent-foreground", dot: "bg-accent", label: "Escalation" },
  tribunal_date: { color: "bg-accent text-accent-foreground", dot: "bg-accent", label: "Tribunal" },
  evidence: { color: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground", label: "Evidence" },
  resolution: { color: "bg-success text-success-foreground", dot: "bg-success", label: "Resolution" },
  action_required: { color: "bg-destructive text-destructive-foreground", dot: "bg-destructive", label: "Action Required" },
  submission: { color: "bg-primary text-primary-foreground", dot: "bg-primary", label: "Submission" },
  other: { color: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground", label: "Event" },
};

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const { user } = useAuth();

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-all"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }),
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines-all"],
    queryFn: () => base44.entities.Deadline.list(),
    enabled: cases.length > 0,
  });

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ["timeline-all"],
    queryFn: () => base44.entities.TimelineEvent.list(),
    enabled: cases.length > 0,
  });

  const caseMap = Object.fromEntries(cases.map((c) => [c.id, c]));

  // Build unified event list
  const allEvents = [
    ...deadlines
      .filter((d) => d.deadline_date)
      .map((d) => ({
        id: `deadline-${d.id}`,
        date: new Date(d.deadline_date),
        title: d.title,
        type: d.deadline_type || "deadline",
        caseTitle: caseMap[d.case_id]?.title || "Unknown Case",
        caseId: d.case_id,
        source: "deadline",
        status: d.status,
      })),
    ...timelineEvents
      .filter((e) => e.event_date)
      .map((e) => ({
        id: `timeline-${e.id}`,
        date: new Date(e.event_date),
        title: e.title,
        type: e.event_type || "other",
        caseTitle: caseMap[e.case_id]?.title || "Unknown Case",
        caseId: e.case_id,
        source: "timeline",
        isAction: e.is_action_required,
      })),
  ];

  // Events for a given day
  const eventsOnDay = (day) =>
    allEvents.filter((e) => isSameDay(e.date, day));

  // Events for selected day or upcoming (next 7 days)
  const sidebarEvents = selectedDay
    ? eventsOnDay(selectedDay)
    : allEvents
        .filter((e) => e.date >= new Date())
        .sort((a, b) => a.date - b.date)
        .slice(0, 15);

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const upcomingUrgent = allEvents.filter(
    (e) => e.date >= new Date() && (e.type === "deadline" || e.type === "response_due" || e.type === "tribunal_date" || e.isAction)
  ).sort((a, b) => a.date - b.date).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Command Calendar</h1>
        <p className="text-sm text-muted-foreground">All deadlines and timeline events across every case.</p>
      </div>

      {/* Urgent alerts */}
      {upcomingUrgent.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {upcomingUrgent.map((ev) => {
            const daysLeft = Math.ceil((ev.date - new Date()) / 86400000);
            const urgent = daysLeft <= 3;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3 flex items-start gap-3 ${urgent ? "bg-destructive/10 border-destructive/30" : "bg-warning/10 border-warning/30"}`}
              >
                {urgent ? <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> : <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{ev.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{ev.caseTitle}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${urgent ? "text-destructive" : "text-warning"}`}>
                    {daysLeft === 0 ? "TODAY" : daysLeft === 1 ? "TOMORROW" : `${daysLeft} days`}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Calendar */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-display font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const dayEvents = eventsOnDay(d);
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isSelected = selectedDay && isSameDay(d, selectedDay);
              const isT = isToday(d);
              const hasUrgent = dayEvents.some((e) => e.type === "deadline" || e.type === "response_due" || e.type === "tribunal_date");

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : d)}
                  className={`min-h-[72px] p-1.5 border-b border-r border-border text-left transition-colors relative
                    ${!isCurrentMonth ? "opacity-30" : ""}
                    ${isSelected ? "bg-primary/10" : "hover:bg-secondary/50"}
                  `}
                >
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1
                    ${isT ? "bg-primary text-primary-foreground" : "text-foreground"}
                  `}>
                    {format(d, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const cfg = eventTypeConfig[ev.type] || eventTypeConfig.other;
                      return (
                        <div key={ev.id} className={`text-[9px] font-medium px-1 py-0.5 rounded truncate ${cfg.color}`}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                  {hasUrgent && !isSelected && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              {selectedDay ? format(selectedDay, "d MMMM yyyy") : "Upcoming Events"}
            </h3>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="text-[10px] text-muted-foreground ml-auto hover:text-foreground underline">
                Clear
              </button>
            )}
          </div>

          {sidebarEvents.length === 0 ? (
            <div className="bg-secondary/30 rounded-xl border border-dashed border-border p-6 text-center">
              <Zap className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No events {selectedDay ? "on this day" : "upcoming"}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {sidebarEvents.map((ev) => {
                const cfg = eventTypeConfig[ev.type] || eventTypeConfig.other;
                const isPastEvent = isPast(ev.date) && !isToday(ev.date);
                return (
                  <div
                    key={ev.id}
                    className={`bg-card border rounded-xl p-3 ${isPastEvent ? "opacity-50 border-border" : "border-border hover:border-primary/30"} transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">{ev.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{ev.caseTitle}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5">{cfg.label}</Badge>
                          <span className="text-[10px] text-muted-foreground">{format(ev.date, "d MMM yyyy")}</span>
                          {ev.source === "deadline" && ev.status === "missed" && (
                            <Badge className="text-[9px] py-0 px-1.5 bg-destructive text-destructive-foreground">Missed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="bg-secondary/20 rounded-xl border border-border p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Legend</p>
            {[["deadline", "Deadlines"], ["complaint", "Complaints"], ["response", "Responses"], ["escalation", "Escalations"], ["evidence", "Evidence"]].map(([type, label]) => {
              const cfg = eventTypeConfig[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}