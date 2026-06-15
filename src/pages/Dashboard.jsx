import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, AlertTriangle, CheckCircle2, Clock, Shield, Flame } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import CaseCard from "@/components/dashboard/CaseCard";
import ActionItems from "@/components/dashboard/ActionItems";
import CommandCentre from "@/components/dashboard/CommandCentre";
import LetterPreview from "@/components/dashboard/LetterPreview";
import WelcomeGuide from "@/components/dashboard/WelcomeGuide";

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
      {/* Welcome Guide for new users */}
      {cases.length === 0 ? (
        <WelcomeGuide cases={cases} />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Control starts here. Here's your dispute command centre.
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

          {/* Command Centre */}
          <CommandCentre cases={cases} />

          {/* Letter Preview */}
          {cases.some((c) => c.complaint_letter) && (
            <LetterPreview cases={cases} />
          )}

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
              <div className="space-y-3">
                {cases.slice(0, 5).map((c, i) => (
                  <CaseCard key={c.id} caseItem={c} index={i} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}