import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, AlertTriangle, CheckCircle2, Clock, Shield, Flame, Trophy, TrendingUp, Scale } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import CaseCard from "@/components/dashboard/CaseCard";
import ActionItems from "@/components/dashboard/ActionItems";
import CommandCentre from "@/components/dashboard/CommandCentre";
import LetterPreview from "@/components/dashboard/LetterPreview";
import OnboardingDashboard from "@/components/dashboard/OnboardingDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }, "-created_date"),
  });

  const activeCases = cases.filter((c) => !["resolved", "closed"].includes(c.status));
  const resolvedCases = cases.filter((c) => c.status === "resolved");
  const escalatedCases = cases.filter((c) => c.status === "escalated");
  const urgentCases = cases.filter((c) => c.priority === "urgent" || c.priority === "high");
  const awaitingResponse = cases.filter((c) => c.status === "awaiting_response");
  const winRate = cases.length > 0 ? Math.round((resolvedCases.length / cases.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Onboarding for new users */}
      {cases.length === 0 ? (
        <OnboardingDashboard />
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

          {/* Victory Summary */}
          {(resolvedCases.length > 0 || escalatedCases.length > 0) && (
            <div className="bg-gradient-to-r from-green-500/10 via-card to-primary/10 border border-green-500/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/15 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-foreground text-base">Your Dispute Record</h2>
                  <p className="text-xs text-muted-foreground">Successful resolutions and escalations</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-display font-black text-green-500">{resolvedCases.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Cases Won</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-3xl font-display font-black text-primary">{winRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Win Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-display font-black text-warning">{escalatedCases.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Escalated</p>
                </div>
              </div>
              {resolvedCases.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Wins</p>
                  {resolvedCases.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-foreground font-medium truncate">{c.title}</span>
                      {c.organisation_name && (
                        <span className="text-muted-foreground text-xs shrink-0">vs {c.organisation_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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