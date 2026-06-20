import React from "react";
import { motion } from "framer-motion";
import { FolderOpen, Clock, Scale, Shield, Home, Building2, Phone, Zap, Briefcase, AlertTriangle, FileText, Upload } from "lucide-react";

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
  { icon: Zap, label: "UTILITIES", color: "#F39C12" },
  { icon: Briefcase, label: "GOVERNMENT AGENCIES", color: "#3498DB" },
  { icon: AlertTriangle, label: "CONSUMER COMPLAINTS", color: "#008000" }
];

export default function FeaturesSection() {
  return (
    <>
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
    </>
  );
}