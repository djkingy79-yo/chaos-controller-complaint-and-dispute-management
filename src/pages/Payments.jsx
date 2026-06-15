import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, CheckCircle2, ArrowLeft, Mail, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "$9.99",
    period: "/month",
    description: "For single disputes",
    features: ["1 active case", "Evidence vault (10 files)", "AI document scanning", "Complaint letter generation", "Timeline builder"],
    popular: false
  },
  {
    name: "Pro",
    price: "$24.99",
    period: "/month",
    description: "For multiple disputes",
    features: ["Unlimited cases", "Unlimited evidence files", "Priority AI scanning", "Escalation bundles", "Deadline reminders", "Calendar sync"],
    popular: true
  },
  {
    name: "Premium",
    price: "$49.99",
    period: "/month",
    description: "Maximum support",
    features: ["Everything in Pro", "Priority support", "Legal template library", "Case strength analytics", "Export to PDF bundles", "Multi-user access"],
    popular: false
  }
];

export default function Payments() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [copied, setCopied] = useState(false);

  const payidEmail = "djkingy79@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(payidEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Secure payment via PayID. Instant activation.</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            onClick={() => setSelectedPlan(plan)}
            className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 ${
              selectedPlan?.name === plan.name
                ? "border-primary bg-primary/5 shadow-xl shadow-primary/20"
                : "border-border bg-card hover:border-primary/50"
            } ${plan.popular ? "ring-2 ring-primary/30" : ""}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}
            
            <div className="text-center mb-6">
              <h3 className="font-heading font-bold text-xl mb-2">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground ml-1">{plan.period}</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${selectedPlan?.name === plan.name ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/80"}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {selectedPlan?.name === plan.name ? "Selected" : "Select Plan"}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Payment Instructions */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-border rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <h2 className="text-xl font-heading font-bold text-foreground">
              Payment Instructions for {selectedPlan.name} Plan
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Step 1: Send Payment via PayID</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>PayID Email:</span>
                  <code className="flex-1 bg-black/20 px-3 py-2 rounded-lg font-mono text-foreground">
                    {payidEmail}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span>Amount:</span>
                  <span className="font-semibold text-foreground text-lg">{selectedPlan.price}</span>
                  <span className="text-muted-foreground">{selectedPlan.period}</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 border border-border rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Step 2: Confirm Your Payment</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0">1</span>
                  <span>Open your banking app and select PayID</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0">2</span>
                  <span>Send payment to <strong className="text-foreground">{payidEmail}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0">3</span>
                  <span>Use your email address as the payment description</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0">4</span>
                  <span>Activation is instant - you'll be redirected to your dashboard</span>
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Your subscription activates immediately after payment confirmation.
              </p>
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-semibold">
                I've Sent Payment - Activate Now
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Support Info */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 text-center">
        <h3 className="font-heading font-semibold text-foreground mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Payment issues or questions about your subscription?
        </p>
        <a 
          href={`mailto:${payidEmail}`}
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          {payidEmail}
        </a>
      </div>
    </div>
  );
}