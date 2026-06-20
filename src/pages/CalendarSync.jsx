import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Check, X, ArrowLeft, RefreshCw, Link as LinkIcon, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GOOGLE_CONNECTOR_ID = "6a2f842ded0843ad5cb9ecb7";

function CalendarCard({ title, subtitle, icon, color, connected, syncing, syncedCount, totalDeadlines, syncedItems, onConnect, onDisconnect, onSync, error, steps }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-border">
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-lg text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {connected && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 border border-success/20 rounded-full px-3 py-1">
            <Check className="w-3 h-3" /> Connected
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">{error}</div>
        )}
        {!connected ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Connect to automatically sync all case deadlines, action items, and status changes.</p>
            <Button onClick={onConnect} className="gap-2">
              <LinkIcon className="w-4 h-4" /> Connect {title}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{totalDeadlines} deadline{totalDeadlines !== 1 ? 's' : ''} tracked</p>
                {syncedCount > 0 && <p className="text-xs text-muted-foreground">{syncedCount} event{syncedCount !== 1 ? 's' : ''} synced last run</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={onSync} disabled={syncing} title="Sync Now">
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={onDisconnect} className="gap-1.5 text-xs">
                  <X className="w-3.5 h-3.5" /> Disconnect
                </Button>
              </div>
            </div>
            {syncedItems.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {syncedItems.slice(0, 8).map((ev, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-secondary/20 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs text-foreground truncate">{ev.summary || ev.subject || ev.title}</span>
                    {(ev.start?.date || ev.date) && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {new Date(ev.start?.date || ev.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                ))}
                {syncedItems.length > 8 && <p className="text-xs text-muted-foreground text-center pt-1">+{syncedItems.length - 8} more</p>}
              </div>
            )}
          </>
        )}
        <div className="border-t border-border pt-3 space-y-1.5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CalendarSync() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google Calendar state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleSyncedCount, setGoogleSyncedCount] = useState(0);
  const [googleTotal, setGoogleTotal] = useState(0);
  const [googleError, setGoogleError] = useState(null);

  // Outlook state
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookSyncing, setOutlookSyncing] = useState(false);
  const [outlookItems, setOutlookItems] = useState([]);
  const [outlookSyncedCount, setOutlookSyncedCount] = useState(0);
  const [outlookTotal, setOutlookTotal] = useState(0);
  const [outlookError, setOutlookError] = useState(null);


  const checkGoogle = async () => {
    try {
      const res = await base44.functions.invoke("syncCalendar", { action: "check" });
      setGoogleConnected(res.data?.connected || false);
      setGoogleEvents(res.data?.events || []);
      setGoogleSyncedCount(res.data?.syncedCount || 0);
      setGoogleTotal(res.data?.totalDeadlines || 0);
      setGoogleError(null);
    } catch {
      setGoogleConnected(false);
    }
  };

  const syncGoogle = async () => {
    try {
      const res = await base44.functions.invoke("syncCalendar", { action: "sync" });
      setGoogleEvents(res.data?.events || []);
      setGoogleSyncedCount(res.data?.syncedCount || 0);
      setGoogleTotal(res.data?.totalDeadlines || 0);
      setGoogleConnected(true);
      setGoogleError(null);
    } catch (err) {
      setGoogleConnected(false);
      setGoogleError(err.message);
    }
  };

  const checkOutlook = async () => {
    try {
      const res = await base44.functions.invoke("syncOutlookCalendar", {});
      setOutlookConnected(true);
      setOutlookItems(res.data?.items || []);
      setOutlookSyncedCount(res.data?.synced || 0);
      setOutlookTotal(res.data?.totalDeadlines || 0);
      setOutlookError(null);
    } catch {
      setOutlookConnected(false);
    }
  };

  const handleOutlookConnect = async () => {
    // Outlook is a shared connector managed by the app owner in dashboard settings
    setOutlookError("Outlook is connected as a shared account. Manage the connection in your dashboard settings.");
  };

  const handleOutlookDisconnect = async () => {
    setOutlookError("Outlook is a shared connector. To disconnect, please use the dashboard connector settings.");
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await Promise.all([checkGoogle(), checkOutlook()]);
      }
      setLoading(false);
    });
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(GOOGLE_CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) { clearInterval(timer); syncGoogle(); }
      }, 500);
    } catch (err) { setGoogleError(err.message); }
  };

  const handleGoogleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(GOOGLE_CONNECTOR_ID);
    setGoogleConnected(false); setGoogleEvents([]);
  };

  const handleOutlookSync = async () => {
    setOutlookSyncing(true);
    await checkOutlook();
    setOutlookSyncing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
      <h2 className="font-heading font-semibold text-xl mb-2">Sign In Required</h2>
      <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Calendar Sync</h1>
            <p className="text-sm text-muted-foreground">Auto-sync deadlines & actions to Google Calendar and Outlook</p>
          </div>
        </div>
      </div>

      {/* Auto-sync notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Fully automated:</span> Every new deadline, checklist action, and case status change is synced instantly — no manual steps required.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CalendarCard
          title="Google Calendar"
          subtitle="Syncs deadlines & actions automatically"
          icon={<Calendar className="w-5 h-5 text-primary" />}
          color="bg-primary/10"
          connected={googleConnected}
          syncing={googleSyncing}
          syncedCount={googleSyncedCount}
          totalDeadlines={googleTotal}
          syncedItems={googleEvents}
          onConnect={handleGoogleConnect}
          onDisconnect={handleGoogleDisconnect}
          onSync={async () => { setGoogleSyncing(true); await syncGoogle(); setGoogleSyncing(false); }}
          error={googleError}
          steps={[
            "New deadlines are instantly added to Google Calendar",
            "Case status changes update existing events automatically",
            "Events tagged ⚖️ Chaos Controller for easy filtering",
            "Reminders: 2 days, 1 day, and 1 hour before each deadline",
          ]}
        />

        <CalendarCard
          title="Outlook Calendar"
          subtitle="Microsoft 365 — deadlines, tasks & actions"
          icon={<Calendar className="w-5 h-5 text-accent" />}
          color="bg-accent/10"
          connected={outlookConnected}
          syncing={outlookSyncing}
          syncedCount={outlookSyncedCount}
          totalDeadlines={outlookTotal}
          syncedItems={outlookItems}
          onConnect={handleOutlookConnect}
          onDisconnect={handleOutlookDisconnect}
          onSync={handleOutlookSync}
          error={outlookError}
          steps={[
            "New deadlines are instantly added to Outlook Calendar",
            "Case status changes update existing events automatically",
            "Events tagged ⚖️ Chaos Controller for easy filtering",
            "Reminders: 1 day before each deadline",
          ]}
        />
      </div>
    </div>
  );
}