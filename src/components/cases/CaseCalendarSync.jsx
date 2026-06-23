import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, CheckCircle2, Loader2, Link as LinkIcon, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const GOOGLE_CONNECTOR_ID = "6a2f842ded0843ad5cb9ecb7";

export default function CaseCalendarSync({ caseItem }) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [outlookSyncing, setOutlookSyncing] = useState(false);
  const [googleSyncedCount, setGoogleSyncedCount] = useState(0);
  const [outlookSyncedCount, setOutlookSyncedCount] = useState(0);
  const [checking, setChecking] = useState(true);

  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", caseItem?.id],
    queryFn: () => base44.entities.Deadline.filter({ case_id: caseItem?.id }),
    enabled: !!caseItem?.id,
  });

  useEffect(() => {
    base44.functions.invoke("syncCalendar", { action: "check" })
      .then(res => setGoogleConnected(res.data?.connected || false))
      .catch(() => setGoogleConnected(false))
      .finally(() => setChecking(false));
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const url = await base44.connectors.getAppUserConnectURL(GOOGLE_CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          const res = await base44.functions.invoke("syncCalendar", { action: "check" });
          setGoogleConnected(res.data?.connected || false);
        }
      }, 500);
    } catch (e) {
      toast.error("Could not open Google auth: " + e.message);
    }
  };

  const handleGoogleSync = async () => {
    setGoogleSyncing(true);
    try {
      const res = await base44.functions.invoke("syncCalendar", { action: "sync", caseId: caseItem.id });
      const count = res.data?.syncedCount || 0;
      setGoogleSyncedCount(count);
      setGoogleConnected(true);
      toast.success(`${count} deadline${count !== 1 ? "s" : ""} synced to Google Calendar`);
    } catch (e) {
      toast.error("Google sync failed: " + e.message);
    } finally {
      setGoogleSyncing(false);
    }
  };

  const handleOutlookSync = async () => {
    setOutlookSyncing(true);
    try {
      const res = await base44.functions.invoke("syncOutlookCalendar", { caseId: caseItem.id });
      const count = res.data?.synced || res.data?.syncedCount || 0;
      setOutlookSyncedCount(count);
      toast.success(`${count} deadline${count !== 1 ? "s" : ""} synced to Outlook Calendar`);
    } catch (e) {
      toast.error("Outlook sync failed: " + e.message);
    } finally {
      setOutlookSyncing(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm text-foreground">Sync to Calendar</h3>
        {deadlines.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{deadlines.length} deadline{deadlines.length !== 1 ? "s" : ""} to sync</span>
        )}
      </div>

      {deadlines.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {deadlines.map(d => (
            <div key={d.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <span className="flex-1 truncate text-foreground">{d.title}</span>
              {d.deadline_date && <span className="shrink-0">{format(new Date(d.deadline_date), "d MMM yy")}</span>}
            </div>
          ))}
        </div>
      )}

      {deadlines.length === 0 && (
        <p className="text-xs text-muted-foreground">No deadlines set yet. Add deadlines above to sync them to your calendar.</p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Google Calendar */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Google Calendar</p>
          {checking ? (
            <Button size="sm" variant="outline" disabled className="w-full gap-1.5 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
            </Button>
          ) : !googleConnected ? (
            <Button size="sm" variant="outline" onClick={handleGoogleConnect} className="w-full gap-1.5 text-xs">
              <LinkIcon className="w-3.5 h-3.5" /> Connect Google
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleGoogleSync}
              disabled={googleSyncing || deadlines.length === 0}
              className="w-full gap-1.5 text-xs"
            >
              {googleSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {googleSyncing ? "Syncing…" : googleSyncedCount > 0 ? `Synced ${googleSyncedCount}` : "Sync Now"}
            </Button>
          )}
        </div>

        {/* Outlook Calendar */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Outlook Calendar</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOutlookSync}
            disabled={outlookSyncing || deadlines.length === 0}
            className="w-full gap-1.5 text-xs"
          >
            {outlookSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5 text-accent" />}
            {outlookSyncing ? "Syncing…" : outlookSyncedCount > 0 ? `Synced ${outlookSyncedCount}` : "Sync Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}