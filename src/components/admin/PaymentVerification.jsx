import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  CheckCircle2, XCircle, Clock, Wallet, Mail, User, 
  CreditCard, RefreshCw, ExternalLink, Copy, Check
} from "lucide-react";
import { useAdminPaymentMutation, useAdminSnapshot } from "@/lib/adminApi";

const planColors = {
  Starter: "#27AE60",
  Pro: "#FFD700",
  Command: "#CC0000"
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  verified: { label: "Verified ✓", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" }
};

export default function PaymentVerification() {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");
  const payidEmail = "djkingy79@gmail.com";

  const { data, isLoading } = useAdminSnapshot();
  const payments = data?.payments || [];
  const paymentMutation = useAdminPaymentMutation();

  const copyPayID = () => {
    navigator.clipboard.writeText(payidEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = payments.filter(p => filterStatus === "all" ? true : p.status === filterStatus);

  const pendingCount = payments.filter(p => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* PayID Info Banner */}
      <div className="bg-[#FFD700]/10 border-2 border-[#FFD700]/40 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Your PayID Receiving Address</p>
              <p className="text-xs text-muted-foreground">Customers pay to this address via PayID</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-background border border-border px-4 py-2 rounded-lg font-mono text-sm font-bold text-foreground">
              {payidEmail}
            </code>
            <Button size="sm" variant="outline" onClick={copyPayID} className="gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ⚠️ After receiving a payment, find the matching request below and click <strong className="text-foreground">Verify Payment</strong> to activate the user's subscription.
        </p>
      </div>

      {/* Filters + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {["pending", "verified", "rejected", "all"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                filterStatus === s
                  ? "bg-[#FFD700] text-black border-[#FFD700]"
                  : "bg-card border-border text-muted-foreground hover:border-[#FFD700]/40"
              }`}
            >
              {s === "pending" && pendingCount > 0 ? `Pending (${pendingCount})` : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-snapshot"] })}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Payment Requests List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading payments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground">No {filterStatus === "all" ? "" : filterStatus} payment requests</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filterStatus === "pending" ? "All caught up! No payments awaiting verification." : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment, idx) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`bg-card border rounded-xl p-5 ${
                payment.status === "pending" ? "border-yellow-500/30" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* User & Plan Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className="text-xs font-bold px-2.5 py-1 border"
                      style={{
                        backgroundColor: `${planColors[payment.plan_name] || "#666"}20`,
                        color: planColors[payment.plan_name] || "#666",
                        borderColor: `${planColors[payment.plan_name] || "#666"}40`
                      }}
                    >
                      {payment.plan_name} Plan
                    </Badge>
                    <span className="font-display font-bold text-lg text-foreground">{payment.amount} AUD</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusConfig[payment.status]?.color}`}>
                      {statusConfig[payment.status]?.label}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-foreground">{payment.user_name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{payment.user_email}</span>
                    </div>
                    {payment.payid_reference && (
                      <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span>Ref: <span className="text-foreground font-medium">{payment.payid_reference}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Submitted: {new Date(payment.created_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {payment.verified_date && (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Verified: {new Date(payment.verified_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    )}
                    {payment.subscription_expiry && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Expires: {new Date(payment.subscription_expiry).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {payment.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => paymentMutation.mutate({ paymentId: payment.id, action: "verify" })}
                      disabled={paymentMutation.isPending}
                      className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold gap-2 text-sm"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Verify Payment
                    </Button>
                    <Button
                      onClick={() => paymentMutation.mutate({ paymentId: payment.id, action: "reject" })}
                      disabled={paymentMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10 gap-2 text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
                {payment.status === "verified" && (
                  <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5" /> Active
                  </div>
                )}
                {payment.status === "rejected" && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                    <XCircle className="w-5 h-5" /> Rejected
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}