import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, Lock, Star } from "lucide-react";
import { motion } from "framer-motion";
import HeroSection from "@/components/welcome/HeroSection";
import FeaturesSection from "@/components/welcome/FeaturesSection";

const plans = [
  {
    name: "Starter",
    price: "$9.99",
    period: "AUD/month",
    description: "For single disputes",
    themeColor: "#C0392B",
    features: [
      "Up to 3 active cases",
      "Evidence vault (25 files per case)",
      "AI document scanning & data extraction",
      "1st Formal Complaint Letter generator",
      "Automated case timeline builder",
      "Deadline tracker with email reminders",
      "Full template library access",
      "PDF export for tribunal submissions",
      "Secure cloud storage",
      "Mobile & desktop access"
    ],
    lockedFeatures: ["2nd & 3rd Complaint Letters", "Escalation Letter to AFCA", "Accept/Deny Offer Letters", "Full Tribunal Bundle PDF"]
  },
  {
    name: "Pro",
    price: "$15.99",
    period: "AUD/month",
    description: "For serious & ongoing disputes",
    themeColor: "#FFD700",
    popular: true,
    features: [
      "Everything in Starter — unlimited",
      "Unlimited active cases",
      "Unlimited evidence file uploads",
      "Priority AI scanning & smart extraction",
      "All 6 professional complaint letters",
      "1st, 2nd & 3rd Complaint Letters",
      "Accept Offer & Deny Offer letters",
      "Tribunal-ready escalation bundles",
      "Google Calendar auto-sync",
      "Outlook Calendar auto-sync",
      "Smart checklist with proof tracking",
      "Organisation contacts directory",
      "Direct ombudsman links (AFCA, TIO, NCAT)",
      "Automated email notifications",
      "Case status change alerts"
    ],
    lockedFeatures: ["Chaos Score analytics", "ZIP bundle export"]
  },
  {
    name: "Commander",
    price: "$19.99",
    period: "AUD/month",
    description: "Maximum firepower",
    themeColor: "#2980B9",
    features: [
      "Everything in Pro — unlimited",
      "Full ZIP case bundle export",
      "Chaos Score & case strength analytics",
      "AI-powered evidence analysis",
      "Printable formal letter bundles",
      "Multi-step guided complaint builder",
      "Advanced timeline & event categorisation",
      "Merchant shared case portals",
      "Invite merchants to respond online",
      "Priority email support",
      "Early access to new features",
      "Advanced dispute resolution metrics",
      "Case outcome tracking & reporting"
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
          CHAOS PACKAGES
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-4" />
        <p className="text-center text-white font-bold mb-12 max-w-2xl mx-auto text-lg">
          Choose your weapon. Cancel anytime. No hidden fees.
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.6 }}
              className={`relative bg-gradient-to-br from-black to-gray-900 border-2 rounded-2xl p-8 ${plan.popular ? 'border-[#FFD700] ring-2 ring-[#FFD700]/50' : 'border-[#C0392B]'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black px-4 py-1 rounded-full text-xs font-black">
                  MOST POPULAR
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="font-heading font-black text-5xl mb-2" style={{ color: plan.themeColor }}>{plan.name}</h3>
                <p className="text-base text-white font-bold mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-display font-black" style={{ color: plan.themeColor }}>{plan.price}</span>
                  <span className="text-white font-bold ml-2 text-lg">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
                    <span className="text-base text-white font-bold">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full border-2 font-bold px-8 py-6 text-lg"
                size="lg"
                style={{ 
                  backgroundColor: plan.themeColor, 
                  borderColor: plan.themeColor,
                  color: plan.popular ? '#000' : '#fff'
                }}
                onClick={() => navigate("/payments")}
              >
                Select Plan
              </Button>

              {plan.lockedFeatures.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-gray-400" /> Higher tiers also include:
                  </p>
                  <div className="space-y-2">
                    {plan.lockedFeatures.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <Lock className="w-3 h-3 text-gray-600 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.lockedFeatures.length === 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-white font-bold">
                    <Star className="w-4 h-4 text-[#2980B9]" />
                    <span>Includes everything — all features unlocked</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-6 mt-12 text-center">
          <h3 className="text-xl font-display font-black text-white mb-2">Ready to fight back?</h3>
          <p className="text-gray-400 text-sm font-black mb-4">Get started with your first case today — pay via PayID in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-black px-8"
              onClick={() => navigate("/payments")}
            >
              View Plans & Pay
            </Button>
            <Button
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 font-black"
              onClick={() => navigate("/register")}
            >
              Create Free Account
            </Button>
          </div>
        </div>

        {/* Sample Letters Preview */}
        <div className="mt-16">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
            SAMPLE LETTERS
          </h2>
          <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-8" />
          <p className="text-center text-white font-bold mb-8 max-w-2xl mx-auto text-lg">
            Professional, tribunal-ready letters generated in seconds
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "1st Complaint Letter", category: "Banking Dispute", preview: "I am writing to formally complain about the unfair fees charged to my account..." },
              { title: "2nd Complaint Letter", category: "Insurance Claim", preview: "Further to my previous correspondence, I am disappointed to note that my claim..." },
              { title: "3rd & Final Letter", category: "Tenancy Dispute", preview: "This is my third and final attempt to resolve this matter internally before..." },
              { title: "Accept Offer Letter", category: "Telco Dispute", preview: "I am writing to confirm my acceptance of the settlement offer dated..." },
              { title: "Deny Offer Letter", category: "Utilities Dispute", preview: "I regret to inform you that the settlement offer proposed is unacceptable because..." },
              { title: "Escalation Letter", category: "AFCA External", preview: "I wish to escalate this matter to the Australian Financial Complaints Authority..." },
            ].map((letter, idx) => (
              <div key={idx} className="bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700]/30 rounded-xl p-6 hover:border-[#FFD700]/60 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#FFD700]" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{letter.title}</p>
                    <p className="text-[#FFD700] font-bold text-xs">{letter.category}</p>
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 mb-3">
                  <p className="text-gray-400 font-mono text-xs italic">"{letter.preview}"</p>
                </div>
              </div>
            ))}
          </div>
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
            <a href="mailto:chaoscontrollerapp@gmail.com" className="text-white hover:text-[#FFD700] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}