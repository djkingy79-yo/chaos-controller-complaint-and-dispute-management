import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, TrendingUp, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ExecutiveSummaryGenerator({ caseItem }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      console.log("Generating summary for case:", caseItem.id);
      
      toast({
        title: "Generating Summary",
        description: "AI is analyzing your case file. This may take 30-60 seconds...",
      });
      
      // Use AbortController for timeout (90 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      try {
        const response = await base44.functions.invoke('generateExecutiveSummary', {
          caseId: caseItem.id
        }, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
        
        if (response.status === 200 && response.data?.success && response.data?.summary) {
          setSummary(response.data);
          setShowDialog(true);
          toast({
            title: "✓ Summary Generated",
            description: "AI has analyzed your complete case file.",
          });
        } else if (response.data?.error) {
          throw new Error(response.data.error);
        } else {
          throw new Error("AI did not return a summary - please try again");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out. Please try again with a smaller case file.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Summary generation failed:", error);
      const errorMsg = error.message || "Network error occurred";
      toast({
        title: "✗ Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerateSummary}
        disabled={generating}
        variant="outline"
        className="gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Case...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Case Summary
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6" />
              Case Summary — {caseItem.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              AI-powered analysis of your complete case file
            </DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="space-y-6 mt-4">
              {/* Case Overview */}
              <div className="bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-lg">Case Overview</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {summary.summary.summary}
                </p>
              </div>

              {/* Case Strength Assessment */}
              {summary.summary.case_strength_assessment && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <h3 className="font-heading font-bold text-lg">Case Strength Assessment</h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {summary.summary.case_strength_assessment}
                  </p>
                </div>
              )}

              {/* Key Issues */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <h3 className="font-heading font-bold text-lg">Key Issues</h3>
                </div>
                <ul className="space-y-2">
                  {summary.summary.key_issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-1.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evidence Analysis */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-success" />
                  <h3 className="font-heading font-bold text-lg">Evidence Analysis</h3>
                </div>
                <ul className="space-y-2">
                  {summary.summary.evidence_analysis.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Correspondence Summary */}
              {summary.summary.correspondence_summary && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <h3 className="font-heading font-bold text-lg">Correspondence History</h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {summary.summary.correspondence_summary}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-accent/10 via-card to-primary/5 border border-accent/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <h3 className="font-heading font-bold text-lg">Recommended Next Steps</h3>
                </div>
                <ul className="space-y-2">
                  {summary.summary.next_steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Critical Deadlines */}
              {summary.summary.critical_deadlines && summary.summary.critical_deadlines.length > 0 && (
                <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-destructive" />
                    <h3 className="font-heading font-bold text-lg text-destructive">Critical Deadlines</h3>
                  </div>
                  <ul className="space-y-2">
                    {summary.summary.critical_deadlines.map((deadline, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm font-semibold text-destructive">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{deadline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}