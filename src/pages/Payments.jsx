import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Copy, CheckCircle2, ArrowLeft, Mail, Smartphone, Wallet, Send, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ADMIN_EMAIL } from "@/lib/subscription";

const plans = [
  {
    name: "Starter",
    price: "$25.00",
    period: "AUD/month",
    description: "Perfect for a single dispute",
    features: [
      "3 active cases",
      "Evidence vault (25 files per case)",
      "AI document scanning & data extraction",
      "Professional complaint letter generator",
      "Automated case timeline builder",
      "Deadline tracker with reminders",
      "Access to full template library",
      "Export case summary to PDF"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "$35.00",
    period: "AUD/month",
    description: "For serious disputes & ongoing battles",
    features: [
      "Unlimited active cases",
      "Unlimited evidence files",
      "Priority AI scanning & smart extraction",
      "Tribunal-ready escalation bundles",
      "Google Calendar deadline sync",
      "Smart checklist with proof tracking",
      "Organisation contacts directory",
      "Direct ombudsman links (AFCA, TIO, NCAT)",
      "Chaos Score case strength tracker",
      "Email notifications for deadlines & updates"
    ],
    popular: true
  },
  {
    name: "Command",
    price: "$49.00",
    period: "AUD/month",
    description: "Maximum firepower for complex cases",
    features: [
      "Everything in Pro — unlimited",
      "Full letter template library with all categories",
      "Export full case bundle as ZIP",
      "Advanced timeline with event categorisation",
      "Case strength analytics & Chaos Score",
      "Multi-step guided complaint builder",
      "AI-powered evidence analysis",
      "Printable formal complaint bundles",
      "Priority email support from our team",
      "Early access to new features"
    ],
    popular: false
  }
];

export default function Payments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [copied, setCopied] = useState(false);
  const [payRef, setPayRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const payidEmail = "djkingy79@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(payidEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !user) return;
    setSubmitting(true);
    await base44.entities.PaymentRequest.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      plan_name: selectedPlan.name,
      amount: selectedPlan.price,
      payid_reference: payRef,
      status: "pending",
      subscription_active: false
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === "admin";

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <img
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png"
            alt="Chaos Controller Logo"
            className="w-24 h-24 mx-auto object-contain mb-6"
          />
          <div className="bg-[#FFD700]/10 border-2 border-[#FFD700] rounded-2xl p-10">
            <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-9 h-9 text-black" />
            </div>
            <h1 className="text-3xl font-display font-black text-white mb-2">Owner Access</h1>
            <p className="text-[#FFD700] font-bold text-lg mb-6">djkingy79@gmail.com</p>
            <div className="bg-black/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="w-6 h-6 text-[#FFD700]" />
                <span className="text-2xl font-display font-black text-[#FFD700]">Command Plan — FREE</span>
              </div>
              <p className="text-white font-bold mb-4">You have full access to all features across all 3 tiers:</p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {["Starter", "Pro", "Command"].map(plan => (
                  <div key={plan} className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3 text-center">
                    <CheckCircle2 className="w-5 h-5 text-[#FFD700] mx-auto mb-1" />
                    <span className="font-bold text-white">{plan}</span>
                    <span className="text-[#FFD700] text-xs block">✓ Unlocked</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-black px-10 py-6 text-lg"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Logo */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Choose Your Plan</h1>
            <p className="text-gray-400 mt-1 text-sm">Secure payment via PayID. Instant activation.</p>
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png"
            alt="Chaos Controller Logo"
            className="w-24 h-24 mx-auto object-contain"
          />
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              onClick={() => setSelectedPlan(plan)}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 bg-black ${
                selectedPlan?.name === plan.name
                  ? "border-[#FFD700] shadow-xl shadow-[#FFD700]/20"
                  : "border-gray-800 hover:border-[#FFD700]/50"
              } ${plan.popular ? "ring-2 ring-[#FFD700]/30" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black font-bold">
                  MOST POPULAR
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <h3 className="font-heading font-bold text-xl mb-2 text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-display font-bold text-[#FFD700]">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${selectedPlan?.name === plan.name ? "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                onClick={() => setSelectedPlan(plan)}
              >
                {selectedPlan?.name === plan.name ? "Selected" : "Select Plan"}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Payment Instructions */}
        {selectedPlan && (
          <div className="bg-black border border-gray-800 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71]" />
              <h2 className="text-xl font-heading font-bold text-white">
                Payment Instructions — {selectedPlan.name} Plan ({selectedPlan.price} {selectedPlan.period})
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wallet className="w-6 h-6 text-[#FFD700]" />
                  <h3 className="font-heading font-semibold text-white">Step 1: Send Payment via PayID</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-[#FFD700]" />
                    <span>PayID Email:</span>
                    <code className="flex-1 bg-gray-900 px-3 py-2 rounded-lg font-mono text-white border border-gray-700">
                      {payidEmail}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2 border-gray-700 text-gray-300 hover:bg-gray-800"
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
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Smartphone className="w-4 h-4 text-[#FFD700]" />
                    <span>Amount:</span>
                    <span className="font-semibold text-[#FFD700] text-lg">{selectedPlan.price}</span>
                    <span className="text-gray-400">{selectedPlan.period}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-heading font-semibold text-white mb-4">Step 2: Confirm Your Payment</h3>
                <ol className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <span>Open your banking app and select PayID</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <span>Send payment to <strong className="text-white">{payidEmail}</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                    <span>Use your email address as the payment description</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center font-bold text-xs shrink-0">4</span>
                    <span>Activation is instant - you'll be redirected to your dashboard</span>
                  </li>
                </ol>
              </div>

              {/* Payment Reference Input */}
              {!submitted ? (
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">
                      Payment Reference / Description <span className="text-gray-600">(optional but helpful)</span>
                    </label>
                    <Input
                      placeholder="e.g. your email or transaction reference number"
                      value={payRef}
                      onChange={e => setPayRef(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Once you click below, our team will be notified to verify your payment and activate your account within a few hours.
                    </p>
                    <Button
                      onClick={handleSubmitPayment}
                      disabled={submitting}
                      className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black px-8 py-6 text-base font-bold gap-2 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? "Submitting..." : "I've Sent Payment — Notify Us"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-800">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="font-bold text-white text-lg mb-1">Payment Notification Sent!</p>
                    <p className="text-sm text-gray-400">
                      We've received your notification for the <strong className="text-white">{selectedPlan.name}</strong> plan.
                      Our team will verify your payment and activate your account — usually within a few hours.
                    </p>
                    <Button
                      className="mt-4 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Info */}
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl p-6 text-center">
          <h3 className="font-heading font-semibold text-white mb-2">Need Help?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Payment issues or questions about your subscription?
          </p>
          <a 
            href={`mailto:${payidEmail}`}
            className="inline-flex items-center gap-2 text-[#FFD700] hover:underline text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            {payidEmail}
          </a>
        </div>

        {/* Footer Tagline */}
        <div className="bg-[#FFD700] mt-8 py-6 px-4 rounded-xl">
          <p className="text-center text-black font-bold tracking-wide">
            UPLOAD YOUR STORY. BUILD YOUR EVIDENCE. TAKE BACK CONTROL.
          </p>
        </div>
      </div>
    </div>
  );
}