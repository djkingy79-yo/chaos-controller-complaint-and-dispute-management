import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Clock, FolderOpen, Loader2, Printer, Download, BarChart2, CalendarDays, CheckSquare, AlertTriangle, Sparkles } from "lucide-react";
import CaseStatusControl from "@/components/cases/CaseStatusControl";
import EvidenceVault from "@/components/cases/EvidenceVault";
import CaseTimeline from "@/components/cases/CaseTimeline";
import VisualTimeline from "@/components/cases/VisualTimeline";
import LetterSuite from "@/components/cases/LetterSuite";
import ChaosScore from "@/components/cases/ChaosScore";
import PrintBundle from "@/components/cases/PrintBundle";
import EscalationBundle from "@/components/cases/EscalationBundle";
import CaseSummary from "@/components/cases/CaseSummary";
import DisputeProgressTracker from "@/components/cases/DisputeProgressTracker";
import ExportCaseZip from "@/components/cases/ExportCaseZip";
import MerchantInvite from "@/components/cases/MerchantInvite";
import WeeklySnapshot from "@/components/cases/WeeklySnapshot";
import ExecutiveSummaryGenerator from "@/components/cases/ExecutiveSummaryGenerator";
import SmartChecklist from "@/components/cases/SmartChecklist";
import GeneratedChecklist from "@/components/cases/GeneratedChecklist";

export default function CaseDetail() {
  const navigate = useNavigate();
  const { id: caseId } = useParams();
  const { user } = useAuth();

  // Preserve tab state in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get("tab") || "summary");

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "summary";
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/case/${caseId}?tab=${tab}`, { replace: true });
  };

  const { data: caseItem, isLoading: caseLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const cases = await base44.entities.Case.filter({ id: caseId });
      return cases[0];
    },
    enabled: !!caseId,
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", caseId],
    queryFn: () => base44.entities.Evidence.filter({ case_id: caseId }, "event_date"),
    enabled: !!caseId,
  });

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ["timeline", caseId],
    queryFn: () => base44.entities.TimelineEvent.filter({ case_id: caseId }, "event_date"),
    enabled: !!caseId,
  });

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Case not found.</p>
        <Link to="/cases">
          <Button variant="outline" className="mt-4">Back to Cases</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/cases">
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold text-foreground truncate">
            {caseItem.title}
          </h1>
          {caseItem.issue_summary && (
            <p className="text-sm text-muted-foreground mt-1">{caseItem.issue_summary}</p>
          )}
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <FolderOpen className="w-4 h-4" /> Evidence
          </div>
          <div className="text-2xl font-bold text-foreground">{evidence.length}</div>
          <div className="text-xs text-muted-foreground">files uploaded</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Clock className="w-4 h-4" /> Timeline
          </div>
          <div className="text-2xl font-bold text-foreground">{timelineEvents.length}</div>
          <div className="text-xs text-muted-foreground">events recorded</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <CheckSquare className="w-4 h-4" /> Status
          </div>
          <div className="text-sm font-semibold text-foreground">{caseItem.status?.replace(/_/g, ' ').toUpperCase()}</div>
          <div className="text-xs text-muted-foreground">current state</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> Priority
          </div>
          <div className="text-sm font-semibold text-foreground">{caseItem.priority?.toUpperCase()}</div>
          <div className="text-xs text-muted-foreground">case priority</div>
        </div>
      </div>

      {/* Action Buttons - Moved below case details */}
      <div className="flex flex-wrap gap-3 justify-end border-t border-border pt-4 mb-4">
        <ExecutiveSummaryGenerator caseItem={caseItem} />
        <ExportCaseZip caseItem={caseItem} evidence={evidence} events={timelineEvents} />
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Case Controls */}
        <div className="lg:col-span-1 space-y-4">
          <CaseStatusControl caseItem={caseItem} />
          <DisputeProgressTracker caseItem={caseItem} />
          <ChaosScore caseItem={caseItem} evidence={evidence} events={timelineEvents} />
          <MerchantInvite caseItem={caseItem} />
        </div>

        {/* Right - Tabbed Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="flex w-full overflow-x-auto gap-1 h-auto flex-nowrap bg-transparent p-0">
              <TabsTrigger value="summary" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-3.5 h-3.5" /> <span>Summary</span>
              </TabsTrigger>
              <TabsTrigger value="letter" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-3.5 h-3.5" /> <span>Letters</span>
              </TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FolderOpen className="w-3.5 h-3.5" /> <span>Evidence</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-3.5 h-3.5" /> <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CheckSquare className="w-3.5 h-3.5" /> <span>Checklist</span>
              </TabsTrigger>
              <TabsTrigger value="deadlines" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CalendarDays className="w-3.5 h-3.5" /> <span>Deadlines</span>
              </TabsTrigger>
              <TabsTrigger value="print" className="gap-1.5 px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Printer className="w-3.5 h-3.5" /> <span>Print</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <CaseSummary caseItem={caseItem} evidence={evidence} events={timelineEvents} />
            </TabsContent>
            <TabsContent value="letter" className="mt-4">
              <LetterSuite caseItem={caseItem} />
            </TabsContent>
            <TabsContent value="evidence" className="mt-4">
              <EvidenceVault caseId={caseId} evidence={evidence} caseItem={caseItem} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <CaseTimeline caseId={caseId} events={timelineEvents} />
            </TabsContent>
            <TabsContent value="checklist" className="mt-4 space-y-4">
              <SmartChecklist caseItem={caseItem} />
              <GeneratedChecklist caseId={caseId} caseItem={caseItem} />
            </TabsContent>
            <TabsContent value="deadlines" className="mt-4">
              <PrintBundle caseItem={caseItem} evidence={evidence} events={timelineEvents} />
            </TabsContent>
            <TabsContent value="print" className="mt-4">
              <PrintBundle caseItem={caseItem} evidence={evidence} events={timelineEvents} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}