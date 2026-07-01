import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { differenceInDays, format } from "date-fns";
import { Sparkles, Plus, Loader2, Clock, AlertTriangle, CheckCircle2, Trash2, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import ReportDocument from "@/components/reports/ReportDocument";
import { renderDocToBlob } from "@/lib/renderDocToBlob";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";

export default function DeadlineManager({ caseItem, evidence = [] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    deadline_date: '',
    deadline_type: 'response_due',
    responsibility: 'user',
    notes: '',
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseItem?.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem?.id }),
    enabled: !!caseItem?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Deadline.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines", caseItem.id] });
      setShowAdd(false);
      setForm({ title: '', deadline_date: '', deadline_type: 'response_due', responsibility: 'user', notes: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deadline.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deadlines", caseItem.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Deadline.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deadlines", caseItem.id] }),
  });

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      // Build context from case + evidence
      const extractedTexts = evidence
        .filter(ev => ev.extracted_text || ev.extracted_data?.document_summary)
        .map(ev => ev.extracted_text || ev.extracted_data?.document_summary)
        .slice(0, 3)
        .join('\n\n');

      const prompt = `You are an Australian consumer dispute expert. Generate a list of critical deadlines for this case.

CASE DETAILS:
Organisation: ${caseItem.organisation_name || 'Unknown'}
Category: ${caseItem.category || 'other'}
Status: ${caseItem.status || 'draft'}
Issue: ${caseItem.issue_summary || 'Not specified'}
Incident Date: ${caseItem.incident_date || 'Unknown'}
Escalation Body: ${caseItem.escalation_body || 'Not specified'}

DOCUMENT CONTEXT:
${extractedTexts || 'No documents uploaded yet'}

Generate 4-8 realistic deadlines for this dispute. For Australian consumer disputes:
- Banking: AFCA requires lodgement within 2 years of incident
- Insurance: typically 21 days to respond to complaints
- Tenancy (NCAT): bond claims within 3 months of vacating
- Telco (TIO): complaint within 2 years
- Response deadlines: typically 21 days for first complaint, 14 days for follow-ups

Return as JSON array only. Each deadline must have:
- title: string (what this deadline is)
- deadline_date: string (YYYY-MM-DD, calculate from today ${new Date().toISOString().split('T')[0]} or incident date)
- deadline_type: one of: response_due, submission, tribunal_date, escalation_window, review_period, other
- responsibility: one of: user, provider, tribunal, other
- notes: string (why this deadline matters, what to do)`;

      const schema = {
        type: 'object',
        properties: {
          deadlines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                deadline_date: { type: 'string' },
                deadline_type: { type: 'string' },
                responsibility: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          },
        },
      };

      const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const generated = result?.deadlines || [];

      if (!generated.length) {
        toast.error('AI did not return any deadlines. Try again.');
        return;
      }

      for (const dl of generated) {
        if (!dl.title) continue;
        await base44.entities.Deadline.create({
          case_id: caseItem.id,
          title: dl.title,
          deadline_date: dl.deadline_date || undefined,
          deadline_type: dl.deadline_type || 'other',
          responsibility: dl.responsibility || 'user',
          notes: dl.notes || '',
          status: 'pending',
        });
      }

      queryClient.invalidateQueries({ queryKey: ["deadlines", caseItem.id] });
      toast.success(`${generated.length} deadlines generated`);
    } catch (error) {
      console.error('[DeadlineManager] AI generation failed:', error);
      toast.error('Failed to generate deadlines: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const buildDeadlinesBlob = async () => {
    if (!deadlines.length) throw new Error('No deadlines to export.');
    const sortedDl = [...deadlines].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
    const bullets = sortedDl.map(d => {
      const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), new Date()) : null;
      const urgency = daysLeft === null ? 'No date' : daysLeft < 0 ? `OVERDUE by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} days remaining`;
      return `${d.title} — Due ${d.deadline_date ? format(new Date(d.deadline_date), 'd MMM yyyy') : 'No date'} (${urgency}) — ${(d.deadline_type || '').replace(/_/g, ' ')} — ${d.responsibility || 'user'}${d.notes ? ' — ' + d.notes : ''}`;
    });
    const blob = await renderDocToBlob(
      <ReportDocument
        title="Deadline War Room"
        subtitle={caseItem.title}
        generatedLabel={`Generated ${format(new Date(), 'd MMMM yyyy')}`}
        sections={[{ heading: `Deadlines (${sortedDl.length} items)`, bullets }]}
      />,
      { caseId: caseItem?.id }
    );
    if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
    return blob;
  };

  const handleDownloadPDF = async () => {
    pdfDiagStart({ tab: 'Deadlines', action: 'Download PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: deadlines.length > 0 });
    if (!deadlines.length) { pdfDiagMissingData({ tab: 'Deadlines', action: 'Download PDF', dataName: 'deadlines' }); return; }
    try {
      const blob = await buildDeadlinesBlob();
      pdfDiagBlobCreated({ tab: 'Deadlines', action: 'Download PDF', blob });
      downloadPDFBlob(blob, `Deadlines_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      pdfDiagSuccess({ tab: 'Deadlines', action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Deadlines', action: 'Download PDF', error });
    }
  };

  const handlePrintPDF = async () => {
    pdfDiagStart({ tab: 'Deadlines', action: 'Print PDF', caseId: caseItem?.id, hasCase: !!caseItem, hasData: deadlines.length > 0 });
    if (!deadlines.length) { pdfDiagMissingData({ tab: 'Deadlines', action: 'Print PDF', dataName: 'deadlines' }); return; }
    try {
      const blob = await buildDeadlinesBlob();
      pdfDiagBlobCreated({ tab: 'Deadlines', action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, `Deadlines_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      if (!opened) { toast.warning('Print blocked — downloading instead.'); downloadPDFBlob(blob, `Deadlines_${format(new Date(), 'yyyy-MM-dd')}.pdf`); }
      pdfDiagSuccess({ tab: 'Deadlines', action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Deadlines', action: 'Print PDF', error });
    }
  };

  const sorted = [...deadlines].sort((a, b) => new Date(a.deadline_date || 0) - new Date(b.deadline_date || 0));
  const overdue = sorted.filter(d => d.deadline_date && differenceInDays(new Date(d.deadline_date), new Date()) < 0 && d.status === 'pending');
  const upcoming = sorted.filter(d => d.deadline_date && differenceInDays(new Date(d.deadline_date), new Date()) >= 0 && d.status === 'pending');
  const completed = sorted.filter(d => d.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-heading font-semibold text-foreground">Deadlines</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {sorted.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintPDF} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleAIGenerate}
            disabled={generating}
            className="gap-1.5 text-xs"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Deadline
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Deadline</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Response deadline to 1st complaint" />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.deadline_date} onChange={e => setForm({ ...form, deadline_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.deadline_type} onValueChange={v => setForm({ ...form, deadline_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="response_due">Response Due</SelectItem>
                      <SelectItem value="submission">Submission</SelectItem>
                      <SelectItem value="tribunal_date">Tribunal Date</SelectItem>
                      <SelectItem value="escalation_window">Escalation Window</SelectItem>
                      <SelectItem value="review_period">Review Period</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Responsibility</Label>
                  <Select value={form.responsibility} onValueChange={v => setForm({ ...form, responsibility: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Me (User)</SelectItem>
                      <SelectItem value="provider">Provider / Organisation</SelectItem>
                      <SelectItem value="tribunal">Tribunal / External Body</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Why this deadline matters..." rows={2} />
                </div>
                <Button
                  onClick={() => createMutation.mutate({ ...form, case_id: caseItem.id, status: 'pending' })}
                  disabled={!form.title || createMutation.isPending}
                  className="w-full gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Deadline
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI generation banner when empty */}
      {deadlines.length === 0 && !generating && (
        <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">No deadlines set</p>
          <p className="text-xs text-muted-foreground mb-4">Click "AI Generate" to automatically detect deadlines from your case details and uploaded documents.</p>
          <Button size="sm" onClick={handleAIGenerate} disabled={generating} className="gap-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Generate Deadlines
          </Button>
        </div>
      )}

      {generating && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-pulse shrink-0" />
          <span className="font-medium">AI is analysing your case and generating deadlines...</span>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-destructive uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue ({overdue.length})
          </p>
          {overdue.map(d => <DeadlineRow key={d.id} d={d} onUpdate={updateMutation} onDelete={deleteMutation} />)}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Upcoming ({upcoming.length})</p>
          {upcoming.map(d => <DeadlineRow key={d.id} d={d} onUpdate={updateMutation} onDelete={deleteMutation} />)}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Completed ({completed.length})</p>
          {completed.map(d => <DeadlineRow key={d.id} d={d} onUpdate={updateMutation} onDelete={deleteMutation} />)}
        </div>
      )}
    </div>
  );
}

function DeadlineRow({ d, onUpdate, onDelete }) {
  const daysLeft = d.deadline_date ? differenceInDays(new Date(d.deadline_date), new Date()) : null;
  const overdue = daysLeft !== null && daysLeft < 0 && d.status === 'pending';
  const urgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && d.status === 'pending';
  const completed = d.status === 'completed';

  return (
    <div className={`bg-card border rounded-lg p-3 ${overdue ? 'border-destructive/40' : urgent ? 'border-warning/40' : completed ? 'border-success/30' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{d.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {d.deadline_date && (
              <span className="text-xs text-muted-foreground">{format(new Date(d.deadline_date), 'd MMM yyyy')}</span>
            )}
            <span className="text-xs capitalize text-muted-foreground">{(d.deadline_type || '').replace(/_/g, ' ')}</span>
            {daysLeft !== null && d.status === 'pending' && (
              <Badge className={`text-xs ${overdue ? 'bg-destructive/10 text-destructive' : urgent ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'TODAY' : `${daysLeft}d left`}
              </Badge>
            )}
          </div>
          {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {d.status !== 'completed' ? (
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-success hover:bg-success/10"
              onClick={() => onUpdate.mutate({ id: d.id, data: { status: 'completed' } })}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              onClick={() => onUpdate.mutate({ id: d.id, data: { status: 'pending' } })}
            >
              <Clock className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (window.confirm(`Delete "${d.title}"?`)) onDelete.mutate(d.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}