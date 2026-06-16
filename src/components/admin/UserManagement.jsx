import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, ShieldCheck, Clock, CreditCard } from "lucide-react";
import { ADMIN_EMAIL } from "@/lib/subscription";

const PLAN_COLORS = { Starter: "#27AE60", Pro: "#FFD700", Command: "#CC0000" };

export default function UserManagement() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin-all-payments-mgmt"],
    queryFn: () => base44.entities.PaymentRequest.list("-created_date", 500),
  });

  // Build a map: userId -> their latest active payment
  const subMap = {};
  payments.forEach(p => {
    if (p.status === "verified" && p.subscription_active) {
      const existing = subMap[p.user_id];
      if (!existing || new Date(p.verified_date) > new Date(existing.verified_date)) {
        subMap[p.user_id] = p;
      }
    }
  });

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loadingUsers ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading users...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Subscription</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Expires</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const isAdmin = u.email === ADMIN_EMAIL || u.role === "admin";
                  const sub = isAdmin
                    ? { plan_name: "Command", subscription_expiry: "Unlimited" }
                    : subMap[u.id] || null;

                  return (
                    <tr key={u.id} className={`border-t border-border/50 hover:bg-secondary/20 transition-colors ${idx % 2 === 0 ? "" : "bg-secondary/5"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{u.full_name?.[0]?.toUpperCase() || "?"}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />{u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#FFD700]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Admin
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground capitalize">{u.role || "user"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${PLAN_COLORS[sub.plan_name]}20`,
                              color: PLAN_COLORS[sub.plan_name]
                            }}
                          >
                            {isAdmin ? "⭐ Command (Free)" : sub.plan_name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No plan</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {sub?.subscription_expiry === "Unlimited"
                          ? <span className="text-[#FFD700] font-bold">Unlimited</span>
                          : sub?.subscription_expiry
                            ? new Date(sub.subscription_expiry).toLocaleDateString("en-AU")
                            : "—"
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.created_date
                          ? new Date(u.created_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {search ? "No users match your search." : "No users yet."}
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-border bg-secondary/20 flex justify-between text-xs text-muted-foreground">
            <span>{filtered.length} of {users.length} users shown</span>
            <span>{Object.keys(subMap).length} active subscribers</span>
          </div>
        </div>
      )}
    </div>
  );
}