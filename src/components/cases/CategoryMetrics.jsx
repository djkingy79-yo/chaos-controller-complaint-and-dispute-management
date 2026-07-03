import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock, Trophy, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { differenceInDays } from "date-fns";

const CATEGORY_COLORS = {
  banking: "#3b82f6",
  insurance: "#8b5cf6",
  tenancy: "#f59e0b",
  telco: "#10b981",
  utilities: "#f97316",
  government: "#0ea5e9",
  education: "#a855f7",
  legal_profession: "#D4AF37",
  other: "#6b7280",
};

const CATEGORY_LABELS = {
  banking: "Banking",
  insurance: "Insurance",
  tenancy: "Tenancy",
  telco: "Telco",
  utilities: "Utilities",
  government: "Government",
  education: "Education",
  legal_profession: "Legal Profession",
  other: "Other",
};

function calcAvgDays(casesInCategory) {
  const resolved = casesInCategory.filter(
    (c) => ["resolved", "closed"].includes(c.status) && c.incident_date && c.updated_date
  );
  if (resolved.length === 0) return null;
  const total = resolved.reduce((sum, c) => {
    return sum + differenceInDays(new Date(c.updated_date), new Date(c.incident_date));
  }, 0);
  return Math.round(total / resolved.length);
}

export default function CategoryMetrics({ cases }) {
  const [expanded, setExpanded] = useState(false);

  // Build per-category stats
  const categories = ["banking", "insurance", "tenancy", "telco", "utilities", "government", "education", "legal_profession", "other"];
  const stats = categories
    .map((cat) => {
      const inCat = cases.filter((c) => c.category === cat);
      if (inCat.length === 0) return null;
      const resolved = inCat.filter((c) => ["resolved", "closed"].includes(c.status));
      const won = inCat.filter((c) => c.outcome === "won").length;
      const settled = inCat.filter((c) => c.outcome === "settled").length;
      const avgDays = calcAvgDays(inCat);
      return {
        cat,
        label: CATEGORY_LABELS[cat],
        total: inCat.length,
        resolved: resolved.length,
        won,
        settled,
        avgDays,
        winRate: resolved.length > 0 ? Math.round(((won + settled) / resolved.length) * 100) : null,
      };
    })
    .filter(Boolean);

  if (stats.length === 0) return null;

  const chartData = stats
    .filter((s) => s.avgDays !== null)
    .sort((a, b) => b.avgDays - a.avgDays);

  const slowest = chartData[0];
  const fastest = chartData[chartData.length - 1];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-heading font-semibold text-sm text-foreground">Resolution Analytics</p>
            <p className="text-xs text-muted-foreground">Average time to resolve by dispute category</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {slowest && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" /> Slowest: {slowest.label} ({slowest.avgDays}d)
            </span>
          )}
          {fastest && fastest.cat !== slowest?.cat && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1 rounded-full">
              <Trophy className="w-3 h-3" /> Fastest: {fastest.label} ({fastest.avgDays}d)
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-5">
          {/* Bar chart */}
          {chartData.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Avg. Days to Resolve (resolved/closed cases)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}d`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip formatter={(v) => [`${v} days`, "Avg. Resolution Time"]} />
                  <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.cat} fill={CATEGORY_COLORS[entry.cat]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Resolved</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Won / Settled</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Win Rate</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Avg. Days</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.cat} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 font-medium"
                        style={{ color: CATEGORY_COLORS[s.cat] }}
                      >
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: CATEGORY_COLORS[s.cat] }} />
                        {s.label}
                      </span>
                    </td>
                    <td className="text-center py-2.5 text-foreground font-medium">{s.total}</td>
                    <td className="text-center py-2.5 text-muted-foreground">{s.resolved}</td>
                    <td className="text-center py-2.5">
                      {s.won + s.settled > 0 ? (
                        <span className="text-success font-medium">{s.won + s.settled}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-center py-2.5">
                      {s.winRate !== null ? (
                        <span className={`font-medium ${s.winRate >= 50 ? "text-success" : "text-warning"}`}>
                          {s.winRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-center py-2.5">
                      {s.avgDays !== null ? (
                        <span className={`font-medium ${s.avgDays > 60 ? "text-destructive" : s.avgDays > 30 ? "text-warning" : "text-success"}`}>
                          {s.avgDays}d
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">* Avg. days calculated from incident date to resolution for closed/resolved cases. Win rate includes won + settled outcomes.</p>
        </div>
      )}
    </div>
  );
}