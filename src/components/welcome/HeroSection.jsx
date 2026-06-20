import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Upload, FileText, CalendarCheck, Layers, Bell, Trophy } from "lucide-react";

export default function HeroSection({ onGetStarted, onSignIn }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-black to-red-500/5" />
      
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-10 sm:py-16 md:py-24">
        {/* Logo */}
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
          <p className="text-white font-bold text-sm mt-3 tracking-wide">
            Created by Deb King
          </p>
        </motion.div>

        {/* Branding Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-block bg-black px-6 sm:px-10 py-4 sm:py-5 border-y-4 border-[#D4A017]">
            <p className="text-[#D4A017] font-black tracking-wide text-sm sm:text-base md:text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: "uppercase" }}>
              THE ONLY COMPLAINT & DISPUTE APP <br className="hidden sm:block" />
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
          <p className="text-sm sm:text-base md:text-lg text-white max-w-2xl mx-auto leading-relaxed font-black px-2">
            Chaos Controller is an AI-powered app that helps everyday Australians fight back against banks, insurers, landlords, telcos, utilities, and government agencies — by organising your evidence, writing your complaints, and tracking every deadline for you.
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
            onClick={onGetStarted}
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
                { icon: CalendarCheck, color: "#27AE60", title: "CALENDAR SYNC", desc: "Deadlines automatically sync to Google Calendar and Outlook Calendar. Never miss a response date — your dispute schedule lives where you work." },
                { icon: Layers, color: "#9B59B6", title: "TIMELINE BUILDER", desc: "Every interaction, letter, and evidence piece is plotted on an automatic timeline — the full accountability record, always ready for tribunal." },
                { icon: Bell, color: "#F39C12", title: "AUTOMATED EMAILS", desc: "Smart notifications for overdue responses, upcoming deadlines, and missing evidence. Daily summaries keep you on track without checking the app." },
                { icon: Trophy, color: "#3498DB", title: "MERCHANT PLATFORM", desc: "Invite organisations to view your case and respond online. Shared portals streamline communication and create a documented response trail." },
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
            alt="Chaos Controller"
            className="w-full rounded-xl sm:rounded-2xl shadow-2xl border border-[#FFD700]/30"
            style={{ maxWidth: "100%", height: "auto", display: "block" }}
          />
        </motion.div>
      </div>
    </div>
  );
}