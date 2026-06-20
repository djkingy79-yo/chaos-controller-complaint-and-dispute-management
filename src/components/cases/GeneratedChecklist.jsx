import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, XCircle, Lock, Upload, Trash2, Calendar, Target, FileText } from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  complete: { label: "Complete", icon: CheckCircle2, className: "text-success", badge: "bg-success/15 text-success" },
  needs_review: { label: "Needs Review", icon: AlertTriangle, className: "text-warning", badge: "bg-warning/15 text-warning" },
  missing: { label: "Missing", icon: XCircle, className: "text-destructive", badge: "bg-destructive/15 text-destructive" },
  locked: { label: "Locked", icon: Lock, className: "text-muted-foreground", badge: "bg-secondary text-secondary-foreground" },
};

const priorityConfig = {
  critical: { label: "CRITICAL", color: "bg-destructive/15 text-destructive border-destructive/30" },
  high: { label: "HIGH", color: "bg-warning/15 text-warning border-warning/30" },
  medium: { label: "MEDIUM", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  low: { label: "LOW", color: "bg-muted/15 text-muted-foreground border-muted/30" },
};

export default function GeneratedChecklist({ caseId, caseItem }) {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["checklist", caseId],
    queryFn: () => base44.entities.ChecklistItem.filter({ case_id: caseId }, "-created_date"),
    enabled: !!caseId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await base44.entities.ChecklistItem.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", caseId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.ChecklistItem.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", caseId] });
    },
  });

  const handleStatusToggle = (item) => {
    const newStatus = item.status === "complete" ? "missing" : "complete";
    updateMutation.mutate({ id: item.id, updates: { status: newStatus } });
  };

  const handleProofUpload = async (item, file) => {
    setUploadingId(item.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ChecklistItem.update(item.id, { proof_url: file_url, status: "complete" });
      queryClient.invalidateQueries({ queryKey: ["checklist", caseId] });
      queryClient.invalidateQueries({ queryKey: ["evidence", caseId] });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingId(null);
    }
  };

  const completionRate = items.length > 0 
    ? Math.round((items.filter(i => i.status === "complete").length / items.length) * 100) 
    : 0;

  const criticalItems = items.filter(i => i.priority === "critical");
  const incompleteCritical = criticalItems.filter(i => i.status !== "complete").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-base text-foreground">
            Escalation Checklist
          </h3>
          <Badge className="bg-primary/15 text-primary border-primary/30">
            {completionRate}% Complete
          </Badge>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {incompleteCritical > 0 && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">{incompleteCritical} critical item{incompleteCritical !== 1 ? "s" : ""} remaining</span>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const StatusIcon = statusConfig[item.status]?.icon || Lock;
          const priority = priorityConfig[item.priority] || priorityConfig.medium;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-card rounded-lg border p-4 space-y-3 ${
                item.status === "complete" ? "border-success/30 bg-success/5" : 
                item.priority === "critical" ? "border-destructive/30" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleStatusToggle(item)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    item.status === "complete" 
                      ? "bg-success border-success text-white" 
                      : item.priority === "critical"
                      ? "border-destructive hover:border-destructive/50"
                      : "border-muted-foreground hover:border-primary"
                  }`}
                >
                  {item.status === "complete" && <CheckCircle2 className="w-4 h-4" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${
                        item.status === "complete" ? "text-muted-foreground line-through" : "text-foreground"
                      }`}>
                        {item.label}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs font-bold border ${priority.color}`}>
                        {priority.label}
                      </Badge>
                      <StatusIcon className={`w-4 h-4 ${statusConfig[item.status]?.className}`} />
                    </div>
                  </div>

                  {/* Proof Upload */}
                  {item.requires_proof && (
                    <div className="mt-3 flex items-center gap-2">
                      {item.proof_url ? (
                        <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/30 rounded px-2 py-1">
                          <FileText className="w-3 h-3" />
                          <span className="font-bold">Proof uploaded</span>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => e.target.files[0] && handleProofUpload(item, e.target.files[0])}
                            disabled={uploadingId === item.id}
                          />
                          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
                            uploadingId === item.id
                              ? "bg-muted text-muted-foreground border-muted"
                              : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                          }`}>
                            {uploadingId === item.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                Upload Proof
                              </>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Category & Deadline Info */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize font-bold">{item.category}</span>
                    {item.deadline_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-bold">
                          Due: {new Date(item.deadline_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}