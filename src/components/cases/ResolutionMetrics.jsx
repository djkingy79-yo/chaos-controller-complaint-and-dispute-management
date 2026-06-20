import React, { useState } from "react";
import { Clock, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = ["banking", "insurance", "tenancy", "telco", "utilities", "other"];
const CATEGORY_COLORS = {
  banking: "bg-blue-500",
  insurance: "bg-purple-500",
  tenancy: "bg-green-500",
  telco: "bg-orange-500",
  utilities: "bg-yellow-500",
  other: "bg-gray-500",
};
const RESOLVED_STATUSES = ["resolved", "closed"];

function daysBetween(dateA, dateB) {
  return Math.round(Math.abs(new Date(dateB) - new Date(dateA)) / 86400000);
}

export default function ResolutionMetrics({ cases }) {
  const [expanded, setExpanded] = useState(false);

  // Only look at resolved/closed cases with a created_date
  const resolvedCases = cases.filter(
    (c) => RESOLVED_STATUSES.includes(c.status) && c.created_date && c.updated_date
  );

  if (cases.length === 0) return null;

  // Per-category stats
  const stats = CATEGORIES.map((cat) => {
    const catCases = cases.filter((c) => c.category === cat);
    const catResolved = catCases.filter((c) => RESOLVED_STATUSES.includes(c.status) && c.created_date && c.updated_date);
    const avgDays =
      catResolved.length > 0
        ? Math.round(catResolved.reduce((sum, c) => sum + daysBetween(c.created_date, c.updated_date), 0) / catResolved.length)
        : null;
    return {
      category: cat,
      total: catCases.length,
      resolved: catResolved.length,
      avgDays,
    };
  }).filter((s) => s.total > 0);

  if (stats.length === 0) return null;

  // Overall average
  const overallAvg =
    resolvedCases.length > 0
      ? Math.round(resolvedCases.reduce((sum, c) => sum + daysBetween(c.created_date, c.updated_date), 0) / resolvedCases.length)
      : null;

  // Max days for bar scaling
  const maxDays = Math.max(...stats.map((s) => s.avgDays ?? 0), 1);

  // Sort by avgDays descending (longest first), nulls last
  const sorted = [...stats].sort((a, b) => {
    if (a.avgDays === null && b.avgDays === null) return 0;
    if (a.avgDays === null) return 1;
    if (b.avgDays === null) return -1;
    return b.avgDays - a.avgDays;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-heading font-semibold text-sm text-foreground">Resolution Time Metrics</p>
            <p className="text-xs text-muted-foreground">
              {resolvedCases.length} resolved case{resolvedCases.length !== 1 ? "s" : ""}
              {overallAvg !== null ? ` · avg ${overallAvg} days overall` : " · no resolved cases yet"}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border">
          {/* Summary pills */}
          <div className="flex flex-wrap gap-3 pt-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-foreground">{resolvedCases.length} resolved</span>
            </div>
            {overallAvg !== null && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Avg {overallAvg} days to resolve</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-foreground">{cases.length - resolvedCases.length} still active</span>
            </div>
          </div>

          {/* Per-category bars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Average Days by Category</p>
            {sorted.map((s) => (
              <div key={s.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[s.category]}`} />
                    <span className="text-sm font-medium text-foreground capitalize">{s.category}</span>
                    <span className="text-xs text-muted-foreground">({s.total} case{s.total !== 1 ? "s" : ""})</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {s.avgDays !== null ? `${s.avgDays}d` : <span className="text-muted-foreground text-xs">no data</span>}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  {s.avgDays !== null ? (
                    <div
                      className={`h-full rounded-full transition-all ${CATEGORY_COLORS[s.category]}`}
                      style={{ width: `${Math.round((s.avgDays / maxDays) * 100)}%` }}
                    />
                  ) : (
                    <div className="h-full w-0" />
                  )}
                </div>
                {s.resolved > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{s.resolved} resolved</p>
                )}
              </div>
            ))}
          </div>

          {resolvedCases.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Bar lengths will appear once cases are marked resolved or closed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}