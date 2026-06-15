import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Clock, 
  CheckCircle2, 
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
    title: "Organise Your Evidence",
    description: "Upload documents, contracts, emails, and correspondence. AI scans and extracts key details automatically.",
    color: "text-primary"
  },
  {
    icon: Clock,
    title: "Track Every Response",
    description: "Timeline builder tracks every interaction. Deadlines are monitored. Nothing slips through the cracks.",
    color: "text-warning"
  },
  {
    icon: Scale,
    title: "Escalate With Confidence",
    description: "Generate professional complaint letters. Build tribunal-ready bundles. Escalate to AFCA, TIO, NCAT with one click.",
    color: "text-success"
  },
  {
    icon: Shield,
    title: "Take Back Control",
    description: "You're not powerless. Chaos Controller gives you the tools, structure, and evidence to fight back.",
    color: "text-accent"
  }
];

const disputeTypes = [
  { icon: FolderOpen, label: "Bank Disputes", color: "text-red-500" },
  { icon: Shield, label: "Insurance Claims", color: "text-purple-500" },
  { icon: FileText, label: "Housing / Tenancy", color: "text-blue-500" },
  { icon: Scale, label: "NCAT Tribunal", color: "text-orange-500" },
  { icon: AlertTriangle, label: "Consumer Complaints", color: "text-green-500" }
];

const plans = [
  {
    name: "Starter",
    price: "$9.99",
    period: "/month",
    description: "For single disputes",
    features: ["1 active case", "Evidence vault (10 files)", "AI document scanning", "Complaint letter generation", "Timeline builder"],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Pro",
    price: "$24.99",
    period: "/month",
    description: "For multiple disputes",
    features: ["Unlimited cases", "Unlimited evidence files", "Priority AI scanning", "Escalation bundles", "Deadline reminders", "Calendar sync"],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Premium",
    price: "$49.99",
    period: "/month",
    description: "Maximum support",
    features: ["Everything in Pro", "Priority support", "Legal template library", "Case strength analytics", "Export to PDF bundles", "Multi-user access"],
    cta: "Start Free Trial",
    popular: false
  }
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-black to-accent/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl sm:text-7xl font-display font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-white bg-clip-text text-transparent tracking-tight">
              CHAOS CONTROLLER
            </h1>
            <p className="text-xl sm:text-2xl text-yellow-400 mt-4 font-semibold tracking-wide">
              NEVER FEAR. CONTROL STARTS HERE.
            </p>
          </motion.div>

          {/* Hero statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              <span className="text-yellow-400 font-semibold">THEY HAD YOUR LOYALTY.</span>
              {" "}NOW YOU DESERVE THEIR{" "}
              <span className="text-yellow-400 font-semibold">ACCOUNTABILITY.</span>
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold gap-2"
              onClick={() => navigate("/register")}
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">
          TAKE BACK CONTROL
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.6 }}
                className="bg-card/50 border border-border p-6 rounded-xl hover:border-primary/50 transition-colors"
              >
                <Icon className={`w-10 h-10 ${feature.color} mb-4`} />
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dispute Types */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">
          BUILT FOR EVERY DISPUTE
        </h2>
        
        <div className="flex flex-wrap justify-center gap-6">
          {disputeTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                className="flex items-center gap-3 bg-card/30 border border-border px-6 py-4 rounded-lg"
              >
                <Icon className={`w-8 h-8 ${type.color}`} />
                <span className="font-heading font-semibold">{type.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4">
          CHOOSE YOUR PLAN
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Start with a 7-day free trial. Cancel anytime. No hidden fees.
        </p>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.6 }}
              className={`relative bg-card border ${plan.popular ? 'border-primary' : 'border-border'} rounded-2xl p-8 ${plan.popular ? 'ring-2 ring-primary/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="font-heading font-bold text-2xl mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}
                size="lg"
                onClick={() => navigate("/register")}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg sm:text-xl text-yellow-400 font-semibold mb-2">
            UPLOAD YOUR STORY. BUILD YOUR EVIDENCE. TAKE BACK CONTROL.
          </p>
          <Button 
            size="lg" 
            className="mt-6 bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold"
            onClick={() => navigate("/register")}
          >
            Start Your Free Trial Today
          </Button>
        </div>
      </div>

      {/* Legal Links */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Chaos Controller. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="mailto:chaoscontrollerapp@gmail.com" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}