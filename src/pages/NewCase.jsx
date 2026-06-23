import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CategorySelector from "@/components/cases/CategorySelector";
import GuidedQuestions from "@/components/cases/GuidedQuestions";
import DocumentUploadStep from "@/components/cases/DocumentUploadStep";
import { useAuth } from "@/lib/AuthContext";
import { getActiveSubscription } from "@/lib/subscription";
import { detectIndustry, getEscalationBody } from "@/lib/industryClassifier";
import { toast } from "sonner";

const PAYID_EMAIL = "djkingy79@gmail.com";

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

  // steps: 0=upload, 2=category, 3=questions
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleUploadComplete = async (files, detectedCategory) => {
    setUploadedFiles(files);
    if (detectedCategory) {
      setCategory(detectedCategory);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleCreate = async () => {
    // Hard guard — block all repeat submissions
    if (isCreating) return;
    setIsCreating(true);

    try {
      const detectedCategory = detectIndustry(formData) !== 'other' ? detectIndustry(formData) : category;
      const finalCategory = detectedCategory || category || 'other';
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 21);

      // --- Idempotency: generate a unique request ID for this attempt ---
      const creationRequestId = crypto.randomUUID();

      // --- Duplicate guard: same user + same org + same issue within 5 minutes ---
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const recentCases = await base44.entities.Case.filter({ created_by_id: user?.id });
      const duplicate = recentCases.find(c =>
        c.organisation_name?.toLowerCase() === (formData.organisation_name || "").toLowerCase() &&
        c.issue_summary?.toLowerCase() === (formData.issue_summary || "").toLowerCase() &&
        new Date(c.created_date) > new Date(fiveMinutesAgo)
      );
      if (duplicate) {
        console.warn('[NewCase] Duplicate detected — navigating to existing case:', duplicate.id);
        queryClient.invalidateQueries({ queryKey: ["cases"] });
        navigate(`/case/${duplicate.id}?tab=letters`);
        return;
      }

      // --- Create the case record immediately ---
      const newCase = await base44.entities.Case.create({
        title: `${formData.issue_type || finalCategory} — ${formData.organisation_name || "Unknown"}`,
        category: finalCategory,
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
        response_deadline: deadline.toISOString().split("T")[0],
        escalation_body: getEscalationBody(finalCategory),
        priority: "medium",
        notes: `${uploadedFiles.length} document${uploadedFiles.length !== 1 ? "s" : ""} uploaded`,
        creation_request_id: creationRequestId,
      });

      // --- Navigate IMMEDIATELY — do not wait for background tasks ---
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      navigate(`/case/${newCase.id}?tab=letters`);

      // --- Background: link evidence and kick off AI tasks (fire-and-forget) ---
      if (uploadedFiles.length > 0) {
        base44.entities.Evidence.bulkCreate(
          uploadedFiles.map((file) => ({ ...file, case_id: newCase.id, scan_status: "pending" }))
        ).catch(err => console.error('[NewCase] Evidence link failed:', err));
      }
      base44.functions.invoke('generateAIChecklist', { caseId: newCase.id })
        .catch(err => console.error('[NewCase] Checklist generation failed:', err));

    } catch (error) {
      console.error('[NewCase] Case creation failed:', error);
      toast.error('Case could not be saved. Please try again.');
    } finally {
      setIsCreating(false);
    }
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
            <GuidedQuestions
              category={category}
              data={formData}
              onChange={setFormData}
              onNext={handleCreate}
              onBack={() => setStep(2)}
              onCategoryDetected={(detected) => setCategory(detected)}
              isSubmitting={isCreating}
            />
          </motion.div>
        )}


      </AnimatePresence>
    </div>
  );
}