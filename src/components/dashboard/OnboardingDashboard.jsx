import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, ScanLine, Clock, Shield, CheckCircle, ArrowRight } from "lucide-react";

export default function OnboardingDashboard() {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate("/new-case");
  };

  const steps = [
    {
      icon: Upload,
      title: "Upload Everything",
      description: "Bank statements, emails, lease agreements, termination letters - upload all documents related to your dispute.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: ScanLine,
      title: "AI Extraction",
      description: "AI scans every document automatically - pulling out account numbers, dates, names, and key details.",
      color: "bg-success/10 text-success",
    },
    {
      icon: FileText,
      title: "Fill the Gaps",
      description: "AI identifies missing information and prompts you for what's needed to build a strong case.",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: Clock,
      title: "Timeline Built",
      description: "Your case timeline auto-generates from extracted dates and events.",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: Shield,
      title: "Next Steps Clear",
      description: "Checklist shows exactly what to do next. Generate complaint letter when ready.",
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Branding */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center overflow-hidden relative"
      >
        <div className="relative z-10">
          <img 
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/c958c2bba_0981DD92-6950-41DB-A349-D1DD688641B5.png" 
            alt="Chaos Controller" 
            className="w-full max-w-3xl mx-auto mb-6 rounded-lg shadow-2xl object-contain" 
          />
        </div>
      </motion.div>

      {/* Upload First CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-3">
            Step 1: Upload Your Evidence
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Don't start with forms. Start with documents. Upload everything you have - AI will extract the details and build your case structure.
          </p>
        </div>

        {/* Document Types */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl">
            <FileText className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium text-foreground text-center">Bank Statements</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl">
            <FileText className="w-6 h-6 text-success" />
            <span className="text-xs font-medium text-foreground text-center">Emails</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl">
            <FileText className="w-6 h-6 text-warning" />
            <span className="text-xs font-medium text-foreground text-center">Lease Agreements</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl">
            <FileText className="w-6 h-6 text-destructive" />
            <span className="text-xs font-medium text-foreground text-center">Termination Letters</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl">
            <FileText className="w-6 h-6 text-accent" />
            <span className="text-xs font-medium text-foreground text-center">Insurance Claims</span>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={handleUploadClick} size="lg" className="gap-2 text-sm sm:text-base px-6 sm:px-8">
            <Upload className="w-5 h-5" />
            Upload Documents & Start Case
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Upload first. AI extracts the details. You fill in the gaps. We build your case.
          </p>
        </div>
      </motion.div>

      {/* How It Works Steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-foreground text-center">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center mb-3`}>
                  <StepIcon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Evidence Vault Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-success/10 border border-success/30 rounded-xl p-5"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-success/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground mb-2">Evidence Vault: Ready</h3>
            <p className="text-sm text-muted-foreground">
              Multi-file upload enabled. AI scanning automatic. Timeline generation instant.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                ✓ Batch Upload
              </span>
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                ✓ AI Extraction
              </span>
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                ✓ Auto-Timeline
              </span>
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-medium">
                ✓ Gap Detection
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Strip */}
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <p className="text-xs sm:text-sm font-bold text-foreground tracking-wide">
          UPLOAD YOUR STORY. BUILD YOUR EVIDENCE. TAKE BACK CONTROL.
        </p>
      </div>
    </div>
  );
}