import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Eye, ArrowLeft, FolderOpen } from "lucide-react";
import HeroSection from "@/components/welcome/HeroSection";
import FeaturesSection from "@/components/welcome/FeaturesSection";
import PricingSection from "@/components/welcome/PricingSection";

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

export default function Welcome() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection onGetStarted={() => navigate("/register")} onSignIn={() => navigate("/login")} />
      
      <FeaturesSection />

      <PricingSection />

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Button variant="outline" onClick={() => setSelectedReport(null)} className="gap-2 border-gray-700 text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4" /> Back to Reports
            </Button>

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

            <div className="bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700]/30 rounded-xl p-6">
              <h3 className="font-heading font-bold text-lg text-white mb-4">Case Summary</h3>
              <p className="text-gray-300 leading-relaxed">{selectedReport.description}</p>
            </div>

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

      {/* Banner Image */}
      <div className="w-full overflow-hidden">
        <img
          src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9cd7e60cb_CF9B071E-D876-484A-95EA-29F9621FB84C.png"
          alt="Chaos Controller"
          className="w-full"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </div>

      {/* Footer CTA */}
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