import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Users, FolderOpen, CheckCircle2, AlertTriangle, TrendingUp,
  Activity, Wallet, ShieldCheck, Clock, Scale
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/dashboard/StatsCard";
import PaymentVerification from "@/components/admin/PaymentVerification";
import SalesStats from "@/components/admin/SalesStats";
import UserManagement from "@/components/admin/UserManagement";
import { ADMIN_EMAIL } from "@/lib/subscription";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const STATUS_LABELS = {
  draft: "Draft",
  complaint_sent: "Sent",
  awaiting_response: "Awaiting",
  response_received: "Responded",
  escalation_ready: "Escalation Ready",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_COLORS = {
  urgent: "bg-red-500/15 text-red-500",
  high: "bg-orange-500/15 text-orange-500",
  medium: "bg-yellow-500/15 text-yellow-600",
  low: "bg-green-500/15 text-green-600",
};

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

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["admin-pending-payments"],
    queryFn: () => base44.entities.PaymentRequest.filter({ status: "pending" }),
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ["admin-all-payments"],
    queryFn: () => base44.entities.PaymentRequest.list("-created_date", 500),
  });

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const active = cases.filter(c => !["resolved", "closed"].includes(c.status));
  const resolved = cases.filter(c => c.status === "resolved");
  const overdueDeadlines = deadlines.filter(d => d.status === "pending" && new Date(d.deadline_date) < new Date());
  const verifiedPayments = allPayments.filter(p => p.status === "verified");
  const totalRevenue = verifiedPayments.reduce((sum, p) => sum + ({ Starter: 25, Pro: 35, Command: 49 }[p.plan_name] || 0), 0);

  const categoryData = ["banking", "insurance", "tenancy", "telco", "utilities", "other"]
    .map(cat => ({ name: cat.charAt(0).toUpperCase() + cat.slice(1), value: cases.filter(c => c.category === cat).length }))
    .filter(d => d.value > 0);

  const statusData = [
    { name: "Draft", count: cases.filter(c => c.status === "draft").length },
    { name: "Sent", count: cases.filter(c => c.status === "complaint_sent").length },
    { name: "Awaiting", count: cases.filter(c => c.status === "awaiting_response").length },
    { name: "Escalated", count: cases.filter(c => c.status === "escalated").length },
    { name: "Resolved", count: cases.filter(c => c.status === "resolved").length },
  ];

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Activity className="w-7 h-7 text-primary" /> Admin Command Centre
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide overview — all users, all cases, all revenue.</p>
        {user?.email === ADMIN_EMAIL && (
          <div className="mt-2 inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FFD700]">
            <ShieldCheck className="w-3.5 h-3.5" /> Signed in as owner — Command plan access granted (free)
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Users" value={users.length} icon={Users} color="bg-primary/10 text-primary" />
        <StatsCard title="Active Cases" value={active.length} icon={FolderOpen} color="bg-accent/10 text-accent" subtitle={`${cases.length} total`} />
        <StatsCard title="Resolved" value={resolved.length} icon={CheckCircle2} color="bg-success/10 text-success" subtitle={`${cases.length > 0 ? Math.round((resolved.length / cases.length) * 100) : 0}% win rate`} />
        <StatsCard title="Overdue" value={overdueDeadlines.length} icon={AlertTriangle} color="bg-destructive/10 text-destructive" subtitle="deadlines past due" />
        <StatsCard title="Revenue" value={`$${totalRevenue}`} icon={Wallet} color="bg-[#FFD700]/10 text-[#FFD700]" subtitle={`${pendingPayments.length > 0 ? `${pendingPayments.length} pending` : `${verifiedPayments.length} verified`}`} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales & Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments" className="relative">
            Payments
            {pendingPayments.length > 0 && (
              <span className="ml-2 bg-[#FFD700] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingPayments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Cases by Status
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" /> Cases by Category
              </h2>
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Overdue Deadlines Alert */}
          {overdueDeadlines.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-5">
              <h2 className="font-heading font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {overdueDeadlines.length} Overdue Deadline{overdueDeadlines.length > 1 ? "s" : ""} Platform-Wide
              </h2>
              <div className="space-y-2">
                {overdueDeadlines.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm bg-card rounded-lg px-3 py-2 border border-border">
                    <span className="font-medium text-foreground">{d.title}</span>
                    <span className="text-destructive text-xs font-bold">{new Date(d.deadline_date).toLocaleDateString("en-AU")}</span>
                  </div>
                ))}
                {overdueDeadlines.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{overdueDeadlines.length - 5} more overdue</p>
                )}
              </div>
            </div>
          )}

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
                    <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-4">Priority</th>
                    <th className="text-left text-xs font-medium text-muted-foreground py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 10).map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-2.5 pr-4 font-medium text-foreground truncate max-w-[180px]">{c.title}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground capitalize">{c.category}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-xs capitalize">{STATUS_LABELS[c.status] || c.status}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[c.priority] || ""}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {c.created_date ? new Date(c.created_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cases.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No cases yet.</p>}
            </div>
            {cases.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-3 border-t border-border mt-3">
                Showing 10 of {cases.length} cases
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesStats />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
}