import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingUp, Award, Clock, Target, AlertTriangle, CheckCircle, FileUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_COLORS = {
  banking: "#2563eb",
  insurance: "#7c3aed",
  tenancy: "#059669",
  telco: "#d97706",
  utilities: "#dc2626",
  other: "#6b7280",
};

const STATUS_COLORS = {
  resolved: "#10b981",
  closed: "#6b7280",
  escalated: "#ef4444",
  awaiting_response: "#f59e0b",
  draft: "#9ca3af",
};

export default function Analytics() {
  const { user } = useAuth();

  const { data: cases = [] } = useQuery({
    queryKey: ["analytics-cases", user?.id],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const caseIds = cases.map(c => c.id);

  const { data: deadlines = [] } = useQuery({
    queryKey: ["analytics-deadlines", caseIds],
    queryFn: () => caseIds.length > 0
      ? base44.entities.Deadline.filter({ case_id: { $in: caseIds } })
      : Promise.resolve([]),
    enabled: caseIds.length > 0,
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ["analytics-evidence", caseIds],
    queryFn: () => caseIds.length > 0
      ? base44.entities.Evidence.filter({ case_id: { $in: caseIds } })
      : Promise.resolve([]),
    enabled: caseIds.length > 0,
  });

  // Calculate metrics
  const totalCases = cases.length;
  const resolvedCases = cases.filter((c) => c.status === "resolved" || c.status === "closed").length;
  const escalatedCases = cases.filter((c) => c.status === "escalated").length;
  const activeCases = cases.filter((c) => !["resolved", "closed"].includes(c.status)).length;
  const winRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

  // Category breakdown
  const categoryData = Object.entries(
    cases.reduce((acc, c) => {
      acc[c.category || "other"] = (acc[c.category || "other"] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Status breakdown
  const statusData = Object.entries(
    cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, " ").toUpperCase(), value }));

  // Deadline metrics
  const totalDeadlines = deadlines.length;
  const completedDeadlines = deadlines.filter((d) => d.status === "completed").length;
  const missedDeadlines = deadlines.filter((d) => d.status === "missed").length;
  const pendingDeadlines = deadlines.filter((d) => d.status === "pending").length;
  const deadlineCompliance = totalDeadlines > 0 ? Math.round((completedDeadlines / totalDeadlines) * 100) : 0;

  // Evidence metrics
  const totalEvidence = evidence.length;
  const avgEvidencePerCase = totalCases > 0 ? (totalEvidence / totalCases).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-xs text-muted-foreground">Track your dispute resolution performance</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Award className="w-4 h-4" /> Win Rate
          </div>
          <div className="text-3xl font-bold text-foreground">{winRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">{resolvedCases} resolved of {totalCases} total</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Target className="w-4 h-4" /> Active Cases
          </div>
          <div className="text-3xl font-bold text-foreground">{activeCases}</div>
          <div className="text-xs text-muted-foreground mt-1">{escalatedCases} escalated</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <CheckCircle className="w-4 h-4" /> Deadline Compliance
          </div>
          <div className="text-3xl font-bold text-foreground">{deadlineCompliance}%</div>
          <div className="text-xs text-muted-foreground mt-1">{completedDeadlines} of {totalDeadlines} met</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Clock className="w-4 h-4" /> Evidence per Case
          </div>
          <div className="text-3xl font-bold text-foreground">{avgEvidencePerCase}</div>
          <div className="text-xs text-muted-foreground mt-1">{totalEvidence} total files</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cases by Category */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-semibold text-base text-foreground mb-4">Cases by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name.toLowerCase()] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Status */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-semibold text-base text-foreground mb-4">Cases by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase().replace(" ", "_")] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-heading font-semibold text-base text-foreground mb-4">Performance Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-muted/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold">Escalation Rate</span>
            </div>
            <div className="text-2xl font-bold">{totalCases > 0 ? Math.round((escalatedCases / totalCases) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">{escalatedCases} cases escalated to external bodies</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Pending Deadlines</span>
            </div>
            <div className="text-2xl font-bold">{pendingDeadlines}</div>
            <p className="text-xs text-muted-foreground mt-1">Deadlines requiring attention</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileUp className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold">Evidence Density</span>
            </div>
            <div className="text-2xl font-bold">{avgEvidencePerCase}</div>
            <p className="text-xs text-muted-foreground mt-1">Average documents per case</p>
          </div>
        </div>
      </div>
    </div>
  );
}