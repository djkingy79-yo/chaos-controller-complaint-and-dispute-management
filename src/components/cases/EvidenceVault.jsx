import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Image,
  Mail,
  FileCheck,
  Loader2,
  Trash2,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const typeConfig = {
  email: { icon: Mail, label: "Email", color: "bg-primary/10 text-primary" },
  photo: { icon: Image, label: "Photo", color: "bg-accent/10 text-accent" },
  contract: { icon: FileCheck, label: "Contract", color: "bg-warning/10 text-warning" },
  statement: { icon: FileText, label: "Statement", color: "bg-success/10 text-success" },
  notice: { icon: FileText, label: "Notice", color: "bg-destructive/10 text-destructive" },
  receipt: { icon: FileText, label: "Receipt", color: "bg-secondary text-secondary-foreground" },
  report: { icon: FileText, label: "Report", color: "bg-muted text-muted-foreground" },
  correspondence: { icon: Mail, label: "Correspondence", color: "bg-primary/10 text-primary" },
  other: { icon: FileText, label: "Other", color: "bg-muted text-muted-foreground" },
};

export default function EvidenceVault({ caseId, evidence }) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ file_type: "other", description: "", event_date: "" });
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", caseId] });
      setShowUpload(false);
      setNewEvidence({ file_type: "other", description: "", event_date: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evidence.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evidence", caseId] }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    createMutation.mutate({
      case_id: caseId,
      file_url,
      file_name: file.name,
      file_type: newEvidence.file_type,
      description: newEvidence.description,
      event_date: newEvidence.event_date || undefined,
    });
    setUploading(false);
  };

  const sorted = [...evidence].sort((a, b) => {
    if (a.event_date && b.event_date) return new Date(a.event_date) - new Date(b.event_date);
    return new Date(a.created_date) - new Date(b.created_date);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">Evidence Vault</h3>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Drop the Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Drop the Evidence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={newEvidence.file_type} onValueChange={(v) => setNewEvidence({ ...newEvidence, file_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  placeholder="e.g. Email from bank rejecting claim"
                />
              </div>
              <div className="space-y-2">
                <Label>Event Date (optional)</Label>
                <Input
                  type="date"
                  value={newEvidence.event_date}
                  onChange={(e) => setNewEvidence({ ...newEvidence, event_date: e.target.value })}
                />
              </div>
              <div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || createMutation.isPending}
                  className="w-full gap-2"
                >
                  {uploading || createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading..." : "Choose File & Upload"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-secondary/30 rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">DROP THE EVIDENCE</p>
          <p className="text-xs text-muted-foreground">Screenshots, emails, letters, contracts.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Throw the mess here — AI will sort it out.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((ev) => {
            const cfg = typeConfig[ev.file_type] || typeConfig.other;
            const TypeIcon = cfg.icon;
            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 group hover:border-primary/20 transition-colors"
              >
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ev.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
                    {ev.event_date && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(ev.event_date), "d MMM yyyy")}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(ev.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}