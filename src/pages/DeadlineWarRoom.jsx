import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { differenceInDays, format, isPast, isToday } from "date-fns";
import { Siren, Clock, Plus, CheckCircle2, XCircle, AlertTriangle, Calendar, User2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const urgencyConfig = (daysLeft) => {
  if (daysLeft < 0) return { label: "OVERDUE", className: "bg-destructive text-destructive-foreground", icon: XCircle };
  if (daysLeft === 0) return { label: "TODAY IS THE DAY", className: "bg-destructive text-destructive-foreground animate-pulse", icon: Siren };
  if (daysLeft <= 2) return { label: "48 HOURS", className: "bg-destructive/80 text-destructive-foreground", icon: Siren };
  if (daysLeft <= 7) return { label: "7 DAYS", className: "bg-warning/80 text-warning-foreground", icon: AlertTriangle };
  if (daysLeft <= 14) return { label: "14 DAYS", className: "bg-warning/40 text-warning", icon: AlertTriangle };
  if (daysLeft <= 30) return { label: "30 DAYS", className: "bg-primary/15 text-primary", icon: Clock };
  return { label: `${daysLeft} days`, className: "bg-secondary text-secondary-foreground", icon: Calendar };
};

const responsibilityLabel = { user: "You", provider: "Provider", tribunal: "Tribunal", other: "Other" };

export default function DeadlineWarRoom() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", deadline_date: "", deadline_type: "response_due", responsibility: "user", notes: "", case_id: "" });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }),
  });

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ["deadlines"],
    queryFn: () => base44.entities.Deadline.filter({ created_by_id: user?.id }, "deadline_date"),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Deadline.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deadlines"] }); setOpen(false); setForm({ title: "", deadline_date: "", deadline_type: "response_due", responsibility: "user", notes: "", case_id: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deadline.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Deadline.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines"] }),
  });

  const pending = deadlines.filter((d) => d.status === "pending");
  const completed = deadlines.filter((d) => d.status === "completed");

  const getCaseName = (id) => cases.find((c) => c.id === id)?.title || "Unknown Case";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Siren className="w-7 h-7 text-destructive" /> Deadline War Room
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track every critical date. Miss nothing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/calendar-sync'}>
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Sync to Calendar</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Deadline</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Deadline</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Provider response due" className="mt-1" />
                </div>
                <div>
                  <Label>Deadline Date</Label>
                  <Input type="date" value={form.deadline_date} onChange={(e) => setForm({ ...form, deadline_date: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Case</Label>
                  <Select value={form.case_id} onValueChange={(v) => setForm({ ...form, case_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select case" /></SelectTrigger>
                    <SelectContent>
                      {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.deadline_type} onValueChange={(v) => setForm({ ...form, deadline_type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                  <div>
                    <Label>Responsibility</Label>
                    <Select value={form.responsibility} onValueChange={(v) => setForm({ ...form, responsibility: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">You</SelectItem>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="tribunal">Tribunal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.deadline_date}>Save Deadline</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Deadlines */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-foreground">Active Deadlines ({pending.length})</h2>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl border border-border animate-pulse" />)}</div>
        ) : pending.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No active deadlines. You're in control.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((d, i) => {
              const daysLeft = differenceInDays(new Date(d.deadline_date), new Date());
              const urg = urgencyConfig(daysLeft);
              const UrgIcon = urg.icon;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${urg.className} shrink-0`}>
                    <UrgIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{d.title}</span>
                      <Badge className={`${urg.className} border-0 text-xs`}>{urg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(d.deadline_date), "d MMM yyyy")}</span>
                      <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{responsibilityLabel[d.responsibility]}</span>
                      {d.case_id && <span className="truncate">{getCaseName(d.case_id)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-8 text-success border-success/30 hover:bg-success/10"
                      onClick={() => updateMutation.mutate({ id: d.id, data: { status: "completed" } })}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(d.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-muted-foreground">Completed ({completed.length})</h2>
          <div className="space-y-2">
            {completed.map((d) => (
              <div key={d.id} className="bg-card/50 rounded-lg border border-border p-3 flex items-center gap-3 opacity-60">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span className="text-sm line-through text-muted-foreground">{d.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">{format(new Date(d.deadline_date), "d MMM yyyy")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}