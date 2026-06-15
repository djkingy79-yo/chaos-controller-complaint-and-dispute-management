import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, ArrowLeft, Upload, DollarSign, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CategorySelector from "@/components/cases/CategorySelector";
import GuidedQuestions from "@/components/cases/GuidedQuestions";
import DocumentUploadStep from "@/components/cases/DocumentUploadStep";

const PAYID_EMAIL = "djkingy79@gmail.com";

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
  const [step, setStep] = useState(0); // 0=upload, 1=payment, 2=category, 3=questions, 4=generating, 5=review
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [complaintLetter, setComplaintLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const createCaseMutation = useMutation({
    mutationFn: async (data) => {
      const newCase = await base44.entities.Case.create(data);
      if (uploadedFiles.length > 0) {
        await base44.entities.Evidence.bulkCreate(
          uploadedFiles.map((file) => ({
            ...file,
            case_id: newCase.id,
            scan_status: "pending",
          }))
        );
      }
      return newCase;
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      navigate(`/case/${newCase.id}?tab=evidence`);
    },
  });

  const handleUploadComplete = (files) => {
    setUploadedFiles(files);
    setStep(1);
  };

  const handlePaymentConfirm = () => {
    setStep(2);
  };

  const generateComplaint = async () => {
    setIsGenerating(true);
    setStep(4);
    const f = formData;
    const today = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });

    const complainantBlock = [
      f.complainant_name,
      f.complainant_address,
      f.complainant_email ? `Email: ${f.complainant_email}` : null,
      f.complainant_phone ? `Mobile: ${f.complainant_phone}` : null,
      today,
    ].filter(Boolean).join("\n");

    const recipientBlock = [
      f.complaint_handler_name || "The Complaints Manager",
      f.organisation_name,
      f.organisation_complaints_address || null,
      f.organisation_complaints_email ? `Email: ${f.organisation_complaints_email}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute.

CRITICAL RULE: NEVER use bracket placeholders like [Name], [Address], [Date] or similar. If a detail is not provided, omit that line entirely and write naturally without it.

COMPLAINANT BLOCK (top-right of letter):
${complainantBlock}

RECIPIENT BLOCK (left side, below complainant block):
${recipientBlock}

CASE DETAILS:
- Industry: ${category}
- Issue Type: ${f.issue_type || ""}
- Account/Reference Number: ${f.account_number || "not provided — omit from letter"}
- Incident Date: ${f.incident_date || "not provided — omit specific date reference"}
- Issue Summary: ${f.issue_summary || ""}
- Full Details: ${f.issue_details || ""}
- Desired Outcome: ${f.desired_outcome || ""}

LETTER INSTRUCTIONS:
1. Format as a formal business letter with complainant block top-right, date below it, then recipient block on the left.
2. Re: line — e.g. "Re: Formal Complaint — ${f.account_number ? "Account " + f.account_number : f.issue_summary || f.issue_type || category}"
3. Salutation: "Dear ${f.complaint_handler_name || "Sir/Madam"},"
4. Opening paragraph: state the nature of the complaint, include account number and incident date ONLY if provided above.
5. Middle paragraphs: detail the issue using the full details provided. Be specific and firm.
6. Demand paragraph: state the desired outcome clearly and give a 21-day deadline from today (${today}).
7. Escalation: mention ${escalationBodies[category]} as the next step if not resolved.
8. Close: "Yours faithfully," then ${f.complainant_name || "the complainant's name"}.
9. NEVER write any bracket placeholder — omit the line if data is missing.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setComplaintLetter(result);
    setIsGenerating(false);
    setStep(5);
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
      notes: `${uploadedFiles.length} document${uploadedFiles.length !== 1 ? "s" : ""} uploaded for AI extraction`,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">New Case</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload → Pay → AI builds your case</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {["Upload", "Payment", "Category", "Details", "Review"].map((label, idx) => {
          const actualIdx = idx === 1 ? 1 : idx === 2 ? 2 : idx === 3 ? 3 : idx === 4 ? 5 : 0;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  (idx === 0 && step >= 0) || (idx === 1 && step >= 1) || (idx === 2 && step >= 2) || (idx === 3 && step >= 3) || (idx === 4 && step >= 5)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {((idx === 0 && step > 0) || (idx === 1 && step > 1) || (idx === 2 && step > 2) || (idx === 3 && step > 3) || (idx === 4 && step > 5)) ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  (idx === 0 && step >= 0) || (idx === 1 && step >= 1) || (idx === 2 && step >= 2) || (idx === 3 && step >= 3) || (idx === 4 && step >= 5)
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}>
                  {label}
                </span>
              </div>
              {idx < 4 && <div className={`w-8 h-0.5 ${
                (idx === 0 && step > 0) || (idx === 1 && step > 1) || (idx === 2 && step > 2) || (idx === 3 && step > 3)
                  ? "bg-primary"
                  : "bg-secondary"
              }`} />}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DocumentUploadStep
              onContinue={handleUploadComplete}
              onBack={() => navigate(-1)}
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground">Payment Required</h2>
                  <p className="text-sm text-muted-foreground">Activate your case with a subscription</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Select Your Plan</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border-2 border-primary bg-primary/5 rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">Pro Plan</p>
                      <p className="text-xs text-muted-foreground">Unlimited cases & features</p>
                    </div>
                    <p className="text-lg font-bold text-primary">$24.99/mo</p>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground mb-2">Pay via PayID</h3>
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Send to:</span>
                  <code className="flex-1 bg-black/20 px-3 py-2 rounded font-mono text-foreground">{PAYID_EMAIL}</code>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-foreground">$24.99</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ You must complete payment before proceeding. Your case will be activated instantly after payment confirmation.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate("/payments")} className="gap-2 flex-1">
                  View Payment Details
                </Button>
                <Button 
                  onClick={handlePaymentConfirm}
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  I've Made Payment
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CategorySelector selected={category} onSelect={(val) => { setCategory(val); setStep(3); }} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GuidedQuestions
              category={category}
              data={formData}
              onChange={setFormData}
              onNext={generateComplaint}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-foreground">Preparing Your Complaint</h3>
            <p className="text-sm text-muted-foreground mt-1">Our AI is drafting a professional letter based on your information...</p>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-heading font-semibold text-sm">Complaint Letter Generated</span>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadedFiles.length} document{uploadedFiles.length !== 1 ? "s" : ""} ready for AI scan
                  </div>
                )}
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
                {[
                  { label: "Complainant Name", value: formData.complainant_name },
                  { label: "Address", value: formData.complainant_address },
                  { label: "Email", value: formData.complainant_email },
                  { label: "Phone", value: formData.complainant_phone },
                  { label: "Industry", value: category },
                  { label: "Organisation", value: formData.organisation_name },
                  { label: "Account / Policy No.", value: formData.account_number },
                  { label: "Incident Date", value: formData.incident_date },
                  { label: "Issue Type", value: formData.issue_type },
                  { label: "Complaint Handler", value: formData.complaint_handler_name },
                  { label: "Escalation Body", value: escalationBodies[category] },
                  { label: "Response Deadline", value: "21 days from send date" },
                ].filter(item => item.value).map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <p className="font-medium capitalize">{value}</p>
                  </div>
                ))}
                {formData.issue_summary && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Issue Summary</span>
                    <p className="font-medium">{formData.issue_summary}</p>
                  </div>
                )}
                {formData.desired_outcome && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Desired Outcome</span>
                    <p className="font-medium">{formData.desired_outcome}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
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