import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

// stage: "first" | "second" | "third"
export default function ResponseCheckpointDialog({ open, onClose, caseItem, stage }) {
  const queryClient = useQueryClient();

  const [responseDate, setResponseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [responseSummary, setResponseSummary] = useState("");
  const [outcomeType, setOutcomeType] = useState("other");

  const updateCase = useMutation({
    mutationFn: (data) => base44.entities.Case.update(caseItem.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case", caseItem.id] }),
  });

  const createTimeline = useMutation({
    mutationFn: (data) => base44.entities.TimelineEvent.create(data),
  });

  const stageLabels = { first: "1st", second: "2nd", third: "3rd / Final" };
  const responseField = `${stage}_response_received_at`;
  const noResponseField = `${stage}_no_response_at`;

  const nextStageMap = {
    first: "awaiting_second_response",
    second: "awaiting_final_response",
    third: "escalation_ready",
  };

  const noResponseStageMap = {
    first: "first_no_response",
    second: "second_no_response",
    third: "final_no_response",
  };

  const responseStageMap = {
    first: "offer_received",
    second: "offer_received",
    third: "offer_received",
  };

  const handleRecordResponse = async () => {
    if (!responseSummary.trim()) {
      toast.error("Please enter a response summary.");
      return;
    }
    const ts = new Date(responseDate).toISOString();
    await updateCase.mutateAsync({
      [responseField]: ts,
      progress_stage: responseStageMap[stage],
    });
    await createTimeline.mutateAsync({
      case_id: caseItem.id,
      event_date: responseDate,
      title: `Response received from ${caseItem.organisation_name || "organisation"} (after ${stageLabels[stage]} complaint)`,
      description: `Outcome type: ${outcomeType}. ${responseSummary}`,
      event_type: "response",
      is_action_required: false,
    });
    toast.success("Response recorded.");
    onClose();
  };

  const handleNoResponse = async () => {
    const ts = new Date().toISOString();
    const today = format(new Date(), "yyyy-MM-dd");
    await updateCase.mutateAsync({
      [noResponseField]: ts,
      progress_stage: noResponseStageMap[stage],
    });
    await createTimeline.mutateAsync({
      case_id: caseItem.id,
      event_date: today,
      title: `No response received (after ${stageLabels[stage]} complaint)`,
      description: `${caseItem.organisation_name || "The organisation"} did not respond by the required deadline.`,
      event_type: "action_required",
      is_action_required: true,
    });
    toast.success("No-response recorded. Next step unlocked.");
    onClose();
  };

  const busy = updateCase.isPending || createTimeline.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stageLabels[stage]} Complaint — Response Checkpoint
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* YES path */}
          <div className="border border-green-200 rounded-lg p-4 space-y-3 bg-green-50/40">
            <p className="text-sm font-semibold text-green-700">YES — Organisation responded</p>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Response Date</label>
              <Input type="date" value={responseDate} onChange={e => setResponseDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Outcome Type</label>
              <Select value={outcomeType} onValueChange={setOutcomeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offer">Settlement Offer Made</SelectItem>
                  <SelectItem value="denial">Claim Denied</SelectItem>
                  <SelectItem value="request_info">Request for More Info</SelectItem>
                  <SelectItem value="other">Other / General Response</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Response Summary</label>
              <Textarea
                placeholder="Briefly describe what the organisation said…"
                rows={3}
                value={responseSummary}
                onChange={e => setResponseSummary(e.target.value)}
              />
            </div>
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleRecordResponse}
              disabled={busy}
            >
              Record Response Received
            </Button>
          </div>

          {/* NO path */}
          <div className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50/40">
            <p className="text-sm font-semibold text-red-700">NO RESPONSE — Deadline passed</p>
            <p className="text-xs text-muted-foreground">
              {stage === "third"
                ? "This will mark the organisation as having failed to respond and unlock Escalation."
                : `This will mark no response and unlock the ${stage === "first" ? "2nd" : "3rd Final"} Complaint.`}
            </p>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleNoResponse}
              disabled={busy}
            >
              {stage === "third" ? "No Response — Escalate" : `No Response — Unlock ${stage === "first" ? "2nd" : "3rd"} Complaint`}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}