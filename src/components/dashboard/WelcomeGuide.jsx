import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Clock, FileText, Shield, CheckCircle, ArrowRight, Upload, ScanLine, Zap } from "lucide-react";
import { CARD_FRONT } from "@/components/cases/LetterheadBanner";

export default function WelcomeGuide({ cases }) {
  const steps = [
    {
      icon: Plus,
      title: "1. Start a Case",
      description: "Tell us what happened. Select your industry category and answer guided questions about your dispute.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Upload,
      title: "2. Upload Evidence",
      description: "Drop documents into the Evidence Vault — emails, contracts, photos, statements. Upload multiple files at once.",
      color: "bg-success/10 text-success",
      badge: "Multi-file upload enabled",
    },
    {
      icon: ScanLine,
      title: "3. AI Analysis",
      description: "AI scans every document automatically — extracting names, account numbers, dates, and building your timeline.",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: FileText,
      title: "4. Generate Complaint Letter",
      description: "AI drafts a professional complaint letter using your case details. Edit, regenerate, or print instantly.",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: Clock,
      title: "5. Track Deadlines",
      description: "Response deadlines, escalation windows, tribunal dates — never miss a critical date.",
      color: "bg-destructive/10 text-destructive",
    },
    {
      icon: Shield,
      title: "6. Escalate with Confidence",
      description: "Print complete escalation bundles for AFCA, NCAT, TIO, and all tribunals. Professional formatting guaranteed.",
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <img src={CARD_FRONT} alt="Chaos Controller" className="w-full max-w-md mx-auto mb-6 rounded-lg shadow-lg" />
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
          Who's causing the chaos?
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-6">
          Come in furious. Leave organised. Transform confusion into control with professional dispute management.
        </p>
        <Link to="/new-case">
          <Button size="lg" className="gap-2 font-medium">
            <Plus className="w-5 h-5" />
            Start Your First Case
          </Button>
        </Link>
      </div>

      {/* How It Works */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-foreground text-center">How Chaos Controller Works</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto">
          Six steps from fury to resolution. Every tool you need to build an airtight case.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center mb-3`}>
                  <StepIcon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.badge && (
                  <div className="mt-3">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      ✓ {step.badge}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Vault Status */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground mb-2">Evidence Vault Status: Operational</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The Evidence Vault is fully operational. Upload multiple documents at once — AI scans each file automatically to extract key details and build your case timeline.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Multi-file upload
              </span>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> AI document scanning
              </span>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Auto-timeline generation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <h3 className="font-heading font-semibold text-foreground mb-2">Ready to start?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your first case takes just minutes. We'll guide you through every step.
        </p>
        <Link to="/new-case">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Case
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}