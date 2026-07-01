import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus,
  AlertCircle,
  MessageSquare,
  Clock,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Zap,
  Loader2,
  CalendarPlus,
  Download,
  Printer,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { downloadPDFBlob, openPDFForPrint } from "@/lib/pdfGenerator";
import ReportDocument from "@/components/reports/ReportDocument";
import { renderDocToBlob } from "@/lib/renderDocToBlob";
import { toast } from "sonner";
import { pdfDiagStart, pdfDiagBlobCreated, pdfDiagSuccess, pdfDiagFail, pdfDiagMissingData } from "@/lib/pdfDiagnostics";

const eventTypeConfig = {
  incident: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  complaint: { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
  response: { icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
  deadline: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  escalation: { icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" },
  evidence: { icon: FileText, color: "text-success", bg: "bg-success/10" },
  resolution: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  action_required: { icon: Zap, color: "text-warning", bg: "bg-warning/10" },
};

export default function CaseTimeline({ caseId, events, caseItem }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // holds event object being edited
  const [form, setForm] = useState({ title: "", description: "", event_type: "incident", event_date: new Date().toISOString().split("T")[0] });
  const [addingToCalendar, setAddingToCalendar] = useState(null);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimelineEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
      setShowAdd(false);
      setForm({ title: "", description: "", event_type: "incident", event_date: new Date().toISOString().split("T")[0] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimelineEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
      setEditingEvent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimelineEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timeline", caseId] }),
  });

  const handleEditOpen = (ev) => {
    setEditingEvent({
      id: ev.id,
      title: ev.title || "",
      description: ev.description || "",
      event_type: ev.event_type || "incident",
      event_date: ev.event_date || new Date().toISOString().split("T")[0],
    });
  };

  const handleDelete = (ev) => {
    if (window.confirm(`Delete event "${ev.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(ev.id);
    }
  };

  const handleAddToCalendar = async (event) => {
    if (!event.event_date) return;
    
    setAddingToCalendar(event.id);
    try {
      const caseData = await base44.entities.Case.get(caseId);
      const eventDate = new Date(event.event_date);
      const endDate = new Date(eventDate);
      endDate.setHours(eventDate.getHours() + 1);

      const result = await base44.functions.invoke('syncCalendar', {
        action: 'create',
        event: {
          summary: `[${caseData.title}] ${event.title}`,
          description: `${event.description || ''}\n\nCase: ${caseData.title}\nOrganisation: ${caseData.organisation_name || 'N/A'}\nStatus: ${caseData.status}`,
          start: {
            dateTime: eventDate.toISOString(),
            timeZone: 'Australia/Sydney'
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Australia/Sydney'
          }
        }
      });

      if (result.success) {
        alert('✓ Event added to your Google Calendar!');
      } else {
        alert('Failed to add event. Please ensure Google Calendar is connected.');
      }
    } catch (error) {
      console.error('Calendar error:', error);
      alert('Error adding to calendar: ' + error.message);
    } finally {
      setAddingToCalendar(null);
    }
  };

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('autoGenerateTimelineFromEvidence', { caseId });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
      toast.success('Timeline auto-generated from case data');
    } catch (error) {
      console.error('[CaseTimeline] AI generation failed:', error);
      toast.error('Failed to generate timeline: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const buildTimelineBlob = async () => {
    if (!sorted || sorted.length === 0) throw new Error('No timeline events to export.');
    const bullets = sorted.map(ev => {
      const dateStr = ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : 'Undated';
      return `${dateStr} — ${ev.title || 'Event'} (${(ev.event_type || '').replace(/_/g, ' ')})${ev.description ? ': ' + ev.description : ''}`;
    });
    const blob = await renderDocToBlob(
      <ReportDocument
        title="Case Timeline"
        subtitle={caseItem?.title}
        generatedLabel={`Generated ${format(new Date(), 'd MMMM yyyy')}`}
        sections={[{ heading: `Timeline (${sorted.length} events)`, bullets }]}
      />,
      { caseId }
    );
    if (!blob || blob.size === 0) throw new Error('Generated PDF is empty');
    return blob;
  };

  const handleTimelinePDF = async () => {
    pdfDiagStart({ tab: 'Timeline', action: 'Download PDF', caseId, hasCase: !!caseItem, hasData: sorted.length > 0 });
    if (!sorted.length) { pdfDiagMissingData({ tab: 'Timeline', action: 'Download PDF', dataName: 'timeline events' }); return; }
    try {
      const blob = await buildTimelineBlob();
      pdfDiagBlobCreated({ tab: 'Timeline', action: 'Download PDF', blob });
      downloadPDFBlob(blob, `Timeline_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      pdfDiagSuccess({ tab: 'Timeline', action: 'Download PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Timeline', action: 'Download PDF', error });
    }
  };

  const handleTimelinePrint = async () => {
    pdfDiagStart({ tab: 'Timeline', action: 'Print PDF', caseId, hasCase: !!caseItem, hasData: sorted.length > 0 });
    if (!sorted.length) { pdfDiagMissingData({ tab: 'Timeline', action: 'Print PDF', dataName: 'timeline events' }); return; }
    try {
      const blob = await buildTimelineBlob();
      pdfDiagBlobCreated({ tab: 'Timeline', action: 'Print PDF', blob });
      const opened = await openPDFForPrint(blob, `Timeline_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      if (!opened) { toast.warning('Print blocked — downloading instead.'); downloadPDFBlob(blob, `Timeline_${format(new Date(), 'yyyy-MM-dd')}.pdf`); }
      pdfDiagSuccess({ tab: 'Timeline', action: 'Print PDF' });
    } catch (error) {
      pdfDiagFail({ tab: 'Timeline', action: 'Print PDF', error });
    }
  };

  const sorted = [...events].sort((a, b) => {
    const da = a.event_date || a.created_date;
    const db = b.event_date || b.created_date;
    return new Date(da) - new Date(db);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Timeline</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {sorted.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleTimelinePDF} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleTimelinePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleAIGenerate} disabled={generating} className="gap-1.5 text-xs">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Timeline Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="response">Response</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="escalation">Escalation</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="resolution">Resolution</SelectItem>
                      <SelectItem value="action_required">Action Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What happened?" />
                </div>
                <div className="space-y-2">
                  <Label>Details (optional)</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="More details..." rows={3} />
                </div>
                <Button
                  onClick={() => createMutation.mutate({ ...form, case_id: caseId })}
                  disabled={!form.title || createMutation.isPending}
                  className="w-full gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timeline Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={editingEvent.event_type} onValueChange={(v) => setEditingEvent({ ...editingEvent, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="escalation">Escalation</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="resolution">Resolution</SelectItem>
                    <SelectItem value="action_required">Action Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editingEvent.event_date} onChange={(e) => setEditingEvent({ ...editingEvent, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Details (optional)</Label>
                <Textarea value={editingEvent.description} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} rows={3} />
              </div>
              <Button
                onClick={() => updateMutation.mutate({ id: editingEvent.id, data: { title: editingEvent.title, description: editingEvent.description, event_type: editingEvent.event_type, event_date: editingEvent.event_date } })}
                disabled={!editingEvent.title || updateMutation.isPending}
                className="w-full gap-2"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {sorted.length === 0 ? (
        <div className="bg-secondary/30 rounded-lg border border-dashed border-border p-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">No timeline events yet.</p>
          <p className="text-xs text-muted-foreground mb-4">Click "AI Generate" to automatically build your timeline from uploaded documents and case details.</p>
          <Button size="sm" onClick={handleAIGenerate} disabled={generating} className="gap-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Generate Timeline
          </Button>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
          {sorted.map((ev, i) => {
            const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.incident;
            const EvIcon = cfg.icon;
            return (
              <div key={ev.id} className="relative pb-5 last:pb-0">
                <div className={`absolute -left-3.5 top-1 w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center`}>
                  <EvIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div className="ml-5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">
                      {ev.event_date ? format(new Date(ev.event_date), "d MMM yyyy") : format(new Date(ev.created_date), "d MMM yyyy")}
                    </span>
                    <div className="flex items-center gap-1">
                      {ev.event_type === 'deadline' && ev.event_date && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleAddToCalendar(ev)}
                          disabled={addingToCalendar === ev.id}
                        >
                          {addingToCalendar === ev.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CalendarPlus className="w-3 h-3" />
                          )}
                          Add to Calendar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditOpen(ev)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(ev)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-0.5">{ev.title}</p>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}