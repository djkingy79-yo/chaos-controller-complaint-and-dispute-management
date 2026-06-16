import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, AlertCircle, Shield } from "lucide-react";

export default function MerchantLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Token from a share link — pre-validates on first login
  const token = searchParams.get("token") || "";

  // If already logged in, redirect
  useEffect(() => {
    const session = sessionStorage.getItem("merchant_session");
    if (session) navigate("/merchant-portal", { replace: true });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { base44 } = await import("@/api/base44Client");
      const res = await base44.functions.invoke("getMerchantCases", { email: email.trim().toLowerCase(), token });
      if (!res.data?.success) throw new Error(res.data?.error || "Login failed");
      // Store session in sessionStorage (clears on tab close)
      sessionStorage.setItem("merchant_session", JSON.stringify({
        email: email.trim().toLowerCase(),
        name: res.data.merchant_name,
        token
      }));
      navigate("/merchant-portal", { replace: true });
    } catch (err) {
      setError(err.message || "Could not verify your access. Check your email and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/9d65d2d51_IMG_6994.jpeg"
            alt="Chaos Controller"
            className="w-full max-w-xs mx-auto rounded-xl object-cover mb-4"
            style={{ maxHeight: 80 }}
          />
          <p className="text-[#FFD700] font-mono text-xs font-bold uppercase tracking-widest">Merchant Portal Access</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h1 className="text-white font-display font-black text-lg">Secure Login</h1>
              <p className="text-gray-400 text-xs">Enter the email address your dispute was shared with</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@business.com.au"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/30 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Access My Cases <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-gray-600 text-[11px] text-center mt-5 leading-relaxed">
            Access is granted only to email addresses that have been invited by the complainant.
            Your session is secure and expires when you close this tab.
          </p>
        </div>

        <p className="text-gray-700 text-xs text-center mt-6">
          Powered by <span className="text-[#FFD700]">Chaos Controller™</span> — AI-Powered Consumer Advocacy
        </p>
      </motion.div>
    </div>
  );
}