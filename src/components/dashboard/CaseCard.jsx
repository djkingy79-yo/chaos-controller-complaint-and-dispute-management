import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusConfig = {
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
  complaint_sent: { label: "Complaint Sent", className: "bg-primary/15 text-primary" },
  awaiting_response: { label: "Awaiting Response", className: "bg-warning/15 text-warning" },
  response_received: { label: "Response Received", className: "bg-accent/15 text-accent" },
  escalation_ready: { label: "Ready to Escalate", className: "bg-destructive/15 text-destructive" },
  escalated: { label: "Escalated", className: "bg-destructive/15 text-destructive" },
  resolved: { label: "Resolved", className: "bg-success/15 text-success" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

const categoryLabels = {
  banking: "Banking",
  insurance: "Insurance",
  tenancy: "Tenancy",
  telco: "Telco",
  utilities: "Utilities",
  other: "Other",
};

const priorityDot = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-destructive",
  urgent: "bg-destructive animate-pulse-glow",
};

export default function CaseCard({ caseItem, index }) {
  const status = statusConfig[caseItem.status] || statusConfig.draft;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/case/${caseItem.id}`}
        className="block relative overflow-hidden bg-card rounded-2xl border-2 border-border p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all group hover:-translate-y-1"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-bl-full" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Badge className={`${status.className} border-2 font-black text-sm px-3 py-1`}>
                {status.label}
              </Badge>
              <span className="text-sm font-black text-foreground uppercase tracking-wide">
                {categoryLabels[caseItem.category] || caseItem.category}
              </span>
              <span className={`w-3 h-3 rounded-full ${priorityDot[caseItem.priority] || priorityDot.medium} animate-pulse`} />
            </div>
            <h3 className="font-heading font-black text-foreground truncate group-hover:text-primary transition-colors text-2xl leading-tight">
              {caseItem.title}
            </h3>
            {caseItem.organisation_name && (
              <div className="flex items-center gap-2 mt-2 text-lg text-foreground font-black">
                <Building2 className="w-5 h-5" />
                <span>{caseItem.organisation_name}</span>
              </div>
            )}
            {caseItem.issue_summary && (
              <p className="text-base text-foreground font-bold mt-3 line-clamp-2 leading-relaxed">
                {caseItem.issue_summary}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 text-base text-foreground font-black">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(caseItem.created_date), "d MMMM yyyy")}</span>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}