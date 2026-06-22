import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check, X, Copy, CheckCircle2, ArrowLeft, Mail, Smartphone,
  Wallet, Send, ShieldCheck, Star, Zap, Trophy, FileText,
  FolderOpen, Clock, Bell, CalendarCheck, Layers, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ADMIN_EMAIL, getUpgradePrice } from "@/lib/subscription";
import { useQuery } from "@tanstack/react-query";

const plans = [
  {
    name: "Starter",
    badge: null,
    tagline: "For a single dispute",
    price: "$9.99",
    period: "/month AUD",
    color: "#C0392B",
    icon: FileText,
    highlight: "Perfect if you have one active dispute and need professional tools to fight back.",
    features: [
      { text: "3 active cases", included: true },
      { text: "Evidence vault — 25 files per case", included: true },
      { text: "AI document scanning & data extraction", included: true },
      { text: "1st Complaint Letter generator", included: true },
      { text: "Automated case timeline builder", included: true },
      { text: "Deadline tracker with reminders", included: true },
      { text: "Full template library", included: true },
      { text: "PDF case summary export", included: true },
      { text: "2nd & 3rd Complaint Letters", included: false },
      { text: "Escalation bundles (AFCA/TIO/NCAT)", included: false },
      { text: "Google Calendar & Outlook sync", included: false },
      { text: "Chaos Score & analytics", included: false },
    ],
    cta: "Start with Starter",
    popular: false,
  },
  {
    name: "Pro",
    badge: "MOST POPULAR",
    tagline: "For serious & ongoing battles",
    price: "$15.99",
    period: "/month AUD",
    color: "#FFD700",
    icon: Zap,
    highlight: "The go-to plan for anyone dealing with a complex dispute — unlimited cases, full letter suite, tribunal bundles.",
    features: [
      { text: "Unlimited active cases", included: true },
      { text: "Unlimited evidence files", included: true },
      { text: "Priority AI scanning & smart extraction", included: true },
      { text: "1st Complaint Letter generator", included: true },
      { text: "2nd & 3rd Complaint Letters", included: true },
      { text: "Accept Offer & Deny Offer letters", included: true },
      { text: "Tribunal-ready escalation bundles", included: true },
      { text: "Google Calendar & Outlook auto-sync", included: true },
      { text: "Smart checklist with proof tracking", included: true },
      { text: "Organisation contacts directory", included: true },
      { text: "Direct ombudsman links (AFCA, TIO, NCAT)", included: true },
      { text: "Chaos Score & analytics", included: false },
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Command",
    badge: "MAXIMUM POWER",
    tagline: "Total control — no limits",
    price: "$19.99",
    period: "/month AUD",
    color: "#9B59B6",
    icon: Trophy,
    highlight: "The full arsenal. Every tool, every letter, every report — built for users who mean business.",
    features: [
      { text: "Everything in Pro — unlimited", included: true },
      { text: "All 6 letters incl. Escalation Letter", included: true },
      { text: "Full ZIP case bundle export", included: true },
      { text: "Advanced timeline & event categorisation", included: true },
      { text: "Chaos Score & case strength analytics", included: true },
      { text: "AI-powered evidence analysis", included: true },
      { text: "Full print bundles — tribunal ready", included: true },
      { text: "Multi-step guided complaint builder", included: true },
      { text: "Early access to new features", included: true },
      { text: "Priority email support from our team", included: true },
      { text: "Merchant shared case portals", included: true },
      { text: "Google Calendar & Outlook auto-sync", included: true },
    ],
    cta: "Take Command",
    popular: false,
  },
];

const valuePoints = [
  { icon: FileText, text: "A single solicitor letter costs $300+. We generate unlimited professional letters for the price of a coffee a day." },
  { icon: FolderOpen, text: "Organise years of evidence in minutes — AI reads your documents and extracts the key facts automatically." },
  { icon: Clock, text: "Never miss a deadline. Deadlines are tracked and synced to your calendar with automated reminders." },
  { icon: Trophy, text: "Print-ready tribunal bundles accepted by AFCA, TIO, NCAT, and all ombudsman bodies — ready in one click." },
];

export default function Payments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [copied, setCopied] = useState(false);
  const [payRef, setPayRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get current subscription for upgrade pricing
  const { data: currentSubscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const payments = await base44.entities.PaymentRequest.filter({ user_id: user?.id, status: "verified", subscription_active: true }, "-verified_date", 1);
      return payments[0] || null;
    },
    enabled: !!user?.id,
  });

  const payidEmail = "djkingy79@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(payidEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate upgrade pricing for selected plan
  const upgradeInfo = selectedPlan && currentSubscription?.plan_name
    ? getUpgradePrice(currentSubscription.plan_name, selectedPlan.name)
    : null;

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !user) return;
    setSubmitting(true);
    await base44.entities.PaymentRequest.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      plan_name: selectedPlan.name,
      amount: upgradeInfo ? `$${upgradeInfo.upgrade_price.toFixed(2)}` : selectedPlan.price,
      payid_reference: payRef,
      status: "pending",
      subscription_active: false,
      admin_notes: upgradeInfo ? `Upgrade from ${upgradeInfo.from_plan} - Original price: $${upgradeInfo.original_price}, Savings: $${upgradeInfo.savings}` : undefined,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === "admin";

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/c59fd1d31_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png" alt="Chaos Controller" className="w-48 mx-auto object-contain mb-6" />
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
            <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-black px-10 py-6 text-lg" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/c59fd1d31_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png" alt="Chaos Controller" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-lg font-display font-black text-white">Choose Your Plan</h1>
            <p className="text-xs text-gray-400">Pay via PayID · No contracts · Cancel anytime</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Upgrade Credit Banner */}
        {currentSubscription?.plan_name && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-black text-green-400">Upgrade Credit Active</span>
            </div>
            <p className="text-xs text-gray-300 font-bold">
              You're on the <strong className="text-white">{currentSubscription.plan_name}</strong> plan. Upgrade to any higher tier and only pay the price difference!
            </p>
          </motion.div>
        )}

        {/* Logo */}
        <div className="mb-8">
          <img
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/c59fd1d31_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png"
            alt="Chaos Controller Logo"
            className="w-full max-w-2xl mx-auto block"
          />
        </div>

        {/* Our Chaos Packages Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white">
            Our Chaos Packages
          </h2>
        </div>

        {/* Hero Value */}
        <div className="text-center mb-14">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {!currentSubscription?.plan_name && (
              <div className="inline-block bg-[#C0392B] px-4 py-1.5 rounded-full text-xs font-black tracking-widest mb-4">
                PROFESSIONAL TOOLS · AFFORDABLE PRICE
              </div>
            )}
            <h2 className="text-3xl sm:text-5xl font-display font-black mb-4">
              Fight Back Like You Mean It
            </h2>
            <p className="text-gray-300 font-bold text-lg max-w-2xl mx-auto">
              One solicitor letter costs $300+. For less than $2 a day, Chaos Controller gives you the entire arsenal — letters, evidence vault, timelines, and tribunal bundles.
            </p>
          </motion.div>
        </div>

        {/* Value Points */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {valuePoints.map(({ icon: Icon, text }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex gap-3">
              <div className="w-9 h-9 bg-[#FFD700]/15 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#FFD700]" />
              </div>
              <p className="text-sm text-gray-300 font-medium leading-snug">{text}</p>
            </motion.div>
          ))}
        </div>

        {/* Plan Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan?.name === plan.name;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                onClick={() => setSelectedPlan(plan)}
                className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? `border-[${plan.color}] shadow-2xl`
                    : plan.popular
                    ? "border-[#FFD700]/50 hover:border-[#FFD700]"
                    : "border-gray-700 hover:border-gray-500"
                }`}
                style={isSelected ? { borderColor: plan.color, boxShadow: `0 0 30px ${plan.color}30` } : {}}
              >
                {/* Top bar */}
                <div className="h-1.5 w-full" style={{ background: plan.color }} />

                {plan.badge && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider"
                    style={{ background: `${plan.color}25`, color: plan.color, border: `1px solid ${plan.color}50` }}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}20` }}>
                      <Icon className="w-6 h-6" style={{ color: plan.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black" style={{ color: plan.name === "Starter" ? "#C0392B" : plan.color }}>{plan.name}</h3>
                      <p className="text-xs text-gray-400 font-medium">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-display font-black" style={{ color: plan.name === "Starter" ? "#C0392B" : plan.color }}>{plan.price}</span>
                      <span className="text-gray-400 text-sm font-medium">{plan.period}</span>
                    </div>
                  </div>

                  {/* Highlight */}
                  <p className="text-sm text-gray-300 font-medium mb-5 leading-relaxed border-l-2 pl-3" style={{ borderColor: plan.color }}>
                    {plan.highlight}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5">
                        {f.included
                          ? <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: plan.color }} />
                          : <X className="w-4 h-4 shrink-0 mt-0.5 text-gray-600" />}
                        <span className={`text-sm font-medium ${f.included ? "text-white" : "text-gray-600"}`}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}
                    className="w-full py-4 rounded-xl font-black text-lg tracking-wide transition-all duration-200"
                    style={isSelected
                      ? { background: plan.name === "Starter" ? "#C0392B" : plan.color, color: "#fff" }
                      : { background: `${plan.color}18`, color: plan.name === "Starter" ? "#C0392B" : plan.color, border: `1.5px solid ${plan.name === "Starter" ? "#C0392B" : plan.color}40` }
                    }
                  >
                    {isSelected ? `✓ ${plan.name} Selected` : plan.cta}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Payment Section */}
        {selectedPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="bg-gray-900 border-2 border-gray-700 rounded-2xl overflow-hidden mb-10">

            {/* Section header */}
            <div className="px-8 py-5 border-b border-gray-700 flex items-center gap-3" style={{ background: `${selectedPlan.color}12` }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: selectedPlan.color }} />
              <div>
                <h2 className="text-lg font-display font-black text-white">
                  Payment Instructions — {selectedPlan.name} Plan
                </h2>
                {upgradeInfo ? (
                  <>
                    <p className="text-sm text-green-400 font-bold">Upgrade Special: Only ${upgradeInfo.upgrade_price}/month AUD</p>
                    <p className="text-xs text-gray-400">You save ${upgradeInfo.savings} — pay only the difference!</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">{selectedPlan.price}/month AUD · Activate within a few hours of payment</p>
                )}
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Step 1 */}
              <div className="bg-black rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: selectedPlan.color, color: selectedPlan.color === "#FFD700" ? "#000" : "#fff" }}>1</div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" style={{ color: selectedPlan.color }} />
                    <h3 className="font-black text-white">Send Payment via PayID</h3>
                  </div>
                </div>
                <div className="space-y-3 pl-11">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-gray-400 text-sm flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#FFD700]" /> PayID Email:</span>
                    <code className="flex-1 bg-gray-800 px-4 py-2 rounded-lg font-mono text-white border border-gray-700 text-sm">{payidEmail}</code>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 border-gray-700 text-gray-300 hover:bg-gray-800 shrink-0">
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-[#FFD700]" /> Amount:</span>
                    {upgradeInfo ? (
                      <>
                        <span className="font-black text-2xl text-green-400">${upgradeInfo.upgrade_price}</span>
                        <span className="text-gray-400">AUD/month</span>
                        <span className="text-xs text-gray-500 line-through ml-2">${selectedPlan.price}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-2xl" style={{ color: selectedPlan.color }}>{selectedPlan.price}</span>
                        <span className="text-gray-400">AUD/month</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-black rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: selectedPlan.color, color: selectedPlan.color === "#FFD700" ? "#000" : "#fff" }}>2</div>
                  <h3 className="font-black text-white">Use your email as the payment description</h3>
                </div>
                <p className="pl-11 text-sm text-gray-400">This helps us match your payment to your account and activate your subscription quickly.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-black rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: selectedPlan.color, color: selectedPlan.color === "#FFD700" ? "#000" : "#fff" }}>3</div>
                  <h3 className="font-black text-white">Notify us so we can activate your account</h3>
                </div>
                <div className="pl-11 space-y-3">
                  <label className="text-sm text-gray-400 block">Payment Reference / Description <span className="text-gray-600">(optional)</span></label>
                  <Input
                    placeholder="e.g. your email or transaction reference"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Submit */}
              {!submitted ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-gray-500 max-w-sm">
                    Once notified, our team verifies your payment and activates your account — usually within a few hours.
                  </p>
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    className="font-black px-8 py-5 text-base gap-2 shrink-0"
                    style={{ background: selectedPlan.color, color: selectedPlan.color === "#FFD700" ? "#000" : "#fff" }}
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Submitting…" : "I've Sent Payment — Notify Us"}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="font-black text-white text-xl mb-1">Payment Notification Sent!</p>
                  <p className="text-sm text-gray-400 mb-4">
                    We've received your notification for the <strong className="text-white">{selectedPlan.name}</strong> plan.
                    Activation usually happens within a few hours.
                  </p>
                  <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-black gap-2" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Help & Footer */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="font-black text-white mb-1">Need Help?</h3>
            <p className="text-sm text-gray-400 mb-3">Questions about your subscription or payment?</p>
            <a href="mailto:chaoscontrollerapp@gmail.com" className="inline-flex items-center gap-2 text-[#FFD700] hover:underline text-sm font-bold">
              <Mail className="w-4 h-4" /> chaoscontrollerapp@gmail.com
            </a>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="font-black text-white mb-1">Secure & Flexible</h3>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Cancel anytime, no lock-in</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Instant access on activation</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Australian-owned & operated</li>
            </ul>
          </div>
        </div>

        <div className="bg-[#FFD700] rounded-xl py-6 px-4 text-center">
          <p className="text-black font-black tracking-wide text-base">
            UPLOAD YOUR STORY. BUILD YOUR EVIDENCE. TAKE BACK CONTROL.
          </p>
        </div>
      </div>
    </div>
  );
}