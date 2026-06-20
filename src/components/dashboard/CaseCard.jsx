import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusConfig = {
  draft: { label: "Draft", className: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  complaint_sent: { label: "Complaint Sent", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  awaiting_response: { label: "Awaiting Response", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  response_received: { label: "Response Received", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  escalation_ready: { label: "Ready to Escalate", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  escalated: { label: "Escalated", className: "bg-red-600/20 text-red-300 border-red-500/40" },
  resolved: { label: "Resolved", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  closed: { label: "Closed", className: "bg-gray-700/15 text-gray-500 border-gray-700/30" },
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
        className="block relative overflow-hidden bg-card rounded-2xl border-2 border-border p-4 sm:p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all group active:scale-[0.98] touch-manipulation"
      >
        {/* Status indicator bar on left edge */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          caseItem.status === 'escalated' || caseItem.status === 'escalation_ready' ? 'bg-gradient-to-b from-red-500 to-red-600' :
          caseItem.status === 'resolved' ? 'bg-gradient-to-b from-green-500 to-green-600' :
          caseItem.status === 'closed' ? 'bg-gradient-to-b from-gray-500 to-gray-600' :
          caseItem.status === 'awaiting_response' ? 'bg-gradient-to-b from-orange-400 to-orange-500' :
          'bg-gradient-to-b from-blue-500 to-blue-600'
        }`} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-bl-full" />
        <div className="relative flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              <Badge className={`${status.className} border-2 font-black text-xs sm:text-sm px-3 py-1.5 sm:py-1 shadow-lg min-h-[32px]`}>
                {status.label}
              </Badge>
              <span className={`text-xs sm:text-sm font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${
                caseItem.status === 'resolved' || caseItem.status === 'closed' 
                  ? 'bg-gray-700/20 text-gray-500' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {caseItem.status === 'resolved' || caseItem.status === 'closed' ? 'INACTIVE' : categoryLabels[caseItem.category] || caseItem.category}
              </span>
              <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${priorityDot[caseItem.priority] || priorityDot.medium} animate-pulse shrink-0`} />
            </div>
            <h3 className="font-heading font-black text-foreground truncate group-hover:text-primary transition-colors text-lg sm:text-2xl leading-tight">
              {caseItem.title}
            </h3>
            {caseItem.organisation_name && (
              <div className="flex items-center gap-2 mt-2 text-sm sm:text-lg text-foreground font-black">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{caseItem.organisation_name}</span>
              </div>
            )}
            {caseItem.issue_summary && (
              <p className="text-sm sm:text-base text-foreground font-bold mt-2 sm:mt-3 line-clamp-2 leading-relaxed">
                {caseItem.issue_summary}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 text-sm text-foreground font-black">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(caseItem.created_date), "d MMMM yyyy")}</span>
            </div>
          </div>
          <div className="p-3 sm:p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors shrink-0">
            <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}