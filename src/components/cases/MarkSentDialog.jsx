import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, CalendarClock, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { markLetterSent } from "@/lib/letterTracking";
import { LETTER_SENT_FIELD_MAP, SEND_METHODS } from "@/lib/disputeStageLogic";

/**
 * MarkSentDialog — lets the user record a letter as sent, including
 * retrospective (past) dates for letters sent before joining the app.
 */
export default function MarkSentDialog({ open, onClose, caseItem, letterType }) {
  const queryClient = useQueryClient();
  const sentField = LETTER_SENT_FIELD_MAP[letterType?.key];
  const existing = caseItem?.letter_tracking?.[letterType?.key];
  const existingSentAt = caseItem?.[sentField];

  const [sentDate, setSentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState("email");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dateSource = existingSentAt || new Date().toISOString();
    setSentDate(format(new Date(dateSource), "yyyy-MM-dd"));
    setMethod(existing?.sentMethod || "email");
    setRecipientName(existing?.sentTo || "");
    setRecipientEmail(caseItem?.organisation_complaints_email || "");
    setNotes(existing?.sentNotes || "");
    setProofFile(null);
  }, [open, letterType?.key]);

  const handleSave = async () => {
    if (!sentDate) {
      toast.error("Please select the date this letter was sent.");
      return;
    }
    setSaving(true);
    try {
      let proofFileUrl = existing?.proofOfSendingFileId || "";
      if (proofFile) {
        setUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
        proofFileUrl = file_url;
        setUploading(false);
      }

      await markLetterSent(caseItem, letterType.key, {
        sentDate,
        method,
        recipientName,
        recipientEmail,
        notes,
        proofFileUrl,
        manuallyMarkedSent: true,
      });

      queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", caseItem.id] });
      toast.success(`${letterType.label} marked as sent`);
      onClose();
    } catch (e) {
      toast.error("Failed to save: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            {existingSentAt ? "Change Sent Date" : "Mark as Sent"} — {letterType?.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-xs text-muted-foreground">
            Already sent this letter before joining Chaos Controller? Record the real date here —
            deadlines, timeline and matter strength will use this date, not today.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs">Date Sent *</Label>
            <Input type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} max={format(new Date(), "yyyy-MM-dd")} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Method Sent</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEND_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Recipient Name</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Complaints team" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Recipient Email</Label>
              <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="complaints@org.com.au" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra detail about how/when this was sent…" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><Paperclip className="w-3 h-3" /> Proof of Sending (optional)</Label>
            <Input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="text-xs" />
            {existing?.proofOfSendingFileId && !proofFile && (
              <p className="text-xs text-muted-foreground">Proof already on file. Choose a new file to replace it.</p>
            )}
          </div>

          <DialogFooter className="pt-1">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
              {saving ? (uploading ? "Uploading proof…" : "Saving…") : "Save Sent Date"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}