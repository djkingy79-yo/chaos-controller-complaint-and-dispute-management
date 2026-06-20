import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Calendar, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function AIChecklistGenerator({ caseItem }) {
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

  const hasChecklist = existingItems.length > 0;

  // Always show the component - either as generator or as info bar with regenerate option

  return (
    <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/30 rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-black text-lg text-foreground mb-1">
            AI-Powered Checklist Generator
          </h3>
          <p className="text-sm text-muted-foreground font-bold mb-4">
            Automatically generate a complete escalation checklist with deadlines tailored to your {caseItem.category} dispute.
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
                <p className="text-xs text-muted-foreground mt-0.5">Tailored to {caseItem.category} regulations</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-foreground font-bold">
              ✨ AI will analyze your case and generate 8-15 essential steps including evidence requirements, mandatory waiting periods, complaint procedures, and escalation deadlines.
            </p>
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
  );
}