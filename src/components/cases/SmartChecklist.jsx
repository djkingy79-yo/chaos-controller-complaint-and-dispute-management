import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Target,
  FileText,
  Upload,
  Shield,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

const evidenceRequirements = {
  banking: [
    { label: "Account statements (last 6 months)", icon: FileText, priority: "critical" },
    { label: "Correspondence with bank (emails/letters)", icon: FileText, priority: "critical" },
    { label: "Transaction records showing disputed amounts", icon: FileText, priority: "critical" },
    { label: "Contract or terms and conditions", icon: FileText, priority: "high" },
    { label: "ID documents (passport/driver's licence)", icon: Shield, priority: "high" },
    { label: "Proof of losses (receipts/invoices)", icon: Upload, priority: "medium" },
  ],
  insurance: [
    { label: "Insurance policy document", icon: FileText, priority: "critical" },
    { label: "Claim forms and submissions", icon: FileText, priority: "critical" },
    { label: "Correspondence with insurer", icon: FileText, priority: "critical" },
    { label: "Evidence of loss/damage (photos/reports)", icon: Upload, priority: "critical" },
    { label: "Independent assessments/quotes", icon: FileText, priority: "high" },
    { label: "Medical reports (if applicable)", icon: FileText, priority: "medium" },
  ],
  tenancy: [
    { label: "Residential tenancy agreement", icon: FileText, priority: "critical" },
    { label: "Bond lodgement confirmation", icon: FileText, priority: "critical" },
    { label: "Condition report (ingress/egress)", icon: FileText, priority: "critical" },
    { label: "Photos/videos of property condition", icon: Upload, priority: "critical" },
    { label: "Correspondence with landlord/agent", icon: FileText, priority: "high" },
    { label: "Receipts for repairs/cleaning", icon: FileText, priority: "high" },
    { label: "Witness statements (if applicable)", icon: FileText, priority: "medium" },
  ],
  telco: [
    { label: "Service contract/terms", icon: FileText, priority: "critical" },
    { label: "Account statements", icon: FileText, priority: "critical" },
    { label: "Call logs/usage records", icon: FileText, priority: "high" },
    { label: "Correspondence with provider", icon: FileText, priority: "critical" },
    { label: "Speed tests/screenshots (for internet issues)", icon: Upload, priority: "medium" },
    { label: "Proof of outages/service issues", icon: Upload, priority: "medium" },
  ],
  utilities: [
    { label: "Energy/water account statements", icon: FileText, priority: "critical" },
    { label: "Supply contract/terms", icon: FileText, priority: "critical" },
    { label: "Meter readings/photos", icon: Upload, priority: "high" },
    { label: "Correspondence with provider", icon: FileText, priority: "critical" },
    { label: "Evidence of billing errors", icon: FileText, priority: "high" },
    { label: "Medical certificates (for hardship concessions)", icon: FileText, priority: "medium" },
  ],
  other: [
    { label: "Contract or agreement", icon: FileText, priority: "critical" },
    { label: "Correspondence records", icon: FileText, priority: "critical" },
    { label: "Evidence of loss/damage", icon: Upload, priority: "high" },
    { label: "ID documents", icon: Shield, priority: "high" },
    { label: "Supporting documentation", icon: FileText, priority: "medium" },
  ],
};

export default function SmartChecklist({ caseItem }) {
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateAIChecklist', { caseId: caseItem.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", caseItem.id] });
      queryClient.invalidateQueries({ queryKey: ["deadlines", caseItem.id] });
    },
  });

  const { data: existingItems = [] } = useQuery({
    queryKey: ["checklist", caseItem.id],
    queryFn: () => base44.entities.ChecklistItem.filter({ case_id: caseItem.id }),
    enabled: !!caseItem.id,
  });

  const category = caseItem.category || "other";
  const evidenceList = evidenceRequirements[category] || evidenceRequirements.other;
  const hasChecklist = existingItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Evidence Requirements */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/30 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-black text-lg text-foreground mb-1">
              Required Evidence for {category.charAt(0).toUpperCase() + category.slice(1)} Disputes
            </h3>
            <p className="text-sm text-muted-foreground font-bold">
              Upload these documents to build a strong case
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {evidenceList.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-card rounded-lg border border-border p-3 flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  item.priority === "critical" ? "bg-destructive/10" :
                  item.priority === "high" ? "bg-warning/10" : "bg-secondary/50"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    item.priority === "critical" ? "text-destructive" :
                    item.priority === "high" ? "text-warning" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] py-0 px-1.5 mt-1 ${
                      item.priority === "critical" ? "bg-destructive/10 text-destructive" :
                      item.priority === "high" ? "bg-warning/10 text-warning" : ""
                    }`}
                  >
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Checklist Generator */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-black text-lg text-foreground mb-1">
              AI-Powered Case Checklist
            </h3>
            <p className="text-sm text-muted-foreground font-bold mb-4">
              Generate a complete escalation checklist with deadlines tailored to your dispute
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-card rounded-lg border border-border p-3 flex items-start gap-2">
                <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Smart Prioritization</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Critical, high, medium, and low priority tasks</p>
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border p-3 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Auto Deadlines</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Calendar deadlines synced for critical tasks</p>
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Proof Tracking</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Evidence required for key milestones</p>
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Industry Specific</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tailored to {category} regulations</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground font-bold">
                  ✨ AI will analyze your case and generate 8-15 essential steps including evidence requirements, mandatory waiting periods, complaint procedures, and escalation deadlines.
                </p>
              </div>
            </div>

            {hasChecklist ? (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <p className="text-sm font-bold text-foreground">Checklist auto-generated with {existingItems.length} items</p>
                </div>
                <Button 
                  onClick={() => generateMutation.mutate()} 
                  disabled={generateMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => generateMutation.mutate()} 
                disabled={generateMutation.isPending}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Is Generating Your Checklist...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Checklist
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}