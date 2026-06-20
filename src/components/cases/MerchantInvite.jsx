import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Share2, Mail, Copy, CheckCircle2, Loader2, XCircle, Users,
  Calendar, RefreshCw, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function MerchantInvite({ caseItem }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portalUrl, setPortalUrl] = useState(null);

  const { data: shares = [], refetch: refetchShares } = useQuery({
    queryKey: ["shares", caseItem.id],
    queryFn: () => base44.entities.CaseShare.filter({ case_id: caseItem.id }),
    enabled: !!caseItem.id,
  });

  const activeShare = shares.find(s => s.is_active);

  const handleInvite = async () => {
    if (!email) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke("inviteMerchant", {
        caseId: caseItem.id,
        recipientEmail: email,
        recipientName: name || email,
        notifyOnUpdate: true
      });
      setPortalUrl(res.data.portalUrl);
      setEmail("");
      setName("");
      refetchShares();
      toast({ title: "Invitation sent!", description: `${name || email} has been emailed the portal link.` });
    } catch (err) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (shareId) => {
    await base44.entities.CaseShare.update(shareId, { is_active: false });
    refetchShares();
    toast({ title: "Access revoked", description: "The shared portal link is no longer active." });
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOutlookSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncOutlookCalendar", { caseId: caseItem.id });
      toast({
        title: "Synced to Outlook!",
        description: `${res.data.synced} items added — deadlines to calendar, checklist items to To-Do.`
      });
      setSyncOpen(false);
    } catch (err) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const getShareUrl = (token) => `https://app.base44.com/6a2ac3b012e45642b1f94671/shared-case/${token}`;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm text-foreground">Share & Sync</h3>
      </div>

      {/* Outlook Sync button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs font-bold border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
        onClick={() => setSyncOpen(true)}
      >
        <Calendar className="w-3.5 h-3.5" />
        Sync to Outlook Calendar
      </Button>

      {/* Outlook sync confirmation dialog */}
      <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Case to Outlook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">This will add the following to your connected Outlook account:</p>
            <ul className="text-sm space-y-2 text-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>All pending <strong>deadlines</strong> as calendar events (with 1-day reminders)</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Incomplete <strong>checklist items</strong> as Microsoft To-Do tasks</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Future <strong>action-required</strong> events as calendar reminders</span></li>
            </ul>
            <Button onClick={handleOutlookSync} disabled={syncing} className="w-full gap-2">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing active share */}
      {activeShare && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Shared with</span>
            <Badge className="bg-green-500/15 text-green-600 border-0 text-xs">Active</Badge>
          </div>
          <p className="text-sm font-medium text-foreground">{activeShare.recipient_name || activeShare.recipient_email}</p>
          <p className="text-xs text-muted-foreground">{activeShare.recipient_email}</p>
          {activeShare.last_viewed && (
            <p className="text-xs text-muted-foreground">Last viewed: {format(new Date(activeShare.last_viewed), "d MMM yyyy HH:mm")}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => handleCopy(getShareUrl(activeShare.share_token))}>
              {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open(getShareUrl(activeShare.share_token), "_blank")}>
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleRevoke(activeShare.id)}>
              <XCircle className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Invite form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="w-full gap-2 text-xs font-bold">
            <Share2 className="w-3.5 h-3.5" />
            {activeShare ? "Update Merchant Access" : "Invite Merchant / Respondent"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Merchant / Respondent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Send a secure, read-only portal link to the merchant or organisation. They'll see case status, timeline, deadlines, and checklist — no login required.
            </p>
            <div className="space-y-2">
              <Label>Their Name / Organisation</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Commonwealth Bank Complaints Team" />
            </div>
            <div className="space-y-2">
              <Label>Their Email Address *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="complaints@bank.com.au" />
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>✓ They receive a professional case notification email</p>
              <p>✓ Read-only view — no personal details exposed</p>
              <p>✓ They're notified when case status changes</p>
              <p>✓ You can revoke access at any time</p>
            </div>
            <Button onClick={handleInvite} disabled={!email || sending} className="w-full gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Invite Email"}
            </Button>
            {portalUrl && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-green-600 font-bold mb-1">✓ Portal link created:</p>
                <div className="flex gap-2">
                  <Input value={portalUrl} readOnly className="text-xs h-7" />
                  <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => handleCopy(portalUrl)}>
                    {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}