import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Shield, Trophy, Star } from "lucide-react";
import { motion } from "framer-motion";

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
      "Email notifications",
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

export default function Payments() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Take Back Control
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Choose the plan that matches the scale of your fight. Every plan comes with a 7-day free trial.
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
              <Button className={`w-full font-medium ${plan.btnClass}`}>
                Start Free Trial
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">7-day free trial. Cancel anytime.</p>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto bg-secondary/30 rounded-xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Need help choosing?</strong> All plans include access to the Escalation Directory and basic case management.
          Upgrade anytime as your case progresses.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="max-w-5xl mx-auto text-xs text-muted-foreground italic text-center px-4">
        Chaos Controller provides educational, organisational and document management assistance only. It does not provide legal advice. The creator is not a lawyer or legal practitioner. Users should seek assistance from a qualified legal professional.
      </div>
    </div>
  );
}