import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, FolderOpen, CheckCircle2, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: cases = [] } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: () => base44.entities.Case.list("-created_date", 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ["admin-deadlines"],
    queryFn: () => base44.entities.Deadline.list("-deadline_date", 200),
  });

  const active = cases.filter((c) => !["resolved", "closed"].includes(c.status));
  const resolved = cases.filter((c) => c.status === "resolved");
  const urgent = cases.filter((c) => c.priority === "urgent" || c.priority === "high");
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const overdueDeadlines = deadlines.filter((d) => d.status === "pending" && new Date(d.deadline_date) < new Date());

  // Category breakdown for pie chart
  const categoryData = ["banking", "insurance", "tenancy", "telco", "utilities", "other"].map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cases.filter((c) => c.category === cat).length,
  })).filter((d) => d.value > 0);

  // Status breakdown for bar chart
  const statusData = [
    { name: "Draft", count: cases.filter(c => c.status === "draft").length },
    { name: "Sent", count: cases.filter(c => c.status === "complaint_sent").length },
    { name: "Awaiting", count: cases.filter(c => c.status === "awaiting_response").length },
    { name: "Escalated", count: cases.filter(c => c.status === "escalated").length },
    { name: "Resolved", count: cases.filter(c => c.status === "resolved").length },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Activity className="w-7 h-7 text-primary" /> Admin Command Centre
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide overview of all activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={users.length} icon={Users} color="bg-primary/10 text-primary" />
        <StatsCard title="Active Cases" value={active.length} icon={FolderOpen} color="bg-accent/10 text-accent" subtitle={`${cases.length} total`} />
        <StatsCard title="Resolved" value={resolved.length} icon={CheckCircle2} color="bg-success/10 text-success" />
        <StatsCard title="Overdue Deadlines" value={overdueDeadlines.length} icon={AlertTriangle} color="bg-destructive/10 text-destructive" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Case Status Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Cases by Status
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" /> Cases by Category
          </h2>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-heading font-semibold text-foreground mb-4">Recent Cases (All Users)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-4">Case</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-4">Category</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {cases.slice(0, 10).map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-2.5 pr-4 font-medium text-foreground truncate max-w-[200px]">{c.title}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground capitalize">{c.category}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground capitalize">{c.status?.replace(/_/g, " ")}</td>
                  <td className="py-2.5 capitalize text-muted-foreground">{c.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No cases yet.</p>}
        </div>
      </div>
    </div>
  );
}