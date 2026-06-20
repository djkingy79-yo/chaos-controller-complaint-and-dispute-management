import React from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/welcome/HeroSection";
import FeaturesSection from "@/components/welcome/FeaturesSection";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection onGetStarted={() => navigate("/register")} onSignIn={() => navigate("/login")} />
      
      <FeaturesSection />

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