import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Clock, FolderOpen, Loader2, Printer, Download, BarChart2 } from "lucide-react";
import CaseStatusControl from "@/components/cases/CaseStatusControl";
import EvidenceVault from "@/components/cases/EvidenceVault";
import CaseTimeline from "@/components/cases/CaseTimeline";
import VisualTimeline from "@/components/cases/VisualTimeline";
import ComplaintLetter from "@/components/cases/ComplaintLetter";
import ChaosScore from "@/components/cases/ChaosScore";
import PrintBundle from "@/components/cases/PrintBundle";
import EscalationBundle from "@/components/cases/EscalationBundle";
import CaseSummary from "@/components/cases/CaseSummary";
import DisputeProgressTracker from "@/components/cases/DisputeProgressTracker";
import ExportCaseZip from "@/components/cases/ExportCaseZip";
import OutlookDeadlineSync from "@/components/cases/OutlookDeadlineSync";

export default function CaseDetail() {
  const navigate = useNavigate();
  const caseId = window.location.pathname.split("/case/")[1];
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
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    navigate(`/case/${caseId}?${params.toString()}`, { replace: true });
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
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground truncate">
            {caseItem.title}
          </h1>
          {caseItem.issue_summary && (
            <p className="text-sm text-muted-foreground mt-1">{caseItem.issue_summary}</p>
          )}
        </div>
        <ExportCaseZip caseItem={caseItem} evidence={evidence} events={timelineEvents} />
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <CaseStatusControl caseItem={caseItem} />
          <DisputeProgressTracker caseItem={caseItem} />
          <ChaosScore caseItem={caseItem} evidence={evidence} events={timelineEvents} />
          <OutlookDeadlineSync caseItem={caseItem} />

          {/* Quick stats */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" /> Evidence
              </span>
              <span className="font-medium">{evidence.length} files</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Timeline
              </span>
              <span className="font-medium">{timelineEvents.length} events</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-7 mb-4">
              <TabsTrigger value="summary" className="gap-1 text-xs sm:text-sm">
                <FileText className="w-3.5 h-3.5 hidden sm:block" /> Summary
              </TabsTrigger>
              <TabsTrigger value="letter" className="gap-1 text-xs sm:text-sm">
                <FileText className="w-3.5 h-3.5 hidden sm:block" /> Letter
              </TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1 text-xs sm:text-sm">
                <FolderOpen className="w-3.5 h-3.5 hidden sm:block" /> Evidence
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 hidden sm:block" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="visual" className="gap-1 text-xs sm:text-sm">
                <BarChart2 className="w-3.5 h-3.5 hidden sm:block" /> Visual
              </TabsTrigger>
              <TabsTrigger value="print" className="gap-1 text-xs sm:text-sm">
                <Printer className="w-3.5 h-3.5 hidden sm:block" /> Print
              </TabsTrigger>
              <TabsTrigger value="bundle" className="gap-1 text-xs sm:text-sm">
                <Download className="w-3.5 h-3.5 hidden sm:block" /> Bundle
              </TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <CaseSummary caseItem={caseItem} evidence={evidence} events={timelineEvents} />
            </TabsContent>
            <TabsContent value="letter">
              <ComplaintLetter caseItem={caseItem} />
            </TabsContent>
            <TabsContent value="evidence">
              <EvidenceVault caseId={caseId} evidence={evidence} caseItem={caseItem} />
            </TabsContent>
            <TabsContent value="timeline">
              <CaseTimeline caseId={caseId} events={timelineEvents} />
            </TabsContent>
            <TabsContent value="visual">
              <VisualTimeline caseId={caseId} events={timelineEvents} evidence={evidence} />
            </TabsContent>
            <TabsContent value="print">
              <PrintBundle caseItem={caseItem} evidence={evidence} events={timelineEvents} />
            </TabsContent>
            <TabsContent value="bundle">
              <EscalationBundle caseItem={caseItem} evidence={evidence} events={timelineEvents} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}