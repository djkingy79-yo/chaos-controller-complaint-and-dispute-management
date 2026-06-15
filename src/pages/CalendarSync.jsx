import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Check, X, ArrowLeft, RefreshCw, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CONNECTOR_ID = "6a2f842ded0843ad5cb9ecb7";

export default function CalendarSync() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncedEvents, setSyncedEvents] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await base44.functions.invoke("syncCalendar", { action: "sync" });
      setSyncedEvents(res.data.events || []);
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err.message);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await fetchData();
      }
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          fetchData();
        }
      }, 500);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setSyncedEvents([]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await fetchData();
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl text-foreground">Calendar Sync</h1>
                <p className="text-sm text-muted-foreground mt-1">Sync case deadlines to Google Calendar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {!user ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-heading font-semibold text-xl text-foreground mb-2">Sign In Required</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in to connect your Google Calendar
            </p>
            <Button onClick={() => base44.auth.redirectToLogin()}>
              Sign In
            </Button>
          </div>
        ) : !connected ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full inline-block">
              <LinkIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-xl text-foreground mb-2">
                Connect Your Google Calendar
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Link your Google Calendar to automatically sync case deadlines, response due dates, and 
                escalation windows. Never miss an important date again.
              </p>
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={handleConnect} className="gap-2">
                <LinkIcon className="w-4 h-4" />
                Connect Google Calendar
              </Button>
            </div>
            <div className="text-xs text-muted-foreground pt-4">
              <p>By connecting, you authorize Chaos Controller to create and manage calendar events</p>
              <p>for your case deadlines. You can disconnect at any time.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Connection Status */}
            <div className="bg-success/10 border border-success/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-full">
                    <Check className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Calendar Connected</h3>
                    <p className="text-sm text-muted-foreground">
                      {syncedEvents.length} deadline events synced to your calendar
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button variant="outline" onClick={handleDisconnect} className="gap-2">
                    <X className="w-4 h-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>

            {/* Synced Events */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Synced Deadlines</h3>
              {syncedEvents.length > 0 ? (
                <div className="space-y-2">
                  {syncedEvents.slice(0, 10).map((event, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.start?.date ? new Date(event.start.date).toLocaleDateString('en-AU', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          }) : 'No date'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {syncedEvents.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{syncedEvents.length - 10} more events in your calendar
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No deadline events found in your calendar yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Events will appear here once you create deadlines in your cases.
                  </p>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h4 className="font-heading font-semibold text-foreground mb-3">How It Works</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </span>
                  <span>When you create or update a deadline, it's automatically added to your Google Calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </span>
                  <span>Each event includes case details, deadline type, and responsibility in the description</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </span>
                  <span>Events are tagged with ⚖️ Chaos Controller for easy identification in your calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">4</span>
                  </span>
                  <span>You'll receive popup notifications: 2 days before, 1 day before, and 1 hour before each deadline</span>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Footer Links */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Chaos Controller. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}