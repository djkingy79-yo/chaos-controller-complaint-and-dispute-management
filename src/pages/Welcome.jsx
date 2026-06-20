import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Trophy,
  Lock,
  Star,
  CheckCircle2,
  Eye,
  ArrowLeft
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

const sampleReports = [
  {
    id: 1,
    title: "Banking Dispute - Unauthorised Transaction",
    category: "banking",
    organisation: "National Australia Bank",
    status: "resolved",
    outcome: "Full refund of $2,450",
    duration: "6 weeks",
    strength: 92,
    description: "Customer disputed unauthorised transactions totaling $2,450. Evidence included bank statements, police report, and correspondence. Escalated to AFCA after bank initially rejected claim.",
    keyElements: ["Timeline of 12 events", "8 evidence documents", "AFCA escalation bundle", "Successful resolution"],
  },
  {
    id: 2,
    title: "Insurance Claim - Storm Damage",
    category: "insurance",
    organisation: "Allianz Insurance",
    status: "resolved",
    outcome: "Claim approved - $18,500 settlement",
    duration: "10 weeks",
    strength: 88,
    description: "Home insurance claim for storm damage initially denied. Comprehensive evidence package including photos, repair quotes, and meteorological data. Escalated to AFCA with full tribunal bundle.",
    keyElements: ["Photo evidence (15 files)", "3 repair quotes", "Weather bureau data", "Detailed timeline"],
  },
  {
    id: 3,
    title: "Tenancy Dispute - Bond Return",
    category: "tenancy",
    organisation: "ABC Real Estate",
    status: "resolved",
    outcome: "Full bond returned - $4,200",
    duration: "8 weeks",
    strength: 85,
    description: "Landlord withheld bond claiming property damage. Tenant provided entry/exit reports, photos, and cleaning receipts. NCAT tribunal hearing resulted in full bond return.",
    keyElements: ["Entry/exit reports", "Timestamped photos", "Cleaning receipts", "NCAT application"],
  },
  {
    id: 4,
    title: "Telco Dispute - Unfair Charges",
    category: "telco",
    organisation: "Telstra",
    status: "resolved",
    outcome: "$890 credit + contract cancellation",
    duration: "5 weeks",
    strength: 90,
    description: "Disputed unfair early termination fees and incorrect billing. Evidence included call records, billing statements, and customer service transcripts. TIO escalation secured full credit.",
    keyElements: ["Billing statements", "Call recordings", "Email correspondence", "TIO submission"],
  },
  {
    id: 5,
    title: "Utilities Dispute - Incorrect Billing",
    category: "utilities",
    organisation: "Origin Energy",
    status: "resolved",
    outcome: "$1,200 billing adjustment",
    duration: "7 weeks",
    strength: 87,
    description: "Challenged estimated meter readings and inflated bills. Provided actual meter photos, historical usage data, and EWON escalation. Provider corrected billing.",
    keyElements: ["Meter reading photos", "Usage history", "Billing comparison", "EWON submission"],
  }
];

const statusConfig = {
  resolved: { label: "Resolved", className: "bg-success/15 text-success border-success/30" },
  escalated: { label: "Escalated", className: "bg-warning/15 text-warning border-warning/30" },
  pending: { label: "Pending", className: "bg-secondary text-secondary-foreground border-border" }
};

const categoryIcons = {
  banking: "🏦",
  insurance: "🛡️",
  tenancy: "🏠",
  telco: "📱",
  utilities: "⚡"
};

const plans = [
  {
    name: "Starter",
    price: "$9.99",
    period: "AUD/month",
    description: "For single disputes",
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
    cta: "Select Plan",
    popular: false,
    sampleLetter: `To the Complaints Manager,
Commonwealth Bank of Australia
GPO Box 9925, Sydney NSW 2001

Dear Complaints Manager,

RE: Formal Complaint — Unauthorised Transaction & Failure to Refund

I am writing to formally lodge a complaint regarding an unauthorised transaction of $1,247.50 debited from my account (Account No: 062-001 1234 5678) on 14 March 2026, which I did not authorise.

I immediately contacted your customer service on 15 March 2026 and was advised a dispute had been lodged (Reference: CBA-2026-44821). Despite your organisation's commitment to resolve disputes within 21 days, I am yet to receive any substantive response or refund as at the date of this letter.

Under the Australian Banking Code of Practice and the ePayments Code, I am entitled to a full refund of this unauthorised transaction. I request that Commonwealth Bank:

1. Immediately refund the full amount of $1,247.50 to my account;
2. Provide written confirmation of the refund within 5 business days;
3. Confirm the security measures taken to prevent recurrence.

Should I not receive a satisfactory resolution within 21 days from the date of this letter, I will have no choice but to escalate this matter to the Australian Financial Complaints Authority (AFCA).

Yours sincerely,

Jane Smith
123 Example Street, Parramatta NSW 2150
jane.smith@email.com | 0400 000 000
Date: 16 June 2026`,
    lockedFeatures: ["2nd & 3rd Complaint Letters", "Escalation Letter to AFCA", "Accept/Deny Offer Letters", "Full Tribunal Bundle PDF"]
  },
  {
    name: "Pro",
    price: "$15.99",
    period: "AUD/month",
    description: "For serious & ongoing disputes",
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
    cta: "Select Plan",
    popular: true,
    sampleLetter: `To the Telecommunications Industry Ombudsman
PO Box 276, Collins Street West VIC 8007

Dear TIO Case Officer,

RE: Escalation of Unresolved Dispute — Telstra Corporation — Account No: 0412 345 678

I am writing to formally escalate my dispute with Telstra Corporation to the Telecommunications Industry Ombudsman (TIO), having exhausted all internal complaint processes without satisfactory resolution.

BACKGROUND
On 2 January 2026, Telstra applied an erroneous $340.00 international roaming charge to my account despite my having purchased and activated an international roaming pack prior to travel. I contacted Telstra on three separate occasions (2 Jan, 15 Jan, and 3 Feb 2026) and submitted two formal written complaints. Each time I was advised the matter was "under review."

TELSTRA'S RESPONSE
Telstra's final response dated 10 March 2026 (Ref: TLS-2026-98234) offered a goodwill credit of $50.00, which I rejected as inadequate given the erroneous charge was $340.00 and caused direct financial hardship.

WHAT I AM SEEKING
1. Full reversal of the $340.00 erroneous charge;
2. Compensation of $150.00 for time and inconvenience;
3. Formal written apology.

I have enclosed copies of all correspondence, account statements, and my international roaming pack activation confirmation.

Yours faithfully,

Michael Johnson
45 Sample Road, Chatswood NSW 2067
michael.j@email.com | 0455 111 222
Date: 16 June 2026`,
    lockedFeatures: ["Chaos Score analytics", "ZIP bundle export"]
  },
  {
    name: "Command",
    price: "$19.99",
    period: "AUD/month",
    description: "Maximum firepower",
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
    cta: "Select Plan",
    popular: false,
    sampleLetter: `To the Claims Manager,
Allianz Australia Insurance Limited
GPO Box 4049, Sydney NSW 2001

RE: Acceptance of Settlement Offer — Claim No: ALZ-2026-77321
Your Reference: Settlement Offer Letter dated 5 June 2026

Dear Claims Manager,

I write in response to your settlement offer of $18,500.00 in full and final resolution of my home contents claim (Claim No: ALZ-2026-77321) lodged on 14 February 2026 following a burglary at my property.

After careful consideration, and without prejudice to my rights under the Insurance Contracts Act 1984 (Cth), I accept the offered amount of $18,500.00 in full and final settlement of this claim on the following conditions:

1. Payment is made within 10 business days of this letter;
2. Allianz provides written confirmation that the claim is fully settled and no further action will be taken to recover any portion of the settlement;
3. My policy remains in force and no adverse notation is made against my claims history.

Please arrange for the funds to be transferred to my nominated bank account (BSB: 062-001, Account: 9876 5432) and forward the settlement deed for my execution.

I trust this brings the matter to a satisfactory conclusion.

Yours sincerely,

Sarah Williams
78 Test Avenue, Penrith NSW 2750
sarah.w@email.com | 0422 333 444
Date: 16 June 2026`,
    lockedFeatures: []
  }
];

export default function Welcome() {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-black to-red-500/5" />
        
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-10 sm:py-16 md:py-24">
          {/* Logo - FIRST */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2abe4b26d_62A57800-C260-44AE-82CD-FBB72A1966D0.jpg"
              alt="Chaos Controller"
              className="w-full max-w-2xl mx-auto object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Branding Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center mb-8 sm:mb-10"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/905937e41_IMG_7337.jpg"
              alt="The Only Complaint & Dispute App That's 100% Got Your Back"
              className="w-full max-w-3xl mx-auto object-contain"
            />
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-5"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tighter leading-tight">
              <span className="text-white drop-shadow-lg">Welcome to</span>
              <span className="text-[#FFD700] ml-2 sm:ml-3 drop-shadow-lg" style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.5)" }}>Chaos!</span>
            </h1>
          </motion.div>

          {/* Tagline on Red Band */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-block bg-[#C0392B] px-5 sm:px-8 py-2.5 sm:py-3 rounded-sm">
              <p className="text-white font-bold tracking-widest text-xs sm:text-sm md:text-base">
                NEVER FEAR. CONTROL STARTS HERE.
              </p>
            </div>
          </motion.div>

          {/* Branding Banner - THE ONLY COMPLAINT & DISPUTE APP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-8 sm:mb-10"
          >
            <div className="inline-block bg-black px-6 sm:px-10 py-4 sm:py-5 border-y-4 border-[#D4A017]">
              <p className="text-[#D4A017] font-black tracking-wide text-sm sm:text-base md:text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: "uppercase" }}>
                THE ONLY COMPLAINT & DISPUTE APP<br className="hidden sm:block" />
                THAT'S 100% GOT YOUR BACK
              </p>
            </div>
          </motion.div>

          {/* Quick explainer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mb-6 sm:mb-8"
          >
            <p className="text-sm sm:text-base md:text-lg text-white max-w-xl mx-auto leading-relaxed font-black px-2">
              Chaos Controller is an AI-powered app that helps everyday Australians fight back against banks, insurers, landlords, and telcos — by organising your evidence, writing your complaints, and tracking every deadline for you.
            </p>
          </motion.div>

          {/* Hero statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mb-6 sm:mb-8"
          >
            <p className="text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto leading-relaxed font-black px-2">
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
            className="text-center mb-10 sm:mb-12"
          >
            <Button
              size="lg"
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl font-black gap-2 border-2 border-[#FFD700] shadow-lg shadow-yellow-500/30 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
              onClick={() => navigate("/register")}
            >
              START YOUR CASE <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
            className="w-full mb-8 sm:mb-10 overflow-hidden"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/d6fa8007a_1494D044-1ED5-4BFF-9EF4-C2A80D01A494.png"
              alt="Chaos Controller — They Had Your Loyalty. Now You Deserve Their Accountability."
              className="w-full rounded-xl sm:rounded-2xl shadow-2xl border border-[#FFD700]/30"
              style={{ maxWidth: "100%", height: "auto", display: "block" }}
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

                <div className="w-full overflow-hidden rounded-xl my-6">
                  <img
                    src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/75204b1fa_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png"
                    alt="Chaos Controller — They Had Your Loyalty. Now You Deserve Their Accountability."
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
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
            className="w-full mb-0 overflow-hidden"
          >
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/0b99217c2_CF9B071E-D876-484A-95EA-29F9621FB84C.png"
              alt="Chaos Controller - Never Fear. Control Starts Here."
              className="w-full rounded-xl sm:rounded-2xl shadow-2xl border border-[#FFD700]/30"
              style={{ maxWidth: "100%", height: "auto", display: "block" }}
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

      {/* Sample Reports Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
          REAL SUCCESS STORIES
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-4" />
        <p className="text-center text-white font-bold mb-12 max-w-2xl mx-auto text-lg">
          See how others have fought back and won using Chaos Controller
        </p>

        {!selectedReport ? (
          <div className="grid gap-4">
            {sampleReports.map((report, idx) => {
              const status = statusConfig[report.status];
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  onClick={() => setSelectedReport(report)}
                  className="cursor-pointer bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700]/30 rounded-xl p-6 hover:border-[#FFD700]/60 hover:shadow-lg hover:shadow-[#FFD700]/10 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{categoryIcons[report.category]}</span>
                        <Badge className={`${status.className} border`}>
                          {status.label}
                        </Badge>
                        <span className="text-xs text-gray-400 font-medium">
                          {report.duration}
                        </span>
                      </div>
                      
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-[#FFD700] transition-colors">
                        {report.title}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-4">
                        {report.description}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-white font-medium">{report.outcome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-[#FFD700]" />
                          <span className="text-gray-400">{report.keyElements.length} key elements</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-display font-bold text-[#FFD700]">
                        {report.strength}%
                      </div>
                      <div className="text-xs text-gray-400">
                        Matter Strength
                      </div>
                      <Eye className="w-5 h-5 text-gray-400 group-hover:text-[#FFD700] transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Report Detail */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Back Button */}
            <Button variant="outline" onClick={() => setSelectedReport(null)} className="gap-2 border-gray-700 text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4" /> Back to Reports
            </Button>

            {/* Report Header */}
            <div className="bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{categoryIcons[selectedReport.category]}</span>
                    <Badge className={`${statusConfig[selectedReport.status].className} border`}>
                      {statusConfig[selectedReport.status].label}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    {selectedReport.title}
                  </h2>
                  <p className="text-gray-400">vs {selectedReport.organisation}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-display font-bold text-[#FFD700] mb-1">
                    {selectedReport.strength}%
                  </div>
                  <div className="text-sm text-gray-400">Matter Strength</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Outcome</div>
                  <div className="font-semibold text-success">{selectedReport.outcome}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Duration</div>
                  <div className="font-semibold text-white">{selectedReport.duration}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Category</div>
                  <div className="font-semibold text-white capitalize">{selectedReport.category}</div>
                </div>
              </div>
            </div>

            {/* Case Summary */}
            <div className="bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700]/30 rounded-xl p-6">
              <h3 className="font-heading font-bold text-lg text-white mb-4">Case Summary</h3>
              <p className="text-gray-300 leading-relaxed">{selectedReport.description}</p>
            </div>

            {/* Key Elements */}
            <div className="bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700]/30 rounded-xl p-6">
              <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Key Success Elements
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {selectedReport.keyElements.map((element, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm font-medium text-white">{element}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-[#FFD700]/20 via-[#C0392B]/20 to-[#FFD700]/20 border-2 border-[#FFD700]/40 rounded-xl p-6 text-center">
              <h3 className="font-heading font-bold text-lg text-white mb-2">
                Ready to Build Your Own Case?
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                These examples show what's possible with strong documentation and the right approach.
              </p>
              <Button onClick={() => navigate("/new-case")} className="gap-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold">
                Start Your Case <FileText className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
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

      {/* Pricing Section with Sample Previews */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-center mb-4 text-white">
          CHOOSE YOUR PLAN
        </h2>
        <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-4" />
        <p className="text-center text-white font-bold mb-12 max-w-2xl mx-auto text-lg">
          Pay via PayID. Cancel anytime. No hidden fees.
        </p>
        
        {/* Plan Selector Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {plans.map((plan, i) => (
            <motion.button
              key={plan.name}
              onClick={() => setActivePlan(i)}
              whileTap={{ scale: 0.97 }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${activePlan === i ? "border-[#FFD700] bg-[#FFD700]/10" : "border-gray-800 hover:border-gray-600 bg-gray-900"}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-3 bg-[#FFD700] text-black font-bold text-xs">POPULAR</Badge>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.popular ? 'bg-[#FFD700]/20' : 'bg-[#C0392B]/20'}`}>
                  <FileText className={`w-5 h-5 ${plan.popular ? 'text-[#FFD700]' : 'text-[#C0392B]'}`} />
                </div>
                <span className="font-bold text-white">{plan.name}</span>
              </div>
              <p className="text-sm font-bold" style={{ color: plan.popular ? '#FFD700' : '#C0392B' }}>{plan.price} {plan.period}</p>
              <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Sample Letter Preview */}
        <motion.div
          key={activePlan}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-8"
        >
          {/* Letter Header Banner */}
          <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: plans[activePlan].popular ? '#FFD700' : '#C0392B' }}>
            <FileText className="w-5 h-5 text-white" />
            <div>
              <p className="font-bold text-white text-sm">{plans[activePlan].name} Plan — Sample Document</p>
              <p className="text-white/80 text-xs">1st Formal Complaint Letter — {plans[activePlan].name === "Starter" ? "Banking" : plans[activePlan].name === "Pro" ? "Telco" : "Insurance"}</p>
            </div>
          </div>

          {/* Letter Body */}
          <div className="p-6 sm:p-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-2xl font-black text-black" style={{ fontFamily: "Times New Roman, serif" }}>CHAOS CONTROLLER™</p>
                <p className="text-xs text-gray-500">Consumer Advocacy Platform</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">SAMPLE DOCUMENT</p>
                <p className="text-xs text-gray-400">Generated: 16 June 2026</p>
              </div>
            </div>
            <hr className="border-gray-300 mb-6" />
            <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed" style={{ fontFamily: "Times New Roman, serif" }}>
              {plans[activePlan].sampleLetter}
            </pre>
          </div>
        </motion.div>

        {/* Locked Features */}
        {plans[activePlan].lockedFeatures?.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-8">
            <p className="font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> Also included in higher tiers:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {plans[activePlan].lockedFeatures.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {plans[activePlan].lockedFeatures?.length === 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-8 flex items-center gap-3">
            <Star className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-white font-bold">Command plan includes everything — all 6 letters, full PDF bundle, Chaos Score, and ZIP export.</p>
          </div>
        )}
        
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

        {/* CTA */}
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-6 mt-12 text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">Ready to fight back?</h3>
          <p className="text-gray-400 text-sm mb-4">Get started with your first case today — pay via PayID in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-8"
              onClick={() => navigate("/payments")}
            >
              View Plans & Pay
            </Button>
            <Button
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
              onClick={() => navigate("/register")}
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </div>

      {/* Banner Image between pricing and footer CTA */}
      <div className="w-full overflow-hidden">
        <img
          src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9cd7e60cb_CF9B071E-D876-484A-95EA-29F9621FB84C.png"
          alt="Chaos Controller — Never Fear. Control Starts Here."
          className="w-full"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
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
          {/* Footer Logo */}
          <div className="mb-8">
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/43ffd1867_67B5CC10-D393-47DF-871D-C5B37790EF8E.png"
              alt="Chaos Controller — Never Fear. Control Starts Here."
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