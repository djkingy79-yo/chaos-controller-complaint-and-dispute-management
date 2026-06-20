import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, FileText, Lock, Star, Mail, Shield, Zap, Trophy, Calendar, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import HeroSection from "@/components/welcome/HeroSection";
import FeaturesSection from "@/components/welcome/FeaturesSection";

const plans = [
  {
    name: "Starter",
    price: "$9.99",
    period: "/month AUD",
    description: "For a single dispute",
    subtitle: "Perfect if you have one active dispute and need professional tools to fight back.",
    themeColor: "#E74C3C",
    icon: FileText,
    features: [
      "3 active cases",
      "Evidence vault — 25 files per case",
      "AI document scanning & data extraction",
      "1st Complaint Letter generator",
      "Automated case timeline builder",
      "Deadline tracker with reminders",
      "Full template library",
      "PDF case summary export"
    ],
    lockedFeatures: [
      "2nd & 3rd Complaint Letters",
      "Escalation bundles (AFCA/TIO/NCAT)",
      "Google Calendar & Outlook sync",
      "Chaos Score & analytics"
    ]
  },
  {
    name: "Pro",
    price: "$15.99",
    period: "/month AUD",
    description: "The go-to plan for anyone dealing with a complex dispute — unlimited cases, full letter suite, tribunal bundles.",
    subtitle: "MOST POPULAR",
    themeColor: "#FFD700",
    icon: Zap,
    popular: true,
    features: [
      "Unlimited active cases",
      "Unlimited evidence files",
      "Priority AI scanning & smart extraction",
      "1st Complaint Letter generator",
      "2nd & 3rd Complaint Letters",
      "Accept Offer & Deny Offer letters",
      "Tribunal-ready escalation bundles",
      "Google Calendar & Outlook auto-sync",
      "Smart checklist with proof tracking",
      "Organisation contacts directory",
      "Direct ombudsman links (AFCA, TIO, NCAT)"
    ],
    lockedFeatures: ["Chaos Score & analytics"]
  },
  {
    name: "Command",
    price: "$19.99",
    period: "/month AUD",
    description: "The full arsenal. Every tool, every letter, every report — built for users who mean business.",
    subtitle: "MAXIMUM POWER",
    themeColor: "#A855F7",
    icon: Trophy,
    features: [
      "Everything in Pro — unlimited",
      "All 6 letters incl. Escalation Letter",
      "Full ZIP case bundle export",
      "Advanced timeline & event categorisation",
      "Chaos Score & case strength analytics",
      "AI-powered evidence analysis",
      "Full print bundles — tribunal ready",
      "Multi-step guided complaint builder",
      "Early access to new features",
      "Priority email support from our team",
      "Merchant shared case portals",
      "Google Calendar & Outlook auto-sync"
    ],
    lockedFeatures: []
  }
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection onGetStarted={() => navigate("/register")} onSignIn={() => navigate("/login")} />
      
      <FeaturesSection />

      {/* CHAOS PACKAGES Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
          Our Chaos Packages
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-4" />
        <p className="text-center text-white font-bold mb-2 max-w-3xl mx-auto text-lg">
          Fight Back Like You Mean It
        </p>
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto text-base">
          One solicitor letter costs $300+. For less than $2 a day, Chaos Controller gives you the entire arsenal — letters, evidence vault, timelines, and tribunal bundles.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.6 }}
              className={`relative bg-black border-2 rounded-xl p-6 ${plan.popular ? 'border-[#FFD700]' : plan.name === 'Starter' ? 'border-[#E74C3C]' : 'border-[#A855F7]'}`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-[#FFD700] text-black px-3 py-1 rounded-full text-xs font-black">
                  MOST POPULAR
                </div>
              )}
              {plan.name === 'Command' && (
                <div className="absolute top-4 right-4 bg-[#A855F7]/20 text-[#A855F7] px-3 py-1 rounded-full text-xs font-black border border-[#A855F7]/30">
                  MAXIMUM POWER
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.themeColor}22` }}>
                    <plan.icon className="w-6 h-6" style={{ color: plan.themeColor }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-2xl text-white">{plan.name}</h3>
                    {plan.subtitle && !plan.popular && plan.name !== 'Command' && (
                      <p className="text-gray-400 text-xs font-bold">{plan.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-display font-black" style={{ color: plan.themeColor }}>{plan.price}</span>
                  <span className="text-white font-bold text-sm">{plan.period}</span>
                </div>
                <p className="text-white font-bold text-sm leading-relaxed">{plan.description}</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: plan.themeColor }} />
                    <span className="text-sm text-white font-bold">{feature}</span>
                  </li>
                ))}
                {plan.lockedFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <X className="w-4 h-4 shrink-0 mt-0.5 text-gray-600" />
                    <span className="text-sm text-gray-500 font-bold">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full border-2 font-black px-6 py-5 text-base"
                size="lg"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: plan.themeColor,
                  color: plan.themeColor
                }}
                onClick={() => navigate("/payments")}
              >
                {plan.name === 'Starter' ? 'Start with Starter' : plan.name === 'Pro' ? 'Go Pro' : 'Take Command'}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Benefit Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-[#1A1D2B] border border-gray-700 rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-[#E74C3C]/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-[#E74C3C]" />
            </div>
            <p className="text-white font-bold text-sm leading-relaxed">
              A single solicitor letter costs $300+. We generate unlimited professional letters for the price of a coffee a day.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-[#1A1D2B] border border-gray-700 rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-[#FFD700]/20 rounded-lg flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-[#FFD700]" />
            </div>
            <p className="text-white font-bold text-sm leading-relaxed">
              Organise years of evidence in minutes — AI reads your documents and extracts the key facts automatically.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-[#1A1D2B] border border-gray-700 rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-[#A855F7]/20 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-[#A855F7]" />
            </div>
            <p className="text-white font-bold text-sm leading-relaxed">
              Never miss a deadline. Deadlines are automatically tracked and synced to your calendar with smart reminders.
            </p>
          </motion.div>
        </div>

        {/* Help & CTA Section */}
        <div className="max-w-2xl mx-auto mt-12 space-y-4">
          {/* Need Help? */}
          <div className="bg-[#1A1D2B] border border-gray-700 rounded-xl p-6">
            <h3 className="text-white font-black text-lg mb-2">Need Help?</h3>
            <p className="text-gray-400 text-sm font-bold mb-3">Questions about your subscription or payment?</p>
            <a href="mailto:djkingy79@gmail.com" className="text-[#FFD700] font-bold text-sm flex items-center gap-2 hover:underline">
              <Mail className="w-4 h-4" />
              djkingy79@gmail.com
            </a>
          </div>

          {/* Secure & Flexible */}
          <div className="bg-[#1A1D2B] border border-gray-700 rounded-xl p-6">
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#27AE60]" />
                <span className="text-white font-bold text-sm">Cancel anytime, no lock-in.</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#27AE60]" />
                <span className="text-white font-bold text-sm">Instant access on activation.</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#27AE60]" />
                <span className="text-white font-bold text-sm">Australian-owned & operated.</span>
              </li>
            </ul>
          </div>

          {/* Big Bold CTA Button */}
          <Button
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-black px-8 py-6 text-base sm:text-lg border-2 border-[#FFD700] whitespace-normal h-auto min-h-[60px]"
            size="lg"
            onClick={() => navigate("/payments")}
          >
            UPLOAD YOUR STORY. BUILD EVIDENCE. TAKE BACK CONTROL.
          </Button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="bg-gradient-to-r from-[#C0392B] via-black to-[#C0392B] py-12 border-t-2 border-[#FFD700]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/43ffd1867_67B5CC10-D393-47DF-871D-C5B37790EF8E.png"
              alt="Chaos Controller"
              className="w-full max-w-2xl mx-auto object-contain drop-shadow-2xl"
            />
          </div>

          <h2 className="text-3xl font-display font-black text-white mb-2">CHAOS CONTROLLER</h2>
          <p className="text-[#FFD700] font-bold text-lg mb-6">Designed & Developed by Deb King</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-base font-bold">
            <a href="/terms" className="text-white hover:text-[#FFD700] transition-colors">Terms & Conditions</a>
            <a href="/privacy" className="text-white hover:text-[#FFD700] transition-colors">Privacy Policy</a>
            <a href="mailto:djkingy79@gmail.com" className="text-white hover:text-[#FFD700] transition-colors">Contact</a>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 bg-white border-2 border-[#FFD700] rounded-lg px-4 py-3 max-w-2xl mx-auto">
            <p className="text-[#C0392B] font-bold italic text-xs" style={{ fontSize: '9pt' }}>
              ⚠️⚠️IMPORTANT DISCLAIMER⚠️⚠️<br />
              All content provided is for educational and informational purposes only. It does not constitute formal legal advice and should not be relied upon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}