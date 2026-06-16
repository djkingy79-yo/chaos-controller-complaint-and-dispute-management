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
  Check,
  Home,
  Building2,
  Phone,
  Zap,
  Briefcase,
  Bot,
  Bell,
  CalendarCheck,
  BookOpen,
  Layers,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Upload,
    title: "ORGANISE YOUR EVIDENCE",
    description: "Upload documents, contracts, emails, and correspondence. AI scans and extracts key details automatically.",
    color: "#CC0000",
    bgColor: "bg-[#CC0000]/10",
    borderColor: "border-[#CC0000]/30"
  },
  {
    icon: Clock,
    title: "TRACK EVERY RESPONSE",
    description: "Timeline builder tracks every interaction. Deadlines are monitored. Nothing slips through the cracks.",
    color: "#660099",
    bgColor: "bg-[#660099]/10",
    borderColor: "border-[#660099]/30"
  },
  {
    icon: Scale,
    title: "ESCALATE WITH CONFIDENCE",
    description: "Generate professional complaint letters. Build tribunal-ready bundles. Escalate to AFCA, TIO, NCAT with one click.",
    color: "#0066CC",
    bgColor: "bg-[#0066CC]/10",
    borderColor: "border-[#0066CC]/30"
  },
  {
    icon: Shield,
    title: "TAKE BACK CONTROL",
    description: "You're not powerless. Chaos Controller gives you the tools, structure, and evidence to fight back.",
    color: "#008000",
    bgColor: "bg-[#008000]/10",
    borderColor: "border-[#008000]/30"
  }
];

const disputeTypes = [
  { icon: FolderOpen, label: "BANK DISPUTES", color: "#CC0000" },
  { icon: Shield, label: "INSURANCE CLAIMS", color: "#660099" },
  { icon: FileText, label: "HOUSING", color: "#0066CC" },
  { icon: Scale, label: "NCAT", color: "#CC8800" },
  { icon: AlertTriangle, label: "CONSUMER COMPLAINTS", color: "#008000" }
];

const plans = [
  {
    name: "Starter",
    price: "$25.00",
    period: "AUD/month",
    description: "For single disputes",
    features: ["3 active cases", "Evidence vault (25 files)", "AI document scanning", "Complaint letter generator", "Timeline builder", "Deadline tracker", "Full template library", "PDF export"],
    cta: "Select Plan",
    popular: false
  },
  {
    name: "Pro",
    price: "$35.00",
    period: "AUD/month",
    description: "For serious & ongoing disputes",
    features: ["Unlimited cases", "Unlimited evidence files", "Priority AI scanning", "Tribunal-ready escalation bundles", "Google Calendar sync", "Smart checklist", "Organisation directory", "Ombudsman direct links", "Email notifications"],
    cta: "Select Plan",
    popular: true
  },
  {
    name: "Command",
    price: "$49.00",
    period: "AUD/month",
    description: "Maximum firepower",
    features: ["Everything in Pro", "Full ZIP case bundle export", "Advanced timeline & analytics", "AI evidence analysis", "Printable formal bundles", "Chaos Score tracker", "Priority support", "Early access to new features"],
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
            className="text-center mb-12"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png"
              alt="Chaos Controller Logo"
              className="w-72 h-72 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] mx-auto object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tighter">
              <span className="text-white drop-shadow-lg">Welcome to</span>
              <span className="text-[#FFD700] ml-3 drop-shadow-lg" style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.5)" }}>Chaos!</span>
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

          {/* Quick explainer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mb-8"
          >
            <p className="text-base sm:text-lg text-white max-w-xl mx-auto leading-relaxed font-black">
              Chaos Controller is an AI-powered app that helps everyday Australians fight back against banks, insurers, landlords, and telcos — by organising your evidence, writing your complaints, and tracking every deadline for you.
            </p>
          </motion.div>

          {/* Hero statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mb-8"
          >
            <p className="text-lg sm:text-xl text-white max-w-3xl mx-auto leading-relaxed font-black">
              <span className="text-[#FFD700] font-black">THEY HAD YOUR LOYALTY.</span>
              {" "}NOW YOU DESERVE THEIR{" "}
              <span className="text-[#FFD700] font-black">ACCOUNTABILITY.</span>
            </p>
          </motion.div>

          {/* Start Your Case CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="text-center mb-12"
          >
            <Button
              size="lg"
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black px-10 py-6 text-xl font-black gap-2 border-2 border-[#FFD700] shadow-lg shadow-yellow-500/30"
              onClick={() => navigate("/register")}
            >
              START YOUR CASE <ArrowRight className="w-6 h-6" />
            </Button>
          </motion.div>

          {/* Personal Assistant Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8 }}
            className="max-w-5xl mx-auto mb-14"
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-[#C0392B] rounded-2xl p-6 sm:p-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center">
                  <Bot className="w-7 h-7 text-black" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                  YOUR AI-POWERED PERSONAL ASSISTANT
                </h2>
              </div>
              <p className="text-center text-[#FFD700] font-bold text-lg mb-8">
                Like having a lawyer, case manager, and admin all in one — working for you 24/7.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: Upload, color: "#C0392B", title: "AUTO DOCUMENT SCAN", desc: "Upload any document — contract, email, statement, invoice — and AI instantly extracts names, dates, account numbers, and key amounts. No manual data entry." },
                  { icon: FileText, color: "#FFD700", title: "LETTER GENERATOR", desc: "From 1st complaint to escalation letters — generate professional, legally worded correspondence in seconds. Tailored to your exact case and industry." },
                  { icon: CalendarCheck, color: "#27AE60", title: "DEADLINE TRACKER", desc: "Every response deadline is tracked automatically. Get alerts before time runs out so you never miss a critical window to escalate." },
                  { icon: Layers, color: "#9B59B6", title: "TIMELINE BUILDER", desc: "Every interaction, letter, and evidence piece is plotted on an automatic timeline — the full accountability record, always ready for tribunal." },
                  { icon: Bell, color: "#F39C12", title: "SMART NOTIFICATIONS", desc: "Automated reminders for overdue responses, upcoming deadlines, and missing evidence. Your case manager that never sleeps." },
                  { icon: Trophy, color: "#3498DB", title: "ESCALATION BUNDLES", desc: "One click generates a complete, print-ready submission bundle for AFCA, TIO, NCAT, and all ombudsman bodies. Tribunal-ready, every time." },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="bg-black/60 border border-gray-700 rounded-xl p-5 hover:border-[#FFD700]/40 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <h3 className="text-white font-black text-sm tracking-wide">{title}</h3>
                    </div>
                    <p className="text-gray-300 font-bold text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-r from-[#FFD700]/10 via-[#C0392B]/10 to-[#FFD700]/10 border border-[#FFD700]/40 rounded-xl p-5 text-center">
                <p className="text-white font-black text-lg">
                  🤖 Think of it as your <span className="text-[#FFD700]">personal dispute manager</span> — it remembers everything, misses nothing, and builds your case while you sleep.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Banner Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78, duration: 0.8 }}
            className="max-w-5xl mx-auto px-4 mb-10"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/3bafca5cd_IMG_6994.jpeg"
              alt="Chaos Controller — They Had Your Loyalty. Now You Deserve Their Accountability."
              className="w-full rounded-2xl shadow-2xl border-2 border-[#FFD700]/30"
            />
          </motion.div>

          {/* App Purpose Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="max-w-5xl mx-auto mb-16"
          >
            {/* Main Value Proposition */}
            <div className="bg-gradient-to-br from-black via-gray-900 to-black border-2 border-[#FFD700] rounded-2xl p-6 sm:p-10 mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white mb-6 text-center">
                THE COMPLETE COMPLAINT HANDLING SYSTEM
              </h2>
              
              <div className="space-y-6 text-white">
                <p className="text-base sm:text-lg leading-relaxed text-center max-w-3xl mx-auto">
                  <span className="text-white font-black text-xl">Chaos Controller is your complete dispute resolution partner—from first complaint to final resolution.</span>
                </p>
                
                <p className="text-base sm:text-lg leading-relaxed font-bold">
                  Whether your bank's charging unfair fees, your insurer rejected your claim, your landlord's refusing maintenance, or your energy provider's tripled your bill—this app gives you the complete toolkit to fight back and win.
                </p>

                <div className="bg-gradient-to-r from-[#FFD700]/20 via-[#C0392B]/20 to-[#FFD700]/20 border-2 border-[#FFD700] rounded-xl p-6 my-8">
                  <p className="text-white font-black text-center text-2xl mb-2 tracking-tight">
                    NO ONE TAKES YOU SERIOUS TILL YOU GET SERIOUS.
                  </p>
                  <p className="text-[#FFD700] text-center font-bold text-lg">
                    This is how you get serious.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-[#C0392B]/30 to-black border-2 border-[#C0392B] rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#C0392B] rounded-lg flex items-center justify-center mb-3">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-black mb-2 text-lg">BANKING DISPUTES</h3>
                    <p className="text-white font-bold text-sm">Unauthorized charges, failed transfers, account fees, loan disputes—escalate to AFCA with confidence.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#FFD700]/30 to-black border-2 border-[#FFD700] rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#FFD700] rounded-lg flex items-center justify-center mb-3">
                      <Home className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-white font-black mb-2 text-lg">INSURANCE CLAIMS</h3>
                    <p className="text-white font-bold text-sm">Rejected claims, delayed payouts, undervalued assessments—force accountability with documented evidence.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#27AE60]/30 to-black border-2 border-[#27AE60] rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#27AE60] rounded-lg flex items-center justify-center mb-3">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-black mb-2 text-lg">TENANCY ISSUES</h3>
                    <p className="text-white font-bold text-sm">Unfair bonds, neglected maintenance, illegal evictions—build NCAT-ready cases with complete documentation.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#9B59B6]/30 to-black border-2 border-[#9B59B6] rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#9B59B6] rounded-lg flex items-center justify-center mb-3">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-black mb-2 text-lg">TELCO PROBLEMS</h3>
                    <p className="text-white font-bold text-sm">Billing errors, service failures, contract disputes—escalate to TIO with professional complaint bundles.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#F39C12]/30 to-black border-2 border-[#F39C12] rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#F39C12] rounded-lg flex items-center justify-center mb-3">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-black mb-2 text-lg">UTILITIES</h3>
                    <p className="text-white font-bold text-sm">Power, water, gas—incorrect billing, service interruptions, disconnection threats—fight back organized.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#3498DB]/30 to-black border-2 border-[#3498DB] rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#3498DB] rounded-lg flex items-center justify-center mb-3">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-black mb-2 text-lg">AND MORE</h3>
                    <p className="text-white font-bold text-sm">Any consumer dispute — this system works for all industries. One platform, complete control.</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-8 mt-8">
                  <h3 className="text-xl font-display font-bold text-white mb-4 text-center">
                    EVERYTHING YOU NEED IN ONE PLACE
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-black/80 border-2 border-[#FFD700] rounded-xl p-6">
                      <h4 className="text-[#FFD700] font-black mb-4 flex items-center gap-2 text-lg">
                        <Check className="w-6 h-6" />
                        WHAT YOU GET
                      </h4>
                      <ul className="text-base space-y-3 text-white font-bold">
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700]">✓</span>
                          Secure evidence vault with AI document scanning
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700]">✓</span>
                          Automatic timeline builder tracking every interaction
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700]">✓</span>
                          Professional complaint letter generator
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700]">✓</span>
                          Deadline tracking with smart reminders
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700]">✓</span>
                          Tribunal-ready escalation bundles
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700]">✓</span>
                          Direct links to AFCA, TIO, NCAT, Energy & Water Ombudsman
                        </li>
                      </ul>
                    </div>
                    <div className="bg-black/80 border-2 border-[#FFD700] rounded-xl p-6">
                      <h4 className="text-[#FFD700] font-black mb-4 flex items-center gap-2 text-lg">
                        <Check className="w-6 h-6" />
                        HOW IT WORKS
                      </h4>
                      <ul className="text-base space-y-3 text-white font-bold">
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700] font-black">1.</span>
                          Upload your documents and evidence
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700] font-black">2.</span>
                          AI extracts key details automatically
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700] font-black">3.</span>
                          Answer guided questions about your dispute
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700] font-black">4.</span>
                          Generate professional complaint letters
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700] font-black">5.</span>
                          Track responses and deadlines
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#FFD700] font-black">6.</span>
                          Escalate with complete tribunal bundles if needed
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button 
              size="lg" 
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black px-8 py-6 text-lg font-black gap-2 border-2 border-[#FFD700]"
              onClick={() => navigate("/register")}
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              className="bg-[#C0392B] border-2 border-[#C0392B] text-white hover:bg-[#C0392B]/90 px-8 py-6 text-lg font-black"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </motion.div>

          {/* Banner Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="max-w-4xl mx-auto px-4 mb-0"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/fc5838d1b_IMG_6994.jpeg"
              alt="Chaos Controller - They Had Your Loyalty. Now You Deserve Their Accountability."
              className="w-full rounded-2xl shadow-2xl border-2 border-[#FFD700]/30"
            />
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
          TAKE BACK CONTROL
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-12" />
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.6 }}
                className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-xl hover:border-[#C0392B] transition-all"
                style={{ borderColor: feature.color }}
              >
                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${feature.color}1a` }}>
                  <Icon className="w-8 h-8" color={feature.color} />
                </div>
                <h3 className="font-heading font-black text-lg mb-3 text-white tracking-wide text-shadow">{feature.title}</h3>
                <p className="text-base text-gray-300 font-bold leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dispute Types */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
          BUILT FOR EVERY DISPUTE
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-12" />
        
        <div className="flex flex-wrap justify-center gap-6">
          {disputeTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                className="flex items-center gap-3 bg-gradient-to-r from-black to-gray-900 border-2 border-[#FFD700] px-6 py-4 rounded-lg hover:border-[#C0392B] transition-all"
              >
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: `${type.color}1a` }}>
                  <Icon className="w-6 h-6" color={type.color} />
                </div>
                <span className="font-heading font-black text-white tracking-wide text-lg text-shadow">{type.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
          CHOOSE YOUR PLAN
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-4" />
        <p className="text-center text-white font-bold mb-12 max-w-2xl mx-auto text-lg">
          Pay via PayID. Cancel anytime. No hidden fees.
        </p>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.6 }}
              className={`relative bg-gradient-to-br from-black to-gray-900 border-2 ${plan.popular ? 'border-[#FFD700]' : 'border-[#C0392B]'} rounded-2xl p-8 ${plan.popular ? 'ring-2 ring-[#FFD700]/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black px-4 py-1 rounded-full text-xs font-black">
                  MOST POPULAR
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="font-heading font-black text-2xl mb-2 text-white">{plan.name}</h3>
                <p className="text-base text-white font-bold mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-display font-black text-[#FFD700]">{plan.price}</span>
                  <span className="text-white font-bold ml-1">{plan.period}</span>
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
                className={`w-full border-2 ${plan.popular ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black border-[#FFD700]' : 'bg-[#C0392B] hover:bg-[#C0392B]/90 text-white border-[#C0392B]'}`}
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
            Start Your Case Today
          </Button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="bg-gradient-to-r from-[#C0392B] via-black to-[#C0392B] py-12 border-t-2 border-[#FFD700]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-black text-white mb-2">CHAOS CONTROLLER</h2>
          <p className="text-[#FFD700] font-bold text-lg mb-6">Designed & Developed by Deb King</p>
          <p className="text-white font-bold text-base mb-6">Glenmore Park 2025</p>
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