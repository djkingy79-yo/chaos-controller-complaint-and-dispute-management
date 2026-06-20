import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const COLUMNS = [
  { id: "draft", label: "Draft", color: "border-muted-foreground/30", dot: "bg-muted-foreground", header: "bg-muted/40" },
  { id: "complaint_sent", label: "Complaint Sent", color: "border-purple-500/30", dot: "bg-purple-500", header: "bg-purple-500/10" },
  { id: "awaiting_response", label: "Awaiting Response", color: "border-yellow-500/30", dot: "bg-yellow-500", header: "bg-yellow-500/10" },
  { id: "response_received", label: "Response Received", color: "border-blue-500/30", dot: "bg-blue-500", header: "bg-blue-500/10" },
  { id: "escalation_ready", label: "Escalation Ready", color: "border-destructive/30", dot: "bg-destructive", header: "bg-destructive/10" },
  { id: "escalated", label: "Escalated", color: "border-orange-500/30", dot: "bg-orange-500", header: "bg-orange-500/10" },
  { id: "resolved", label: "Resolved", color: "border-success/30", dot: "bg-success", header: "bg-success/10" },
  { id: "closed", label: "Closed", color: "border-border", dot: "bg-muted-foreground", header: "bg-muted/20" },
];

const PRIORITY_COLORS = {
  urgent: "text-destructive",
  high: "text-orange-500",
  medium: "text-warning",
  low: "text-muted-foreground",
};

function CaseKanbanCard({ caseItem, index }) {
  const daysUntilDeadline = caseItem.response_deadline
    ? Math.round((new Date(caseItem.response_deadline) - new Date()) / 86400000)
    : null;

  return (
    <Draggable draggableId={caseItem.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-card border border-border rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing transition-shadow ${
            snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/40 rotate-1" : "hover:border-primary/30 hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{caseItem.title}</p>
            <Link
              to={`/case/${caseItem.id}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {caseItem.organisation_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{caseItem.organisation_name}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {caseItem.category && (
              <span className="text-[10px] uppercase tracking-wide font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {caseItem.category}
              </span>
            )}
            {caseItem.priority && (
              <span className={`text-[10px] uppercase font-bold ${PRIORITY_COLORS[caseItem.priority] || "text-muted-foreground"}`}>
                {caseItem.priority}
              </span>
            )}
          </div>

          {daysUntilDeadline !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              daysUntilDeadline < 0 ? "text-destructive" : daysUntilDeadline <= 7 ? "text-warning" : "text-muted-foreground"
            }`}>
              <Clock className="w-3 h-3" />
              {daysUntilDeadline < 0
                ? `${Math.abs(daysUntilDeadline)}d overdue`
                : daysUntilDeadline === 0
                ? "Due today"
                : `${daysUntilDeadline}d left`}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ cases, onCaseUpdated }) {
  const [updating, setUpdating] = useState(null);
  const queryClient = useQueryClient();

  // Group cases by status
  const columns = COLUMNS.map((col) => ({
    ...col,
    cases: cases.filter((c) => c.status === col.id),
  }));

  async function onDragEnd(result) {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    setUpdating(draggableId);
    try {
      await base44.entities.Case.update(draggableId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      if (onCaseUpdated) onCaseUpdated();
    } catch (e) {
      console.error("Failed to update case status", e);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {columns.map((col) => (
          <div key={col.id} className={`shrink-0 w-64 rounded-xl border ${col.color} flex flex-col`}>
            {/* Column header */}
            <div className={`${col.header} rounded-t-xl px-3 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-foreground">{col.label}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-background/60 rounded-full px-2 py-0.5">
                {col.cases.length}
              </span>
            </div>

            {/* Cards */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-2 rounded-b-xl transition-colors min-h-[120px] ${
                    snapshot.isDraggingOver ? "bg-primary/5" : ""
                  }`}
                >
                  {col.cases.map((c, i) => (
                    <CaseKanbanCard key={c.id} caseItem={c} index={i} />
                  ))}
                  {provided.placeholder}
                  {col.cases.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-border/50 rounded-lg">
                      <p className="text-xs text-muted-foreground/50">Drop here</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}