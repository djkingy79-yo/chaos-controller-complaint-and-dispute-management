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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/case/${caseItem.id}`}
        className="block bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${status.className} border-0 text-xs font-bold`}>
                {status.label}
              </Badge>
              <span className="text-xs text-foreground font-bold">
                {categoryLabels[caseItem.category] || caseItem.category}
              </span>
              <span className={`w-2 h-2 rounded-full ${priorityDot[caseItem.priority] || priorityDot.medium}`} />
            </div>
            <h3 className="font-heading font-black text-foreground truncate group-hover:text-primary transition-colors text-lg">
              {caseItem.title}
            </h3>
            {caseItem.organisation_name && (
              <div className="flex items-center gap-1.5 mt-1.5 text-base text-foreground font-black">
                <Building2 className="w-4 h-4" />
                <span>{caseItem.organisation_name}</span>
              </div>
            )}
            {caseItem.issue_summary && (
              <p className="text-base text-foreground font-bold mt-2 line-clamp-2">
                {caseItem.issue_summary}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2.5 text-sm text-foreground font-black">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(caseItem.created_date), "d MMM yyyy")}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
        </div>
      </Link>
    </motion.div>
  );
}