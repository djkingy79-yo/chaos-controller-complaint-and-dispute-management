import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, CheckCircle2, XCircle, RefreshCw, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateChaosDocumentPDF } from "@/lib/pdfGenerator";

// Convert a Blob to a standard base64 string (not URL-safe)
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:application/pdf;base64,XXXX" — strip the prefix
      const b64 = reader.result.split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function LetterEmailDialog({
  open,
  onClose,
  caseItem,
  letterType,    // { key, label, field }
  letterText,    // raw text content of the letter
  evidence = [],
}) {
  const queryClient = useQueryClient();

  const defaultSubject = `Formal ${letterType?.label} — ${caseItem?.organisation_name || 'Dispute'} (CC-${caseItem?.id?.slice(0, 8).toUpperCase()})`;
  const defaultRecipient = caseItem?.organisation_complaints_email || '';

  const [recipientEmail, setRecipientEmail] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [attachLetter, setAttachLetter] = useState(true);
  const [attachEvidenceIndex, setAttachEvidenceIndex] = useState(false);
  const [sending, setSending] = useState(false);

  // Reset fields when dialog opens for a new letter
  useEffect(() => {
    if (open) {
      setRecipientEmail(caseItem?.organisation_complaints_email || '');
      setSubject(`Formal ${letterType?.label} — ${caseItem?.organisation_name || 'Dispute'} (CC-${caseItem?.id?.slice(0, 8).toUpperCase()})`);
      setAttachLetter(true);
      setAttachEvidenceIndex(false);
    }
  }, [open, letterType?.key]);

  // Load send history for this letter type
  const { data: emailLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['emailLogs', caseItem?.id, letterType?.key],
    queryFn: () => base44.entities.EmailLog.filter({ case_id: caseItem?.id, letter_type: letterType?.key }),
    enabled: open && !!caseItem?.id && !!letterType?.key,
  });

  const lastLog = emailLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  const handleSend = async () => {
    if (!recipientEmail || !subject) {
      toast.error('Recipient email and subject are required.');
      return;
    }
    if (!letterText || !letterText.trim()) {
      toast.error('Generate the letter first before sending.');
      return;
    }

    setSending(true);
    toast.info('Preparing email…');

    try {
      const attachments = [];

      // Always attach the letter PDF if checked
      if (attachLetter) {
        const cleanContent = String(letterText).replace(/<[^>]*>/g, '').trim();
        const blob = await generateChaosDocumentPDF({
          documentType: 'general',
          title: letterType.label,
          body: cleanContent,
          includeHeader: true,
          includeFooter: true,
        });
        if (!blob || blob.size === 0) throw new Error('Letter PDF could not be generated.');
        const b64 = await blobToBase64(blob);
        const filename = `${String(letterType.label).replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        attachments.push({ filename, base64: b64 });
      }

      // Evidence index PDF
      if (attachEvidenceIndex && evidence.length > 0) {
        const evidenceLines = evidence.map((ev, i) =>
          `${i + 1}. ${ev.file_name} (${ev.file_type || 'document'}) — ${ev.event_date || 'date unknown'}\n   ${ev.description || (ev.extracted_data?.document_summary || 'No description')}`
        ).join('\n\n');
        const evidenceBlob = await generateChaosDocumentPDF({
          documentType: 'general',
          title: 'Evidence Index',
          body: `EVIDENCE INDEX\n\nCase: ${caseItem.title}\nOrganisation: ${caseItem.organisation_name || 'N/A'}\nGenerated: ${format(new Date(), 'd MMMM yyyy')}\n\n----------------------------------------\n\n${evidenceLines}`,
          includeHeader: true,
          includeFooter: true,
        });
        if (evidenceBlob && evidenceBlob.size > 0) {
          const b64 = await blobToBase64(evidenceBlob);
          attachments.push({ filename: `Evidence_Index_${format(new Date(), 'yyyy-MM-dd')}.pdf`, base64: b64 });
        }
      }

      const res = await base44.functions.invoke('sendLetterEmail', {
        caseId: caseItem.id,
        letterType: letterType.key,
        letterLabel: letterType.label,
        recipientEmail,
        subject,
        attachments,
      });

      if (res.data?.success) {
        toast.success(`Email sent successfully to ${recipientEmail}`);
        refetchLogs();
        queryClient.invalidateQueries({ queryKey: ['emailLogs'] });
        // Auto-close dialog after 1.5 seconds
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(res.data?.error || 'Send failed');
      }
    } catch (err) {
      toast.error(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => {
    handleSend();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Send {letterType?.label} via Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* Last send status */}
          {lastLog && (
            <div className={`rounded-lg border px-4 py-3 text-xs flex items-start gap-2 ${
              lastLog.status === 'sent'
                ? 'bg-green-500/10 border-green-500/30 text-green-700'
                : lastLog.status === 'failed'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-muted/50 border-border text-muted-foreground'
            }`}>
              {lastLog.status === 'sent' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              {lastLog.status === 'failed' && <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <div>
                {lastLog.status === 'sent' && (
                  <p><strong>Last sent:</strong> {lastLog.sent_at ? format(new Date(lastLog.sent_at), "d MMM yyyy, h:mm a") : 'recently'} → {lastLog.recipient_email}</p>
                )}
                {lastLog.status === 'failed' && (
                  <p><strong>Last send failed:</strong> {lastLog.error_message || 'Unknown error'}</p>
                )}
                {lastLog.status === 'pending' && <p>Send pending…</p>}
              </div>
            </div>
          )}

          {!lastLog && (
            <div className="bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-xs text-muted-foreground">
              Not sent yet
            </div>
          )}

          {/* Recipient */}
          <div className="space-y-1.5">
            <Label className="text-xs">Recipient Email *</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="complaints@organisation.com.au"
              className="text-sm"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5"><Paperclip className="w-3 h-3" /> Attachments</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachLetter}
                  onChange={e => setAttachLetter(e.target.checked)}
                  className="rounded"
                />
                <span>{letterType?.label} PDF <Badge variant="secondary" className="text-[10px] ml-1">Recommended</Badge></span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachEvidenceIndex}
                  onChange={e => setAttachEvidenceIndex(e.target.checked)}
                  className="rounded"
                  disabled={evidence.length === 0}
                />
                <span className={evidence.length === 0 ? 'text-muted-foreground' : ''}>
                  Evidence Index PDF {evidence.length === 0 && '(no evidence uploaded)'}
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {lastLog?.status === 'failed' ? (
              <Button onClick={handleRetry} disabled={sending} className="flex-1 gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Retry Send'}
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={sending || !recipientEmail} className="flex-1 gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send Email'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}