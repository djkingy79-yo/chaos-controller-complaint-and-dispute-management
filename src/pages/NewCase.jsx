import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, ArrowLeft, Upload, DollarSign, Wallet, Lock } from "lucide-react";
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
  other: "Relevant ombudsman or tribunal",
};

const PLANS = [
  { name: "Starter", price: "$25.00", desc: "Single dispute", features: ["3 active cases", "AI doc scanning", "1st complaint letter", "Deadline tracker", "PDF export"] },
  { name: "Pro", price: "$35.00", desc: "Serious disputes", popular: true, features: ["Unlimited cases", "All 5 letters", "Tribunal bundles", "Calendar sync", "Smart checklist"] },
  { name: "Command", price: "$49.00", desc: "Maximum firepower", features: ["Everything in Pro", "All 6 letters incl. escalation", "Chaos Score", "ZIP bundle export", "Priority support"] },
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

  // steps: 0=upload, 1=payment(if needed), 2=category, 3=questions, 4=generating, 5=review
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
      return newCase;
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      navigate(`/case/${newCase.id}?tab=evidence`);
    },
  });

  const handleUploadComplete = (files) => {
    setUploadedFiles(files);
    setStep(hasSubscription ? 2 : 1);
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

  const stepLabels = hasSubscription
    ? ["Upload", "Category", "Details", "Review"]
    : ["Upload", "Payment", "Category", "Details", "Review"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">New Case</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload → {hasSubscription ? "AI builds your case" : "Pay → AI builds your case"}</p>
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
      <div className="flex items-center gap-2 flex-wrap">
        {stepLabels.map((label, idx) => {
          // map visual index to actual step number
          const actualStep = hasSubscription
            ? [0, 2, 3, 5][idx]
            : [0, 1, 2, 3, 5][idx];
          const active = step >= actualStep;
          const done = step > actualStep;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {idx < stepLabels.length - 1 && <div className={`w-6 h-0.5 ${done ? "bg-primary" : "bg-secondary"}`} />}
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

        {/* Step 1: Payment Gate (only if no active subscription) */}
        {step === 1 && (
          <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Subscription Required</p>
                <p className="text-sm text-muted-foreground mt-0.5">Purchase a plan via PayID to create your case.</p>
              </div>
            </div>

            {PLANS.map(plan => (
              <div key={plan.name} className={`rounded-xl border-2 p-4 bg-card ${plan.popular ? "border-[#FFD700]" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{plan.name}</p>
                      {plan.popular && <span className="text-xs bg-[#FFD700] text-black font-bold px-2 py-0.5 rounded">POPULAR</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{plan.desc}</p>
                    <ul className="space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xl font-black text-primary shrink-0">{plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                </div>
              </div>
            ))}

            <div className="bg-card border border-border rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Wallet className="w-4 h-4 text-primary" /> Pay via PayID</h3>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground text-xs">PayID Email:</span>
                <code className="flex-1 bg-secondary px-3 py-2 rounded font-mono text-foreground text-xs">{PAYID_EMAIL}</code>
              </div>
              <p className="text-xs text-muted-foreground">Send your chosen plan amount to this PayID. Use your email as the description. Our team verifies within a few hours.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/payments">Full Payment Details</Link>
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1 gap-2">
                <CheckCircle2 className="w-4 h-4" /> I've Sent Payment — Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CategorySelector selected={category} onSelect={(val) => { setCategory(val); setStep(3); }} />
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
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-foreground">Preparing Your Complaint</h3>
            <p className="text-sm text-muted-foreground mt-1">Our AI is drafting a professional letter...</p>
          </motion.div>
        )}

        {/* Step 5: Review */}
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
                    {uploadedFiles.length} doc{uploadedFiles.length !== 1 ? "s" : ""} ready
                  </div>
                )}
              </div>
              <pre className="whitespace-pre-wrap text-sm font-body bg-secondary/50 rounded-lg p-4 leading-relaxed">
                {complaintLetter}
              </pre>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h3 className="font-heading font-semibold text-sm text-foreground">Case Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Complainant", value: formData.complainant_name },
                  { label: "Organisation", value: formData.organisation_name },
                  { label: "Industry", value: category },
                  { label: "Issue Type", value: formData.issue_type },
                  { label: "Account No.", value: formData.account_number },
                  { label: "Incident Date", value: formData.incident_date },
                ].filter(item => item.value).map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <p className="font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Edit Answers
              </Button>
              <Button onClick={handleCreate} disabled={createCaseMutation.isPending} className="flex-1 gap-2">
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