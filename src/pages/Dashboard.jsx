import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import CaseCard from "@/components/dashboard/CaseCard";
import ActionItems from "@/components/dashboard/ActionItems";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }, "-created_date"),
  });

  const activeCases = cases.filter((c) => !["resolved", "closed"].includes(c.status));
  const resolvedCases = cases.filter((c) => c.status === "resolved");
  const urgentCases = cases.filter((c) => c.priority === "urgent" || c.priority === "high");
  const awaitingResponse = cases.filter((c) => c.status === "awaiting_response");

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control starts here. Here's your dispute overview.
          </p>
        </div>
        <Link to="/new-case">
          <Button className="gap-2 font-medium">
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Cases"
          value={activeCases.length}
          icon={FolderOpen}
          color="bg-primary/10 text-primary"
          subtitle={`${cases.length} total`}
        />
        <StatsCard
          title="Awaiting Response"
          value={awaitingResponse.length}
          icon={Clock}
          color="bg-warning/10 text-warning"
        />
        <StatsCard
          title="Needs Attention"
          value={urgentCases.length}
          icon={AlertTriangle}
          color="bg-destructive/10 text-destructive"
        />
        <StatsCard
          title="Resolved"
          value={resolvedCases.length}
          icon={CheckCircle2}
          color="bg-success/10 text-success"
        />
      </div>

      {/* Action Items & Recent Cases */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">Action Required</h2>
          <ActionItems cases={cases} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-foreground">Recent Cases</h2>
            {cases.length > 3 && (
              <Link to="/cases" className="text-sm text-primary hover:underline font-medium">
                View all
              </Link>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">Start Your First Case</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Transform confusion into control. Create a case and we'll guide you through every step.
              </p>
              <Link to="/new-case">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Case
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.slice(0, 5).map((c, i) => (
                <CaseCard key={c.id} caseItem={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}