import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CategorySelector from "@/components/cases/CategorySelector";
import GuidedQuestions from "@/components/cases/GuidedQuestions";

const escalationBodies = {
  banking: "Australian Financial Complaints Authority (AFCA)",
  insurance: "Australian Financial Complaints Authority (AFCA)",
  tenancy: "NSW Civil and Administrative Tribunal (NCAT)",
  telco: "Telecommunications Industry Ombudsman (TIO)",
  utilities: "Energy & Water Ombudsman",
  other: "Relevant ombudsman or tribunal",
};

export default function NewCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); // 0=category, 1=questions, 2=review, 3=generating
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({});
  const [complaintLetter, setComplaintLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      navigate(`/case/${newCase.id}`);
    },
  });

  const generateComplaint = async () => {
    setIsGenerating(true);
    setStep(3);
    const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute.

COMPLAINANT DETAILS (use these directly — no placeholders for any provided field):
- Name: ${formData.complainant_name || "[COMPLAINANT NAME]"}
- Address: ${formData.complainant_address || "[COMPLAINANT ADDRESS]"}
- Email: ${formData.complainant_email || "[COMPLAINANT EMAIL]"}
- Phone: ${formData.complainant_phone || "[COMPLAINANT PHONE]"}
- Account/Reference Number: ${formData.account_number || "not provided"}
- Date of Incident: ${formData.incident_date || "not provided"}

ORGANISATION DETAILS:
- Name: ${formData.organisation_name || "Unknown"}
- Complaints Address: ${formData.organisation_complaints_address || "Complaints Department, [Organisation Address]"}
- Complaints Email: ${formData.organisation_complaints_email || ""}
- Complaint Handler: ${formData.complaint_handler_name || "The Complaints Manager"}

CASE DETAILS:
Category: ${category}
Issue Summary: ${formData.issue_summary || ""}
Full Details: ${formData.issue_details || ""}
Desired Outcome: ${formData.desired_outcome || ""}
Issue Type: ${formData.issue_type || ""}

INSTRUCTIONS:
- Open with the complainant's full address block (right-aligned) and the date.
- Address to: ${formData.complaint_handler_name ? formData.complaint_handler_name + "," : "The Complaints Manager,"} ${formData.organisation_name || "the organisation"}.
- If an organisation complaints address was provided, include it as the recipient address block before the salutation.
- Include the account/reference number in the opening paragraph.
- Reference the exact incident date prominently.
- Write a professional, firm but polite complaint letter in formal business letter format.
- Include a 21-day response deadline and mention ${escalationBodies[category]} as the next escalation step if unresolved.
- Use real details — no placeholder brackets for any field provided above.
- Close with the complainant's full name.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setComplaintLetter(result);
    setIsGenerating(false);
    setStep(2);
  };

  const handleCreate = () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 21);

    createCaseMutation.mutate({
      title: `${formData.issue_type || category} — ${formData.organisation_name || "Unknown"}`,
      category,
      status: "draft",
      organisation_name: formData.organisation_name || "",
      organisation_complaints_address: formData.organisation_complaints_address || "",
      organisation_complaints_email: formData.organisation_complaints_email || "",
      complaint_handler_name: formData.complaint_handler_name || "",
      complainant_name: formData.complainant_name || "",
      complainant_address: formData.complainant_address || "",
      complainant_email: formData.complainant_email || "",
      complainant_phone: formData.complainant_phone || "",
      account_number: formData.account_number || "",
      incident_date: formData.incident_date || "",
      issue_summary: formData.issue_summary || "",
      issue_details: formData.issue_details || "",
      desired_outcome: formData.desired_outcome || "",
      complaint_letter: complaintLetter,
      response_deadline: deadline.toISOString().split("T")[0],
      escalation_body: escalationBodies[category] || "",
      priority: "medium",
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">
          {step === 0 ? "Who are we holding accountable?" : "New Case"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 0 && "Select your battle. The right pathway opens automatically."}
          {step === 1 && "Answer a few questions. We'll build the paper trail."}
          {step === 2 && "Review your complaint letter and activate your case."}
          {step === 3 && "AI is drafting your professional complaint letter..."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CategorySelector selected={category} onSelect={(val) => { setCategory(val); setStep(1); }} />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GuidedQuestions
              category={category}
              data={formData}
              onChange={setFormData}
              onNext={generateComplaint}
              onBack={() => setStep(0)}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-foreground">Preparing Your Complaint</h3>
            <p className="text-sm text-muted-foreground mt-1">Our AI is drafting a professional letter based on your information...</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-heading font-semibold text-sm">Complaint Letter Generated</span>
              </div>
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap text-sm font-body bg-secondary/50 rounded-lg p-4 leading-relaxed">
                  {complaintLetter}
                </pre>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h3 className="font-heading font-semibold text-sm text-foreground">Case Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium capitalize">{category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Organisation</span>
                  <p className="font-medium">{formData.organisation_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Escalation Body</span>
                  <p className="font-medium">{escalationBodies[category]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Response Deadline</span>
                  <p className="font-medium">21 days from send date</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Edit Answers
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createCaseMutation.isPending}
                className="flex-1 gap-2"
              >
                {createCaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Case
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}