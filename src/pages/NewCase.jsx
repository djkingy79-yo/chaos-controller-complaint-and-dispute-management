import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, ArrowLeft, Upload, Lock, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CategorySelector from "@/components/cases/CategorySelector";
import GuidedQuestions from "@/components/cases/GuidedQuestions";
import DocumentUploadStep from "@/components/cases/DocumentUploadStep";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription } from "@/lib/subscription";

const PAYID_EMAIL = "djkingy79@gmail.com";

const escalationBodies = {
  banking: "Australian Financial Complaints Authority (AFCA)",
  insurance: "Australian Financial Complaints Authority (AFCA)",
  tenancy: "NSW Civil and Administrative Tribunal (NCAT)",
  telco: "Telecommunications Industry Ombudsman (TIO)",
  utilities: "Energy & Water Ombudsman",
  government: "Commonwealth Ombudsman",
  other: "Relevant ombudsman or tribunal",
};

const PLANS = [
  { name: "Starter", price: "$9.99", desc: "Single dispute", features: ["3 active cases", "AI doc scanning", "1st complaint letter", "Deadline tracker", "PDF export"] },
  { name: "Pro", price: "$15.99", desc: "Serious disputes", popular: true, features: ["Unlimited cases", "All 5 letters", "Tribunal bundles", "Calendar sync", "Smart checklist"] },
  { name: "Command", price: "$19.99", desc: "Maximum firepower", features: ["Everything in Pro", "All 6 letters incl. escalation", "Chaos Score", "ZIP bundle export", "Priority support"] },
];

export default function NewCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const activeSub = getActiveSubscription(user, payments);
  const hasSubscription = !!activeSub;

  // steps: 0=upload, 2=category, 3=questions, 4=generating, 5=review
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [complaintLetter, setComplaintLetter] = useState("");

  const createCaseMutation = useMutation({
    mutationFn: async (data) => {
      const newCase = await base44.entities.Case.create(data);
      if (uploadedFiles.length > 0) {
        await base44.entities.Evidence.bulkCreate(
          uploadedFiles.map((file) => ({ ...file, case_id: newCase.id, scan_status: "pending" }))
        );
      }
      // Auto-generate AI checklist
      try {
        await base44.functions.invoke('generateAIChecklist', { caseId: newCase.id });
      } catch (err) {
        console.error('Failed to auto-generate checklist:', err);
      }
      return newCase;
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      navigate(`/case/${newCase.id}?tab=checklist`);
    },
  });

  const handleUploadComplete = async (files, detectedCategory) => {
    setUploadedFiles(files);
    // Auto-set category if detected
    if (detectedCategory) {
      setCategory(detectedCategory);
      // Skip category selection, go straight to questions
      setStep(3);
    } else {
      // No category detected, show category selector
      setStep(2);
    }
  };

  const generateComplaint = async () => {
    setStep(4);
    const f = formData;
    const today = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });

    const complainantBlock = [f.complainant_name, f.complainant_address, f.complainant_email ? `Email: ${f.complainant_email}` : null, f.complainant_phone ? `Mobile: ${f.complainant_phone}` : null, today].filter(Boolean).join("\n");
    const recipientBlock = [f.complaint_handler_name || "The Complaints Manager", f.organisation_name, f.organisation_complaints_address || null, f.organisation_complaints_email ? `Email: ${f.organisation_complaints_email}` : null].filter(Boolean).join("\n");

    const prompt = `You are a professional consumer advocacy assistant in Australia. Generate a formal complaint letter for this dispute. Use Australian English spelling throughout (e.g. organise, recognise, behaviour, honour, colour).

CRITICAL RULE: NEVER use bracket placeholders like [Name], [Address], [Date] or similar. If a detail is not provided, omit that line entirely.

COMPLAINANT BLOCK (top-right of letter):
${complainantBlock}

RECIPIENT BLOCK (left side, below complainant block):
${recipientBlock}

CASE DETAILS:
- Industry: ${category}
- Issue Type: ${f.issue_type || ""}
- Account/Reference Number: ${f.account_number || "not provided — omit"}
- Incident Date: ${f.incident_date || "not provided — omit"}
- Issue Summary: ${f.issue_summary || ""}
- Full Details: ${f.issue_details || ""}
- Desired Outcome: ${f.desired_outcome || ""}

LETTER INSTRUCTIONS:
1. Format as a formal business letter.
2. Re: line — e.g. "Re: Formal Complaint — ${f.account_number ? "Account " + f.account_number : f.issue_summary || f.issue_type || category}"
3. Salutation: "Dear ${f.complaint_handler_name || "Sir/Madam"},"
4. Detail the issue firmly. Give a 21-day deadline from today (${today}).
5. Mention ${escalationBodies[category]} as next step if unresolved.
6. Close: "Yours faithfully," then ${f.complainant_name || "the complainant's name"}.
7. NEVER write bracket placeholders.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setComplaintLetter(result);
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
      notes: `${uploadedFiles.length} document${uploadedFiles.length !== 1 ? "s" : ""} uploaded`,
    });
  };

  const stepLabels = ["Upload", "Category", "Details", "Review"];

  // Hard gate — show plan selection if no active subscription
  if (!hasSubscription && user) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="font-heading font-black text-2xl text-foreground mb-2">Subscription Required</h2>
          <p className="text-muted-foreground text-sm">You need an active plan to create a new case. Choose a plan and complete your PayID payment to get started.</p>
        </div>
        <div className="grid gap-3">
          {PLANS.map(plan => (
            <button
              key={plan.name}
              onClick={() => navigate(`/payments?plan=${plan.name}`)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left hover:border-primary/50 transition-all bg-card ${plan.popular ? "border-yellow-500/50" : "border-border"}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{plan.name}</span>
                  {plan.popular && <span className="text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded">POPULAR</span>}
                  <span className="text-primary font-black ml-auto">{plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 border-2 border-primary/30 rounded-2xl p-6 mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
        <div className="relative flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-12 w-12 rounded-xl border-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-xs font-black text-primary uppercase tracking-wider mb-1">Create New Case</p>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-foreground leading-tight">New Case</h1>
            <p className="text-base text-muted-foreground mt-1 font-bold">Upload → AI builds your case → You take control</p>
          </div>
        </div>
      </div>

      {/* Active subscription badge */}
      {hasSubscription && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold">{activeSub.plan_name} plan active</span>
          <span className="text-muted-foreground">— subscription verified</span>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center gap-3 flex-wrap bg-card border-2 border-border rounded-2xl p-4">
        {stepLabels.map((label, idx) => {
          const actualStep = [0, 2, 3, 5][idx];
          const active = step >= actualStep;
          const done = step > actualStep;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border-2 ${
                  done ? "bg-primary text-white border-primary" :
                  active ? "bg-primary/10 text-primary border-primary" :
                  "bg-secondary text-muted-foreground border-border"
                }`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-sm font-black ${active ? "text-foreground" : "text-muted-foreground"}`}>{label.toUpperCase()}</span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div className={`w-8 h-1 rounded-full ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Upload */}
        {step === 0 && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DocumentUploadStep onContinue={handleUploadComplete} onBack={() => navigate(-1)} />
          </motion.div>
        )}

        {/* Step 2: Category selection (shown only if AI couldn't detect category) */}
        {step === 2 && (
          <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-4">
              {category && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-bold text-blue-500">AI Auto-Selected Category</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on your uploaded documents, AI selected <strong className="text-foreground capitalize">{category}</strong>. 
                    If this is incorrect, please choose the right category below.
                  </p>
                </div>
              )}
              <CategorySelector selected={category} onSelect={(val) => { setCategory(val); setStep(3); }} />
            </div>
          </motion.div>
        )}

        {/* Step 3: Guided Questions */}
        {step === 3 && (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GuidedQuestions category={category} data={formData} onChange={setFormData} onNext={generateComplaint} onBack={() => setStep(2)} />
          </motion.div>
        )}

        {/* Step 4: Generating */}
        {step === 4 && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
            <div className="relative mb-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
              </div>
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">AI Is Building Your Case</h3>
            <p className="text-sm text-muted-foreground font-medium">Generating professional complaint letter...</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <motion.div key="review" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-success/15 to-green-500/10 border-2 border-success/40 rounded-2xl p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-bl-full" />
              <div className="relative flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-success/30 to-success/40 rounded-xl shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-foreground text-3xl">Complaint Letter Generated</h2>
                  <p className="text-base text-foreground font-bold mt-1">Review your professional complaint letter</p>
                </div>
              </div>
              <div className="bg-white border-2 border-border rounded-xl p-6 shadow-inner">
                <pre className="whitespace-pre-wrap text-base font-body leading-relaxed text-foreground">
                  {complaintLetter}
                </pre>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-xl">
              <h3 className="font-heading font-black text-2xl text-foreground mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                Case Summary
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { label: "Complainant", value: formData.complainant_name },
                  { label: "Organisation", value: formData.organisation_name },
                  { label: "Industry", value: category },
                  { label: "Issue Type", value: formData.issue_type },
                  { label: "Account No.", value: formData.account_number },
                  { label: "Incident Date", value: formData.incident_date },
                ].filter(item => item.value).map(({ label, value }) => (
                  <div key={label} className="p-4 bg-secondary/30 rounded-xl border border-border">
                    <span className="text-sm font-black text-muted-foreground uppercase tracking-wider">{label}</span>
                    <p className="text-lg font-black text-foreground mt-1 capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2 h-14 px-8 text-lg font-black border-2">
                <ArrowLeft className="w-5 h-5" /> Edit Answers
              </Button>
              <Button onClick={handleCreate} disabled={createCaseMutation.isPending} className="flex-1 gap-2 h-14 text-lg font-black bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/30">
                {createCaseMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                Create Case
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}