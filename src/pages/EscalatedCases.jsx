import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, AlertTriangle, Clock, ArrowRight, FileText, TrendingUp, Flame, Building2, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const ESCALATION_STATUS_ORDER = [
  "escalation_ready",
  "escalated",
  "response_received",
  "awaiting_response",
  "complaint_sent",
  "draft",
];

const STATUS_CONFIG = {
  escalation_ready: { label: "Ready to Escalate", color: "bg-red-500/10 text-red-500 border-red-500/30", dot: "bg-red-500" },
  escalated: { label: "Escalated", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", dot: "bg-orange-500" },
  response_received: { label: "Response Received", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", dot: "bg-blue-500" },
  awaiting_response: { label: "Awaiting Response", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", dot: "bg-yellow-500" },
  complaint_sent: { label: "Complaint Sent", color: "bg-purple-500/10 text-purple-500 border-purple-500/30", dot: "bg-purple-500" },
  draft: { label: "Draft", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

const ESCALATION_BODIES = {
  banking: "AFCA (Australian Financial Complaints Authority)",
  insurance: "AFCA (Australian Financial Complaints Authority)",
  telco: "TIO (Telecommunications Industry Ombudsman)",
  utilities: "Energy & Water Ombudsman",
  tenancy: "NCAT / Your State Tribunal",
  other: "Relevant Industry Ombudsman",
};

function getNextAction(c) {
  switch (c.status) {
    case "draft":
      return { action: "Complete case details and upload evidence", icon: FileText, urgency: "low" };
    case "complaint_sent":
      return { action: "Awaiting merchant response — follow up if overdue", icon: Clock, urgency: "medium" };
    case "awaiting_response":
      return { action: "Monitor response deadline — prepare escalation bundle", icon: AlertTriangle, urgency: "medium" };
    case "response_received":
      return { action: "Review response and decide: accept offer, reject, or escalate", icon: TrendingUp, urgency: "high" };
    case "escalation_ready": {
      const body = ESCALATION_BODIES[c.category] || "Relevant Ombudsman";
      return { action: `Submit escalation bundle to ${body}`, icon: Scale, urgency: "critical" };
    }
    case "escalated":
      return { action: "Await ombudsman decision — keep evidence vault updated", icon: Building2, urgency: "medium" };
    default:
      return { action: "Review case status", icon: FileText, urgency: "low" };
  }
}

const URGENCY_COLORS = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-orange-500",
  critical: "text-destructive",
};

const PRIORITY_CONFIG = {
  urgent: { label: "URGENT", color: "bg-destructive/10 text-destructive border-destructive/30" },
  high: { label: "HIGH", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  medium: { label: "MED", color: "bg-warning/10 text-warning border-warning/30" },
  low: { label: "LOW", color: "bg-muted text-muted-foreground border-border" },
};

export default function EscalatedCases() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const { data: allCases = [], isLoading } = useQuery({
    queryKey: ["escalated-cases"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }, "-updated_date"),
  });

  // Only unresolved/unclosed cases
  const unresolvedCases = allCases.filter(c => !["resolved", "closed"].includes(c.status));

  const filtered = filter === "all" ? unresolvedCases
    : unresolvedCases.filter(c => c.status === filter);

  // Sort by escalation urgency
  const sorted = [...filtered].sort((a, b) => {
    const ai = ESCALATION_STATUS_ORDER.indexOf(a.status);
    const bi = ESCALATION_STATUS_ORDER.indexOf(b.status);
    return ai - bi;
  });

  const escalationReady = unresolvedCases.filter(c => c.status === "escalation_ready").length;
  const escalated = unresolvedCases.filter(c => c.status === "escalated").length;
  const awaitingResponse = unresolvedCases.filter(c => c.status === "awaiting_response").length;
  const responseReceived = unresolvedCases.filter(c => c.status === "response_received").length;

  const FILTER_TABS = [
    { key: "all", label: `All (${unresolvedCases.length})` },
    { key: "escalation_ready", label: `Ready to Escalate (${escalationReady})` },
    { key: "escalated", label: `Escalated (${escalated})` },
    { key: "response_received", label: `Response Received (${responseReceived})` },
    { key: "awaiting_response", label: `Awaiting Response (${awaitingResponse})` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Scale className="w-7 h-7 text-destructive" />
            Escalation Command
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            All unresolved disputes — grouped by urgency with next legal action
          </p>
        </div>
        <Link to="/new-case">
          <Button className="gap-2 font-medium">
            <Flame className="w-4 h-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-black text-destructive">{escalationReady}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Ready to Escalate</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-black text-orange-500">{escalated}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Escalated</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-black text-blue-500">{responseReceived}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Responses In</p>
        </div>
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-display font-black text-warning">{awaitingResponse}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Awaiting Response</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases List */}
      {sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-foreground mb-2">No unresolved disputes</h3>
          <p className="text-sm text-muted-foreground">
            All your cases are resolved or closed. Start a new case to track a dispute.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
            const nextAction = getNextAction(c);
            const NextActionIcon = nextAction.icon;
            const priorityCfg = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.medium;
            const escalationBody = ESCALATION_BODIES[c.category];

            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    <div className={`w-3 h-3 rounded-full ${statusCfg.dot}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground truncate">{c.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {c.priority && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      )}
                    </div>

                    {/* Org + Category */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {c.organisation_name || "No organisation"} 
                      {c.category && <span className="ml-2 capitalize text-xs bg-muted px-1.5 py-0.5 rounded">{c.category}</span>}
                      {c.incident_date && <span className="ml-2 text-xs">· Since {format(new Date(c.incident_date), "d MMM yyyy")}</span>}
                    </p>

                    {/* Next Required Action */}
                    <div className={`flex items-start gap-2 bg-muted/40 rounded-lg px-3 py-2.5 mb-3`}>
                      <NextActionIcon className={`w-4 h-4 mt-0.5 shrink-0 ${URGENCY_COLORS[nextAction.urgency]}`} />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Next Required Action</p>
                        <p className={`text-sm font-semibold ${URGENCY_COLORS[nextAction.urgency]}`}>{nextAction.action}</p>
                      </div>
                    </div>

                    {/* Escalation Body Hint */}
                    {(c.status === "escalation_ready" || c.status === "escalated") && escalationBody && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Escalation body: <strong className="text-foreground">{escalationBody}</strong></span>
                      </div>
                    )}

                    {/* Response deadline */}
                    {c.response_deadline && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Response deadline: <strong className="text-foreground">{format(new Date(c.response_deadline), "d MMM yyyy")}</strong>
                          {(() => {
                            const days = Math.round((new Date(c.response_deadline) - new Date()) / 86400000);
                            if (days < 0) return <span className="text-destructive ml-1 font-semibold"> ({Math.abs(days)} days overdue)</span>;
                            if (days === 0) return <span className="text-destructive ml-1 font-semibold"> (TODAY)</span>;
                            if (days <= 7) return <span className="text-warning ml-1 font-semibold"> ({days} days left)</span>;
                            return <span className="text-muted-foreground ml-1"> ({days} days)</span>;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <Link to={`/case/${c.id}`} className="shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}