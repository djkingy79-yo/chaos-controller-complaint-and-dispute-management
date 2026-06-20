import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function OutlookDeadlineSync({ caseItem }) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(null);
  const [reminding, setReminding] = useState(false);
  const [synced, setSynced] = useState({});

  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseItem?.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem?.id }),
    enabled: !!caseItem?.id,
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ["checklist", caseItem?.id],
    queryFn: () => base44.entities.ChecklistItem.filter({ case_id: caseItem?.id }),
    enabled: !!caseItem?.id,
  });

  const addToOutlook = async (deadline) => {
    setSyncing(deadline.id);
    try {
      const res = await base44.functions.invoke("syncOutlookCalendar", {
        caseId: caseItem?.id,
      });
      if (res.data?.success) {
        setSynced(prev => ({ ...prev, [deadline.id]: true }));
        toast({ title: "Added to Outlook", description: `"${deadline.title}" added to your calendar.` });
      }
    } catch {
      toast({ title: "Error", description: "Could not add to Outlook calendar.", variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  const sendChecklistReminder = async () => {
    setReminding(true);
    try {
      const res = await base44.functions.invoke("syncOutlookCalendar", {
        caseId: caseItem?.id,
      });
      if (res.data?.success) {
        toast({ title: "Synced to Outlook", description: `${res.data.synced} items synced to your Outlook calendar.` });
      } else {
        toast({ title: "All Done!", description: "Your checklist is fully complete — nothing to remind." });
      }
    } catch {
      toast({ title: "Error", description: "Could not send checklist reminder.", variant: "destructive" });
    } finally {
      setReminding(false);
    }
  };

  const incomplete = checklistItems.filter(i => i.status !== "complete").length;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-400" />
        <h3 className="font-heading font-semibold text-sm text-foreground">Outlook Integration</h3>
      </div>

      {/* Checklist reminder */}
      <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
        <div>
          <p className="text-xs font-semibold text-foreground">Checklist Reminder</p>
          <p className="text-xs text-muted-foreground">
            {incomplete > 0 ? `${incomplete} incomplete item${incomplete > 1 ? "s" : ""}` : "All items complete ✓"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={sendChecklistReminder}
          disabled={reminding || incomplete === 0}
          className="gap-1.5 text-xs"
        >
          {reminding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          Email Me
        </Button>
      </div>

      {/* Deadlines */}
      {deadlines.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No deadlines set for this case.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Deadlines → Outlook</p>
          {deadlines.map(d => (
            <div key={d.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.deadline_date ? format(new Date(d.deadline_date), "d MMM yyyy") : "No date"}</p>
              </div>
              {synced[d.id] ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToOutlook(d)}
                  disabled={syncing === d.id}
                  className="gap-1 text-xs h-7 shrink-0"
                >
                  {syncing === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                  Add
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}