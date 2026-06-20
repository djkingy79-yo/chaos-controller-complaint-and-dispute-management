import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Users, Star } from "lucide-react";

const PLAN_COLORS = { Starter: "#27AE60", Pro: "#FFD700", Command: "#CC0000" };
const PLAN_PRICES = { Starter: 9.99, Pro: 15.99, Command: 19.99 };

function StatBox({ label, value, sub, color }) {
  return (
    <div className={`bg-card border rounded-xl p-5 border-border`}>
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className={`text-3xl font-display font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function SalesStats() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["all-payments-stats"],
    queryFn: () => base44.entities.PaymentRequest.list("-created_date", 500),
    refetchInterval: 60000
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: () => base44.entities.User.list(),
  });

  const verified = payments.filter(p => p.status === "verified");
  const totalRevenue = verified.reduce((sum, p) => sum + (PLAN_PRICES[p.plan_name] || 0), 0);
  const activeSubscribers = verified.filter(p => p.subscription_active).length;

  // Plan breakdown
  const planData = ["Starter", "Pro", "Command"].map(plan => ({
    name: plan,
    count: verified.filter(p => p.plan_name === plan).length,
    revenue: verified.filter(p => p.plan_name === plan).length * PLAN_PRICES[plan]
  }));

  // New users by month (last 6 months)
  const now = new Date();
  const monthlyUsers = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
    const count = users.filter(u => {
      const created = new Date(u.created_date);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    }).length;
    return { month: label, users: count };
  });

  // Monthly revenue (last 6 months)
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
    const rev = verified.filter(p => {
      if (!p.verified_date) return false;
      const vd = new Date(p.verified_date);
      return vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth();
    }).reduce((sum, p) => sum + (PLAN_PRICES[p.plan_name] || 0), 0);
    return { month: label, revenue: rev };
  });

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Loading sales data...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="AUD all time" color="text-[#FFD700]" />
        <StatBox label="Active Subscribers" value={activeSubscribers} sub={`${verified.length} total verified`} color="text-green-500" />
        <StatBox label="Total Users" value={users.length} sub="registered accounts" color="text-primary" />
        <StatBox label="Conversion Rate" value={users.length > 0 ? `${Math.round((verified.length / users.length) * 100)}%` : "0%"} sub="users with paid plan" color="text-accent" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#FFD700]" /> Monthly Revenue (AUD)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRevenue}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${v}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} dot={{ fill: "#FFD700", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* New Users per Month */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> New Users per Month
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyUsers}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-accent" /> Subscribers by Plan
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" outerRadius={70} dataKey="count" label={({ name, count }) => count > 0 ? `${name}: ${count}` : ""} labelLine={false}>
                {planData.map((entry, i) => <Cell key={i} fill={PLAN_COLORS[entry.name]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, "Subscribers"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Revenue Table */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Revenue by Plan
          </h3>
          <div className="space-y-3">
            {planData.map(plan => (
              <div key={plan.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PLAN_COLORS[plan.name] }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-foreground">{plan.name}</span>
                    <span className="text-muted-foreground">{plan.count} subscribers · <span className="text-foreground font-bold">${plan.revenue}</span></span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${verified.length > 0 ? (plan.count / verified.length) * 100 : 0}%`,
                        background: PLAN_COLORS[plan.name]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {verified.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No verified payments yet.</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
            <span className="text-xl font-display font-black text-[#FFD700]">${totalRevenue.toLocaleString()} AUD</span>
          </div>
        </div>
      </div>
    </div>
  );
}