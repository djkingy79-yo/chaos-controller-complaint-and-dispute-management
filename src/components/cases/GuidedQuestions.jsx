import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Building2, Loader2 } from "lucide-react";
import OrgPicker from "@/components/directories/OrgPicker";
import { detectIndustry } from "@/lib/industryClassifier";

// Complainant personal details — collected for every category
const complainantFields = [
  { key: "complainant_name", label: "Your full name", type: "text", placeholder: "e.g. Darren Smith", required: true },
  { key: "complainant_address", label: "Your postal address", type: "text", placeholder: "e.g. 12 Main Street, Sydney NSW 2000", required: true },
  { key: "complainant_email", label: "Your email address", type: "text", placeholder: "e.g. darren@email.com", required: true },
  { key: "complainant_phone", label: "Your mobile number", type: "text", placeholder: "e.g. 0412 345 678", required: true },
];

const caseFields = {
  banking: [
    { key: "organisation_name", label: "Which bank is this about?", type: "text", placeholder: "e.g. Commonwealth Bank, ANZ, Westpac", required: true },
    { key: "organisation_complaints_address", label: "Bank's complaints postal address (if known)", type: "text", placeholder: "e.g. GPO Box 9916, Sydney NSW 2001", required: false },
    { key: "organisation_complaints_email", label: "Bank's complaints email (if known)", type: "text", placeholder: "e.g. complaints@cba.com.au", required: false },
    { key: "complaint_handler_name", label: "Name of the person handling your complaint (if known)", type: "text", placeholder: "e.g. John Smith — Customer Relations", required: false },
    { key: "account_number", label: "Account or card number", type: "text", placeholder: "e.g. 062-000 / 12345678", required: false },
    { key: "incident_date", label: "Date of the incident", type: "date", placeholder: "", required: false },
    { key: "issue_type", label: "What type of banking issue?", type: "select", options: ["Transaction dispute", "Chargeback", "Fraud", "Account issue", "Hardship", "Service failure", "Fees & charges", "Other"], required: true },
    { key: "issue_summary", label: "Briefly describe what happened", type: "text", placeholder: "e.g. Unauthorised transaction on my account", required: true },
    { key: "issue_details", label: "Tell us the full story", type: "textarea", placeholder: "Include dates, amounts, what you've already tried, and any conversations you've had with the bank...", required: true },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Full refund of $500, apology, or account correction", required: true },
  ],
  insurance: [
    { key: "organisation_name", label: "Which insurer?", type: "text", placeholder: "e.g. NRMA, Allianz, QBE", required: true },
    { key: "organisation_complaints_address", label: "Insurer's complaints postal address (if known)", type: "text", placeholder: "e.g. GPO Box 244, Sydney NSW 2001", required: false },
    { key: "organisation_complaints_email", label: "Insurer's complaints email (if known)", type: "text", placeholder: "e.g. complaints@nrma.com.au", required: false },
    { key: "complaint_handler_name", label: "Name of your claims officer / complaint handler (if known)", type: "text", placeholder: "e.g. Jane Doe — Claims", required: false },
    { key: "account_number", label: "Policy number", type: "text", placeholder: "e.g. POL-123456789", required: false },
    { key: "incident_date", label: "Date of the incident or claim", type: "date", placeholder: "", required: false },
    { key: "issue_type", label: "What type of insurance issue?", type: "select", options: ["Claim denied", "Claim delayed", "Assessment dispute", "Communication failure", "Policy issue", "Underpayment", "Other"], required: true },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Home insurance claim denied after storm damage", required: true },
    { key: "issue_details", label: "Full details of your situation", type: "textarea", placeholder: "Include claim numbers, dates, what happened, assessor details, correspondence...", required: true },
    { key: "desired_outcome", label: "What outcome are you seeking?", type: "textarea", placeholder: "e.g. Claim approved and paid in full", required: true },
  ],
  tenancy: [
    { key: "organisation_name", label: "Who is the dispute with?", type: "text", placeholder: "e.g. Ray White Bondi, John Smith (landlord)", required: true },
    { key: "organisation_complaints_address", label: "Their postal address (if known)", type: "text", placeholder: "e.g. 100 High Street, Sydney NSW 2000", required: false },
    { key: "organisation_complaints_email", label: "Their email address (if known)", type: "text", placeholder: "e.g. rentals@raywhite.com", required: false },
    { key: "complaint_handler_name", label: "Name of property manager or landlord", type: "text", placeholder: "e.g. Sarah Jones — Property Manager", required: false },
    { key: "account_number", label: "Lease/tenancy reference number (if applicable)", type: "text", placeholder: "e.g. LEASE-2024-001", required: false },
    { key: "incident_date", label: "Date the issue started", type: "date", placeholder: "", required: false },
    { key: "issue_type", label: "What type of tenancy issue?", type: "select", options: ["Repairs not done", "Bond dispute", "Termination notice", "Rent increase", "Privacy breach", "Harassment", "Other"], required: true },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Landlord refusing to fix broken hot water for 3 weeks", required: true },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include property address, dates, what was reported, responses received...", required: true },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Repairs completed within 7 days, compensation for inconvenience", required: true },
  ],
  telco: [
    { key: "organisation_name", label: "Which provider?", type: "text", placeholder: "e.g. Optus, Telstra, Vodafone, TPG", required: true },
    { key: "organisation_complaints_address", label: "Provider's complaints postal address (if known)", type: "text", placeholder: "e.g. Locked Bag 9000, Haymarket NSW 1240", required: false },
    { key: "organisation_complaints_email", label: "Provider's complaints email (if known)", type: "text", placeholder: "e.g. complaints@optus.com.au", required: false },
    { key: "complaint_handler_name", label: "Name of the person handling your complaint (if known)", type: "text", placeholder: "e.g. Tom Lee — Customer Relations", required: false },
    { key: "account_number", label: "Account or service number", type: "text", placeholder: "e.g. 0412 345 678 or Account #12345", required: false },
    { key: "incident_date", label: "Date the issue started", type: "date", placeholder: "", required: false },
    { key: "issue_type", label: "What type of issue?", type: "select", options: ["Billing error", "Contract dispute", "Service outage", "Poor service", "Cancellation issue", "Misleading conduct", "Other"], required: true },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Charged for services not received", required: true },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include account numbers, dates, amounts, conversations...", required: true },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Refund of overcharged amount, contract released", required: true },
  ],
  utilities: [
    { key: "organisation_name", label: "Which provider?", type: "text", placeholder: "e.g. AGL, Origin Energy, EnergyAustralia", required: true },
    { key: "organisation_complaints_address", label: "Provider's complaints postal address (if known)", type: "text", placeholder: "e.g. GPO Box 1234, Melbourne VIC 3001", required: false },
    { key: "organisation_complaints_email", label: "Provider's complaints email (if known)", type: "text", placeholder: "e.g. complaints@agl.com.au", required: false },
    { key: "complaint_handler_name", label: "Name of the person handling your complaint (if known)", type: "text", placeholder: "e.g. Mike Brown — Customer Resolutions", required: false },
    { key: "account_number", label: "Account number", type: "text", placeholder: "e.g. 7100123456", required: false },
    { key: "incident_date", label: "Date the issue started", type: "date", placeholder: "", required: false },
    { key: "issue_type", label: "What type of issue?", type: "select", options: ["Billing error", "Disconnection", "Meter issue", "Hardship", "Service failure", "Contract issue", "Other"], required: true },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Estimated bills significantly higher than actual usage", required: true },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include account numbers, billing periods, amounts, conversations...", required: true },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Correct billing based on actual meter reads, refund of excess", required: true },
  ],
  government: [
    { key: "organisation_name", label: "Which government department?", type: "text", placeholder: "e.g. Services Australia (Centrelink), Australian Taxation Office", required: true },
    { key: "organisation_complaints_address", label: "Department's complaints postal address (if known)", type: "text", placeholder: "e.g. GPO Box 9820, Sydney NSW 2001", required: false },
    { key: "organisation_complaints_email", label: "Department's complaints email (if known)", type: "text", placeholder: "e.g. complaints@servicesaustralia.gov.au", required: false },
    { key: "complaint_handler_name", label: "Name of the person handling your matter (if known)", type: "text", placeholder: "e.g. Sarah Jones — Case Officer", required: false },
    { key: "account_number", label: "Reference number (CRN, TFN, or file number)", type: "text", placeholder: "e.g. CRN: 123456789", required: false },
    { key: "incident_date", label: "Date the issue started", type: "date", placeholder: "", required: false },
    { key: "issue_type", label: "What type of issue?", type: "select", options: ["Payment delay", "Decision review", "Communication failure", "Incorrect assessment", "Service access", "Compliance issue", "Other"], required: true },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "e.g. Centrelink payment not received despite eligibility", required: true },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include reference numbers, dates, decisions made, conversations with the department...", required: true },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "e.g. Payment released, decision reviewed, apology", required: true },
  ],
  other: [
    { key: "organisation_name", label: "Which organisation?", type: "text", placeholder: "Company or organisation name", required: true },
    { key: "organisation_complaints_address", label: "Their complaints postal address (if known)", type: "text", placeholder: "e.g. 100 Main Street, Sydney NSW 2000", required: false },
    { key: "organisation_complaints_email", label: "Their complaints email (if known)", type: "text", placeholder: "e.g. complaints@company.com.au", required: false },
    { key: "complaint_handler_name", label: "Name of the person handling your complaint (if known)", type: "text", placeholder: "e.g. Sarah Jones — Customer Relations", required: false },
    { key: "account_number", label: "Account or reference number (if applicable)", type: "text", placeholder: "e.g. REF-123456", required: false },
    { key: "incident_date", label: "Date of the incident", type: "date", placeholder: "", required: false },
    { key: "issue_summary", label: "Briefly describe the issue", type: "text", placeholder: "What went wrong?", required: true },
    { key: "issue_details", label: "Full details", type: "textarea", placeholder: "Include all relevant dates, people, amounts and what you've already done...", required: true },
    { key: "desired_outcome", label: "What outcome do you want?", type: "textarea", placeholder: "What would make this right?", required: true },
  ],
};

export default function GuidedQuestions({ category, data, onChange, onNext, onBack, onCategoryDetected, isSubmitting = false }) {
  const specificFields = caseFields[category] || caseFields.other;
  const allQuestions = [...complainantFields, ...specificFields];
  const [step, setStep] = useState(0);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const current = allQuestions[step];

  const handleChange = (value) => {
    onChange({ ...data, [current.key]: value });
    // Auto-classify industry when organisation name is entered
    if (current.key === 'organisation_name' && value && onCategoryDetected) {
      const detected = detectIndustry({ organisation_name: value });
      if (detected && detected !== 'other') onCategoryDetected(detected);
    }
  };

  const handleOrgSelect = (org) => {
    onChange({
      ...data,
      organisation_name: org.name || data.organisation_name,
      organisation_complaints_address: org.complaints_address || data.organisation_complaints_address,
      organisation_complaints_email: org.complaints_email || data.organisation_complaints_email,
      complaint_handler_name: org.complaint_handler_name || data.complaint_handler_name,
    });
    setShowOrgPicker(false);
  };

  const canProceed = current.required ? !!data[current.key]?.trim() : true;

  const handleNext = () => {
    if (step < allQuestions.length - 1) {
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

  // Section label
  const isPersonalSection = step < complainantFields.length;
  const sectionLabel = isPersonalSection ? "Your Details" : "Case Details";

  return (
    <div className="space-y-8">
      {/* Section indicator */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-black px-4 py-2 rounded-xl ${isPersonalSection ? "bg-gradient-to-r from-accent/30 to-accent/40 text-accent border-2 border-accent/40" : "bg-gradient-to-r from-primary/30 to-primary/40 text-primary border-2 border-primary/40"}`}>
          {sectionLabel.toUpperCase()}
        </span>
        <span className="text-base font-black text-foreground">
          Question {step + 1} of {allQuestions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {allQuestions.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-primary to-secondary" : "bg-border"}`}
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-2xl font-heading font-black">
            {current.label}
            {current.required && <span className="text-destructive ml-2">*</span>}
          </Label>
          {current.key === "organisation_name" && (
            <button
              type="button"
              onClick={() => setShowOrgPicker((v) => !v)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Building2 className="w-3.5 h-3.5" /> Use saved org
            </button>
          )}
        </div>
        {current.key === "organisation_name" && showOrgPicker && (
          <OrgPicker category={category} onSelect={handleOrgSelect} onClose={() => setShowOrgPicker(false)} />
        )}
        {current.type === "text" && (
          <Input
            value={data[current.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={current.placeholder}
            className="text-lg font-bold h-14"
          />
        )}
        {current.type === "date" && (
          <Input
            type="date"
            value={data[current.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="text-lg font-bold h-14"
          />
        )}
        {current.type === "textarea" && (
          <Textarea
            value={data[current.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={current.placeholder}
            rows={6}
            className="text-lg font-bold leading-relaxed"
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
        {!current.required && (
          <p className="text-[11px] text-muted-foreground">Optional — skip if not available</p>
        )}
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={handleBack} className="gap-2 h-14 px-8 text-lg font-black border-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed || (step === allQuestions.length - 1 && isSubmitting)}
          className="gap-2 h-14 px-8 text-lg font-black bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/30"
        >
          {step < allQuestions.length - 1 ? (
            <>Continue <ArrowRight className="w-5 h-5" /></>
          ) : isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Creating case…</>
          ) : (
            <>Create Case Now <ArrowRight className="w-5 h-5" /></>
          )}
        </Button>
      </div>
    </div>
  );
}