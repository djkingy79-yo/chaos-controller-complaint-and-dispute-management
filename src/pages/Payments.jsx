import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Shield, Trophy, Star, Copy, Check, Mail, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const PAYID_EMAIL = "djkingy79@gmail.com";

const plans = [
  {
    id: "take_control",
    name: "Take Control",
    icon: Zap,
    price: 19,
    period: "month",
    badge: null,
    color: "border-border",
    btnClass: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    features: [
      "Up to 3 active cases",
      "Document upload & storage",
      "AI document identification",
      "Basic timeline builder",
      "Deadline tracker",
      "Smart checklist",
      "Escalation directory",
      "Calendar view",
    ],
  },
  {
    id: "chaos_controller",
    name: "Chaos Controller",
    icon: Shield,
    price: 49,
    period: "month",
    badge: "Most Popular",
    color: "border-primary ring-2 ring-primary/20",
    btnClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    features: [
      "Unlimited active cases",
      "AI complaint letter generation",
      "AI rejection response letters",
      "Full timeline extraction",
      "Deadline War Room (all alerts)",
      "Evidence indexing & missing alerts",
      "PDF export with formatting",
      "Provider portal access",
      "Email notifications & reminders",
    ],
  },
  {
    id: "chaos_champion",
    name: "Chaos Champion",
    icon: Trophy,
    price: 99,
    period: "month",
    badge: "Full Arsenal",
    color: "border-accent ring-2 ring-accent/20",
    btnClass: "bg-accent text-accent-foreground hover:bg-accent/90",
    features: [
      "Everything in Chaos Controller",
      "Escalation package builder",
      "AI executive timeline reports",
      "Authority-to-act document prep",
      "Admin command centre",
      "Priority AI processing",
      "Priority support",
      "Early access to new features",
    ],
  },
];

function PayIDModal({ plan, onClose }) {
  const [copied, setCopied] = useState(false);
  const ref = `CC-${plan.id.toUpperCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground">Pay via PayID</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Send your payment using PayID through your banking app
          </p>
        </div>

        <div className="space-y-4">
          {/* Plan summary */}
          <div className="bg-secondary/40 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Plan Selected</p>
            <p className="font-bold text-foreground">{plan.name}</p>
            <p className="text-2xl font-display font-bold text-primary mt-1">${plan.price}<span className="text-sm text-muted-foreground font-normal">/month</span></p>
          </div>

          {/* PayID details */}
          <div className="space-y-3">
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">PayID (Email)</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{PAYID_EMAIL}</span>
                </div>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs px-2" onClick={() => copy(PAYID_EMAIL)}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                </Button>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">${plan.price}.00 AUD</span>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs px-2" onClick={() => copy(`${plan.price}.00`)}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Reference (important)</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground font-mono">{ref}</span>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs px-2" onClick={() => copy(ref)}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">How to pay:</p>
            <p>1. Open your banking app and go to <strong>Pay / Transfer</strong></p>
            <p>2. Select <strong>PayID</strong> and enter the email above</p>
            <p>3. Enter the exact amount and reference</p>
            <p>4. Submit — your account will be activated within 24 hours</p>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            After paying, email <a href={`mailto:${PAYID_EMAIL}`} className="text-primary underline">{PAYID_EMAIL}</a> with your reference and registered email to activate your account.
          </p>
        </div>

        <Button variant="ghost" className="w-full mt-4 text-sm" onClick={onClose}>Close</Button>
      </motion.div>
    </motion.div>
  );
}

export default function Payments() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Take Back Control</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Choose the plan that matches the scale of your fight. Pay monthly via PayID — no credit card required.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => {
          const PlanIcon = plan.icon;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card rounded-2xl border-2 ${plan.color} p-6 flex flex-col relative`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground border-0 px-3 py-1 text-xs font-semibold">
                    <Star className="w-3 h-3 mr-1" /> {plan.badge}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-secondary">
                  <PlanIcon className="w-5 h-5 text-foreground" />
                </div>
                <h2 className="font-display font-bold text-foreground">{plan.name}</h2>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full font-medium ${plan.btnClass}`} onClick={() => setSelectedPlan(plan)}>
                Get Started — Pay via PayID
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">Pay monthly. Cancel anytime.</p>
            </motion.div>
          );
        })}
      </div>

      {/* PayID callout */}
      <div className="max-w-5xl mx-auto bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl shrink-0">
          <Smartphone className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Payments via PayID</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We accept payments via PayID (bank transfer) — safe, instant, no card required. 
            PayID: <strong className="text-foreground">{PAYID_EMAIL}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-secondary/30 rounded-xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Need help choosing?</strong> All plans include access to the Escalation Directory and basic case management. Upgrade anytime as your case progresses.
        </p>
      </div>

      <div className="max-w-5xl mx-auto text-xs text-muted-foreground italic text-center px-4">
        Chaos Controller provides educational, organisational and document management assistance only. It does not provide legal advice. The creator is not a lawyer or legal practitioner. Users should seek assistance from a qualified legal professional.
      </div>

      <AnimatePresence>
        {selectedPlan && <PayIDModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
      </AnimatePresence>
    </div>
  );
}