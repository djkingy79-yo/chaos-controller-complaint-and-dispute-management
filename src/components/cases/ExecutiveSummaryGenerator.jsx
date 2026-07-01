import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, TrendingUp, ShieldAlert, Download, Printer, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { captureDocumentPDF, downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import ReportDocument from "@/components/reports/ReportDocument";
import { format } from "date-fns";

// Same section shape used by CaseDashboardReport.jsx — keeps the AI analysis
// report on the identical unified rendering + capture pathway as everything else.
export function buildSummarySections(summary) {
  const s = summary;
  const sections = [
    { heading: 'Case Overview', paragraphs: [s.case_overview] },
    { heading: 'Established Facts', bullets: s.facts },
    { heading: 'Timeline Summary', paragraphs: [s.timeline_summary] },
    { heading: 'Evidence Summary', bullets: s.evidence_summary },
    { heading: 'Issues Identified', bullets: s.issues_identified },
    { heading: 'Case Strengths', bullets: s.strengths },
    { heading: 'Weaknesses / Risks', bullets: s.weaknesses },
    { heading: 'Missing Evidence', bullets: s.missing_evidence?.length ? s.missing_evidence : ['None identified'] },
    { heading: 'Recommended Next Actions', bullets: s.next_actions },
    { heading: 'Escalation Path', paragraphs: [s.escalation_path] },
  ];
  return sections.filter(sec =>
    (sec.paragraphs && sec.paragraphs.some(p => p && String(p).trim())) ||
    (sec.bullets && sec.bullets.length)
  );
}

export default function ExecutiveSummaryGenerator({ caseItem, onSummaryGenerated }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorDetail, setErrorDetail] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  if (!caseItem) return null;

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setElapsedTime(0);
    setErrorDetail(null);

    console.log('CASE SUMMARY START', { caseId: caseItem.id, caseTitle: caseItem.title });

    const timerInterval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);

    try {
      console.log('CASE SUMMARY: invoking generateExecutiveSummary backend function');

      const response = await base44.functions.invoke('generateExecutiveSummary', { caseId: caseItem.id });

      clearInterval(timerInterval);

      console.log('CASE SUMMARY AI RESPONSE RECEIVED', {
        status: response.status,
        hasData: !!response.data,
        success: response.data?.success,
        errorFromServer: response.data?.error,
        summaryKeys: response.data?.summary ? Object.keys(response.data.summary) : [],
      });

      if (!response.data?.success || !response.data?.summary) {
        const serverError = response.data?.error || 'Server returned no summary';
        console.error('CASE SUMMARY GENERATION FAILED — server error', serverError);
        throw new Error(serverError);
      }

      const summaryData = response.data.summary;
      setSummary(summaryData);
      setShowDialog(true);

      console.log('CASE SUMMARY DATABASE SAVED (by backend)');

      if (onSummaryGenerated) onSummaryGenerated(summaryData);

      toast({
        title: "✓ Case Summary Generated",
        description: `Analysis complete in ${elapsedTime + 1}s. Summary saved to case.`,
      });
    } catch (error) {
      clearInterval(timerInterval);

      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      const status = error?.response?.status;
      console.error('CASE SUMMARY GENERATION FAILED', {
        message: msg,
        status,
        isNetworkError: !error?.response,
        isTimeout: msg?.toLowerCase().includes('timeout'),
        stack: error?.stack,
      });

      setErrorDetail(msg);
      toast({
        title: "✗ Generation Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!summary || !reportRef.current) return;
    setPdfLoading(true);
    try {
      const blob = await captureDocumentPDF(reportRef.current, { caseId: caseItem?.id });
      if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
      downloadPDFBlob(blob, `Case_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: "PDF Downloaded" });
    } catch (err) {
      console.error('CASE SUMMARY PDF DOWNLOAD FAILED', err);
      toast({ title: "PDF Failed", description: err.message, variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!summary || !reportRef.current) return;
    setPdfLoading(true);
    try {
      const blob = await captureDocumentPDF(reportRef.current, { caseId: caseItem?.id });
      if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
      const opened = await openPDFForPrint(blob, `Case_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      if (!opened) {
        toast({ title: "Print blocked", description: "Downloading instead (Safari/popup blocker)." });
        downloadPDFBlob(blob, `Case_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      } else {
        toast({ title: "PDF opened — use browser Share/Print" });
      }
    } catch (err) {
      console.error('CASE SUMMARY PDF PRINT FAILED', err);
      toast({ title: "Print Failed", description: err.message, variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      {/* Hidden off-screen report — same ReportDocument + captureDocumentPDF pathway as the
          dashboard's Complete Case Report, so the AI analysis PDF is visually identical. */}
      {summary && (
        <div style={{ position: 'fixed', top: '-10000px', left: 0, zIndex: -1, pointerEvents: 'none' }}>
          <div ref={reportRef}>
            <ReportDocument
              title={`Case Summary — ${caseItem.title}`}
              generatedLabel={`Generated ${format(new Date(), 'd MMMM yyyy, h:mm a')}`}
              sections={buildSummarySections(summary)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleGenerateSummary}
          disabled={generating}
          variant="outline"
          className="gap-2"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analysing Case...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Case Summary</>
          )}
        </Button>

        {summary && (
          <>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(true)} className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> View Summary
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} disabled={pdfLoading} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </Button>
          </>
        )}

        {errorDetail && !generating && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-xs text-destructive flex-1">{errorDetail}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSummary}
              className="h-6 text-xs px-2 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {generating && (
        <div className="fixed bottom-6 right-6 bg-card border-2 border-primary/40 rounded-xl p-4 shadow-2xl z-50 min-w-[280px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Generating Summary...</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI is analysing your complete case file</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-lg font-mono font-bold text-primary">{elapsedTime}s</span>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-secondary/50 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-linear" style={{ width: `${Math.min((elapsedTime / 60) * 100, 95)}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Typically 20–40 seconds</p>
        </div>
      )}

      {/* Summary Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6" /> Case Summary — {caseItem.title}
            </DialogTitle>
            <DialogDescription>AI-powered analysis of your complete case file</DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="space-y-5 mt-4">
              {/* PDF actions inside dialog */}
              <div className="flex gap-2 justify-end border-b border-border pb-3">
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintPDF} disabled={pdfLoading} className="gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Print PDF
                </Button>
              </div>

              <Section icon={<TrendingUp className="w-5 h-5 text-primary" />} title="Case Overview" gradient>
                <p className="text-sm leading-relaxed">{summary.case_overview}</p>
              </Section>

              {summary.facts?.length > 0 && (
                <Section icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Established Facts">
                  <BulletList items={summary.facts} color="bg-success" />
                </Section>
              )}

              {summary.timeline_summary && (
                <Section icon={<Clock className="w-5 h-5 text-accent" />} title="Timeline Summary">
                  <p className="text-sm leading-relaxed">{summary.timeline_summary}</p>
                </Section>
              )}

              {summary.evidence_summary?.length > 0 && (
                <Section icon={<FileText className="w-5 h-5 text-primary" />} title="Evidence Summary">
                  <BulletList items={summary.evidence_summary} color="bg-primary" />
                </Section>
              )}

              {summary.issues_identified?.length > 0 && (
                <Section icon={<AlertCircle className="w-5 h-5 text-warning" />} title="Issues Identified">
                  <BulletList items={summary.issues_identified} color="bg-warning" />
                </Section>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {summary.strengths?.length > 0 && (
                  <Section icon={<CheckCircle2 className="w-5 h-5 text-success" />} title="Strengths">
                    <BulletList items={summary.strengths} color="bg-success" />
                  </Section>
                )}
                {summary.weaknesses?.length > 0 && (
                  <Section icon={<ShieldAlert className="w-5 h-5 text-destructive" />} title="Weaknesses / Risks">
                    <BulletList items={summary.weaknesses} color="bg-destructive" />
                  </Section>
                )}
              </div>

              {summary.missing_evidence?.length > 0 && (
                <Section icon={<AlertTriangle className="w-5 h-5 text-warning" />} title="Missing Evidence">
                  <BulletList items={summary.missing_evidence} color="bg-warning" />
                </Section>
              )}

              <Section icon={<CheckCircle2 className="w-5 h-5 text-accent" />} title="Recommended Next Actions" gradient accent>
                <BulletList items={summary.next_actions || []} color="bg-accent" />
              </Section>

              {summary.escalation_path && (
                <Section icon={<TrendingUp className="w-5 h-5 text-primary" />} title="Escalation Path">
                  <p className="text-sm leading-relaxed">{summary.escalation_path}</p>
                </Section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ icon, title, children, gradient, accent }) {
  const base = gradient
    ? accent
      ? "bg-gradient-to-br from-accent/10 via-card to-primary/5 border border-accent/30"
      : "bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/30"
    : "bg-card border border-border";
  return (
    <div className={`rounded-xl p-5 ${base}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-heading font-bold text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, color }) {
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${color} shrink-0 mt-1.5`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}