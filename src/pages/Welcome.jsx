import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Clock,
  Shield, 
  Scale, 
  Upload,
  FileText,
  AlertTriangle,
  ArrowRight,
  Check
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Upload,
    title: "ORGANISE YOUR EVIDENCE",
    description: "Upload documents, contracts, emails, and correspondence. AI scans and extracts key details automatically.",
    color: "#3498DB",
    bgColor: "bg-[#3498DB]/10",
    borderColor: "border-[#3498DB]/30"
  },
  {
    icon: Clock,
    title: "TRACK EVERY RESPONSE",
    description: "Timeline builder tracks every interaction. Deadlines are monitored. Nothing slips through the cracks.",
    color: "#9B59B6",
    bgColor: "bg-[#9B59B6]/10",
    borderColor: "border-[#9B59B6]/30"
  },
  {
    icon: Scale,
    title: "ESCALATE WITH CONFIDENCE",
    description: "Generate professional complaint letters. Build tribunal-ready bundles. Escalate to AFCA, TIO, NCAT with one click.",
    color: "#2ECC71",
    bgColor: "bg-[#2ECC71]/10",
    borderColor: "border-[#2ECC71]/30"
  },
  {
    icon: Shield,
    title: "TAKE BACK CONTROL",
    description: "You're not powerless. Chaos Controller gives you the tools, structure, and evidence to fight back.",
    color: "#E67E22",
    bgColor: "bg-[#E67E22]/10",
    borderColor: "border-[#E67E22]/30"
  }
];

const disputeTypes = [
  { icon: FolderOpen, label: "BANK DISPUTES", color: "#C0392B" },
  { icon: Shield, label: "INSURANCE CLAIMS", color: "#8E44AD" },
  { icon: FileText, label: "HOUSING", color: "#2980B9" },
  { icon: Scale, label: "NCAT", color: "#D35400" },
  { icon: AlertTriangle, label: "CONSUMER COMPLAINTS", color: "#27AE60" }
];

const plans = [
  {
    name: "Starter",
    price: "$9.99",
    period: "/month",
    description: "For single disputes",
    features: ["1 active case", "Evidence vault (10 files)", "AI document scanning", "Complaint letter generation", "Timeline builder"],
    cta: "Select Plan",
    popular: false
  },
  {
    name: "Pro",
    price: "$24.99",
    period: "/month",
    description: "For multiple disputes",
    features: ["Unlimited cases", "Unlimited evidence files", "Priority AI scanning", "Escalation bundles", "Deadline reminders", "Calendar sync"],
    cta: "Select Plan",
    popular: true
  },
  {
    name: "Premium",
    price: "$49.99",
    period: "/month",
    description: "Maximum support",
    features: ["Everything in Pro", "Priority support", "Legal template library", "Case strength analytics", "Export to PDF bundles", "Multi-user access"],
    cta: "Select Plan",
    popular: false
  }
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-black to-red-500/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          {/* Logo - FIRST */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png"
              alt="Chaos Controller Logo"
              className="w-32 h-32 sm:w-40 sm:h-40 mx-auto object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-6"
          >
            <h1 className="text-6xl sm:text-8xl font-display font-bold tracking-tighter">
              <span className="text-white drop-shadow-lg">CHAOS</span>
              <span className="text-[#FFD700] ml-3 drop-shadow-lg" style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.5)" }}>CONTROLLER</span>
            </h1>
          </motion.div>

          {/* Tagline on Red Band */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-[#C0392B] px-8 py-3 rounded-sm">
              <p className="text-white font-bold tracking-widest text-sm sm:text-base">
                NEVER FEAR. CONTROL STARTS HERE.
              </p>
            </div>
          </motion.div>

          {/* Hero statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-lg sm:text-xl text-white max-w-3xl mx-auto leading-relaxed">
              <span className="text-[#FFD700] font-bold">THEY HAD YOUR LOYALTY.</span>
              {" "}NOW YOU DESERVE THEIR{" "}
              <span className="text-[#FFD700] font-bold">ACCOUNTABILITY.</span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Button 
              size="lg" 
              className="bg-[#1E73E8] hover:bg-[#1E73E8]/90 text-white px-8 py-6 text-lg font-semibold gap-2 border-0"
              onClick={() => navigate("/register")}
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4 text-white">
          TAKE BACK CONTROL
        </h2>
        <div className="w-24 h-1 bg-[#C0392B] mx-auto mb-12" />
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.6 }}
                className={`bg-black border ${feature.borderColor} p-6 rounded-xl hover:border-opacity-60 transition-all`}
              >
                <div className={`${feature.bgColor} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8" style={{ color: feature.color }} />
                </div>
                <h3 className="font-heading font-bold text-base mb-2 text-white tracking-wide">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dispute Types */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4 text-white">
          BUILT FOR EVERY DISPUTE
        </h2>
        <div className="w-24 h-1 bg-[#C0392B] mx-auto mb-12" />
        
        <div className="flex flex-wrap justify-center gap-6">
          {disputeTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                className="flex items-center gap-3 bg-black border border-gray-800 px-6 py-4 rounded-lg hover:border-opacity-50 transition-all"
              >
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: `${type.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <span className="font-heading font-bold text-white tracking-wide">{type.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4 text-white">
          CHOOSE YOUR PLAN
        </h2>
        <div className="w-24 h-1 bg-[#C0392B] mx-auto mb-4" />
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Start with a 7-day free trial. Cancel anytime. No hidden fees.
        </p>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.6 }}
              className={`relative bg-black border ${plan.popular ? 'border-[#FFD700]' : 'border-gray-800'} rounded-2xl p-8 ${plan.popular ? 'ring-2 ring-[#FFD700]/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="font-heading font-bold text-2xl mb-2 text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-display font-bold text-[#FFD700]">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${plan.popular ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                size="lg"
                onClick={() => navigate("/register")}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer CTA - Yellow Band */}
      <div className="bg-[#FFD700] py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg sm:text-xl text-black font-bold mb-6 tracking-wide">
            UPLOAD YOUR STORY. BUILD YOUR EVIDENCE. TAKE BACK CONTROL.
          </p>
          <Button 
            size="lg" 
            className="bg-black hover:bg-black/90 text-white px-8 py-6 text-lg font-semibold border-0"
            onClick={() => navigate("/register")}
          >
            Start Your Free Trial Today
          </Button>
        </div>
      </div>

      {/* Legal Links */}
      <div className="max-w-7xl mx-auto px-4 py-8 bg-black">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Chaos Controller. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-[#FFD700] transition-colors">Terms & Conditions</a>
            <a href="/privacy" className="hover:text-[#FFD700] transition-colors">Privacy Policy</a>
            <a href="mailto:chaoscontrollerapp@gmail.com" className="hover:text-[#FFD700] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}