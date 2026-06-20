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
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setElapsedTime(0);
    
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    try {
      const response = await base44.functions.invoke('generateExecutiveSummary', {
        caseId: caseItem.id
      });
      
      clearInterval(timerInterval);
      
      if (response.data?.success && response.data?.summary) {
        setSummary(response.data);
        setShowDialog(true);
        
        // Save summary to case entity for persistent storage
        await base44.entities.Case.update(caseItem.id, {
          executive_summary: JSON.stringify(response.data.summary)
        });
        
        toast({
          title: "✓ Summary Generated",
          description: `AI analyzed your case in ${elapsedTime + 1} seconds.`,
        });
      } else {
        throw new Error(response.data?.error || "AI did not return a summary");
      }
    } catch (error) {
      clearInterval(timerInterval);
      toast({
        title: "✗ Generation Failed",
        description: error.message || "Please try again",
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
            Analysing Case...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Case Summary
          </>
        )}
      </Button>

      {/* Loading Timer Box */}
      {generating && (
        <div className="fixed bottom-6 right-6 bg-card border-2 border-primary/40 rounded-xl p-4 shadow-2xl z-50 min-w-[280px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Generating Summary...</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI is analysing your case file
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-lg font-mono font-bold text-primary">
                  {elapsedTime}s
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-secondary/50 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min((elapsedTime / 60) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Typically takes 15-30 seconds
          </p>
        </div>
      )}

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