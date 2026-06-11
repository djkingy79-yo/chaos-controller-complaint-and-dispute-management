import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft } from "lucide-react";

const questionSets = {
  banking: [
    { key: "organisation_name", label: "Which bank is this about?", type: "text", placeholder: "e.g. Commonwealth Bank, ANZ, Westpac" },
    { key: "issue_type", label: "What type of banking issue?", type: "select", options: ["Transaction dispute", "Chargeback", "Fraud", "Account issue", "Hardship", "Service failure", "Fees & charges", "Other"] },
    { key: "issue_summary", label: "Briefly describe what happened", type: "text", placeholder: "e.g. Unauthorised transaction on my account" },
    { key: "issue_details", label: "Tell us the full story", type: "textarea", placeholder: "Include dates, amounts, what you've already tried, and any conversations you've had with the bank..." },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Full refund of $500, apology, or account correction" },
  ],
  insurance: [
    { key: "organisation_name", label: "Which insurer?", type: "text", placeholder: "e.g. NRMA, Allianz, QBE" },
    { key: "issue_type", label: "What type of insurance issue?", type: "select", options: ["Claim denied", "Claim delayed", "Assessment dispute", "Communication failure", "Policy issue", "Underpayment", "Other"] },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Home insurance claim denied after storm damage" },
    { key: "issue_details", label: "Full details of your situation", type: "textarea", placeholder: "Include claim numbers, dates, what happened, assessor details, correspondence..." },
    { key: "desired_outcome", label: "What outcome are you seeking?", type: "textarea", placeholder: "e.g. Claim approved and paid in full" },
  ],
  tenancy: [
    { key: "organisation_name", label: "Who is the dispute with?", type: "text", placeholder: "e.g. Real estate agency name or landlord" },
    { key: "issue_type", label: "What type of tenancy issue?", type: "select", options: ["Repairs not done", "Bond dispute", "Termination notice", "Rent increase", "Privacy breach", "Harassment", "Other"] },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Landlord refusing to fix broken hot water for 3 weeks" },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include property address, dates, what was reported, responses received..." },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Repairs completed within 7 days, compensation for inconvenience" },
  ],
  telco: [
    { key: "organisation_name", label: "Which provider?", type: "text", placeholder: "e.g. Optus, Telstra, Vodafone, TPG" },
    { key: "issue_type", label: "What type of issue?", type: "select", options: ["Billing error", "Contract dispute", "Service outage", "Poor service", "Cancellation issue", "Misleading conduct", "Other"] },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Charged for services not received" },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include account numbers, dates, amounts, conversations..." },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Refund of overcharged amount, contract released" },
  ],
  utilities: [
    { key: "organisation_name", label: "Which provider?", type: "text", placeholder: "e.g. AGL, Origin Energy, EnergyAustralia" },
    { key: "issue_type", label: "What type of issue?", type: "select", options: ["Billing error", "Disconnection", "Meter issue", "Hardship", "Service failure", "Contract issue", "Other"] },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Estimated bills significantly higher than actual usage" },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include account numbers, billing periods, amounts, conversations..." },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Correct billing based on actual meter reads, refund of excess" },
  ],
  other: [
    { key: "organisation_name", label: "Which organisation?", type: "text", placeholder: "Company or organisation name" },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "What went wrong?" },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include all relevant dates, people, amounts and what you've already done..." },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "What would make this right?" },
  ],
};

export default function GuidedQuestions({ category, data, onChange, onNext, onBack }) {
  const questions = questionSets[category] || questionSets.other;
  const [step, setStep] = useState(0);
  const current = questions[step];

  const handleChange = (value) => {
    onChange({ ...data, [current.key]: value });
  };

  const canProceed = !!data[current.key]?.trim();

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onNext();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-heading font-semibold">{current.label}</Label>
        {current.type === "text" && (
          <Input
            value={data[current.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={current.placeholder}
            className="text-base"
          />
        )}
        {current.type === "textarea" && (
          <Textarea
            value={data[current.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={current.placeholder}
            rows={5}
            className="text-base"
          />
        )}
        {current.type === "select" && (
          <Select value={data[current.key] || ""} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {current.options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="gap-2">
          {step < questions.length - 1 ? "Continue" : "Review Case"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}