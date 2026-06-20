import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Lock, Star, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    sampleLetters: {
      letter1: `To the Complaints Manager,
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
Date: 16 June 2026`
    },
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
    sampleLetters: {
      letter1: `To the Complaints Manager,
Telstra Corporation Limited
GPO Box 999, Melbourne VIC 3001

Dear Complaints Manager,

RE: Formal Complaint — Erroneous International Roaming Charges

I am writing to formally complain about incorrect charges applied to my account (Account No: 0412 345 678).

On 2 January 2026, I was charged $340.00 for international roaming despite having purchased and activated an international roaming pack prior to travel. I contacted your customer service on 2 January 2026 (Reference: TLS-2026-11234) and was advised the charges would be reversed within 5 business days.

As at the date of this letter, the charges remain on my account and I have received no refund.

I request that Telstra:
1. Immediately reverse the $340.00 erroneous charge;
2. Provide written confirmation of the reversal within 5 business days;
3. Confirm that no interest or late fees have been applied.

Should I not receive a satisfactory resolution within 21 days, I will escalate this matter to the Telecommunications Industry Ombudsman (TIO).

Yours sincerely,

Michael Johnson
45 Sample Road, Chatswood NSW 2067
michael.j@email.com | 0455 111 222
Date: 16 June 2026`,
      letter2: `To the Complaints Manager,
Telstra Corporation Limited
GPO Box 999, Melbourne VIC 3001

Dear Complaints Manager,

RE: Second Complaint — Unresolved Erroneous Charges — Account No: 0412 345 678

I write further to my first complaint dated 2 January 2026 (Reference: TLS-2026-11234) regarding erroneous international roaming charges of $340.00.

Despite your commitment to resolve this matter within 21 days, I have received no substantive response. The erroneous charges remain on my account and continue to accrue interest.

This is my second formal complaint. I expect immediate resolution within 10 business days from the date of this letter.

Should this matter remain unresolved, I will escalate to the Telecommunications Industry Ombudsman (TIO).

Yours sincerely,

Michael Johnson
45 Sample Road, Chatswood NSW 2067
michael.j@email.com | 0455 111 222
Date: 16 June 2026`,
      letter3: `To the Complaints Manager,
Telstra Corporation Limited
GPO Box 999, Melbourne VIC 3001

Dear Complaints Manager,

RE: Third and Final Complaint — Account No: 0412 345 678

This is my third and final written complaint regarding erroneous charges of $340.00 applied to my account.

I have exhausted all internal complaint processes:
- First complaint: 2 January 2026 (no response)
- Second complaint: 23 January 2026 (no response)

I will allow 10 business days from the date of this letter for a final response. Should I not receive satisfactory resolution, I will immediately escalate this matter to the Telecommunications Industry Ombudsman (TIO).

Yours sincerely,

Michael Johnson
45 Sample Road, Chatswood NSW 2067
michael.j@email.com | 0455 111 222
Date: 16 June 2026`,
      accept_offer: `To the Claims Manager,
Allianz Australia Insurance Limited
GPO Box 4049, Sydney NSW 2001

RE: Acceptance of Settlement Offer — Claim No: ALZ-2026-77321

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
      deny_offer: `To the Claims Manager,
Allianz Australia Insurance Limited
GPO Box 4049, Sydney NSW 2001

RE: Rejection of Settlement Offer — Claim No: ALZ-2026-77321

Dear Claims Manager,

I write in response to your settlement offer of $12,000.00 dated 5 June 2026.

After careful consideration, I must reject this offer as it does not adequately compensate my loss of $18,500.00. The evidence clearly supports my claim for the full amount.

I request that Allianz review this matter and provide a revised offer within 10 business days. Should a satisfactory resolution not be reached, I will escalate this matter to AFCA.

Yours sincerely,

Sarah Williams
78 Test Avenue, Penrith NSW 2750
sarah.w@email.com | 0422 333 444
Date: 16 June 2026`,
      escalation: `To the Telecommunications Industry Ombudsman
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
Date: 16 June 2026`
    },
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
    sampleLetters: {
      letter1: `To the Complaints Manager,
Commonwealth Bank of Australia
GPO Box 9925, Sydney NSW 2001

Dear Complaints Manager,

RE: Formal Complaint — Unauthorised Transaction

I am writing to formally lodge a complaint regarding an unauthorised transaction of $1,247.50 debited from my account on 14 March 2026.

I request immediate refund and written confirmation within 5 business days.

Yours sincerely,

Jane Smith
Date: 16 June 2026`,
      letter2: `To the Complaints Manager,
Commonwealth Bank of Australia

RE: Second Complaint — Unresolved

I write further to my first complaint. No response received.

Yours sincerely,

Jane Smith
Date: 16 June 2026`,
      letter3: `To the Complaints Manager,
Commonwealth Bank of Australia

RE: Third and Final Complaint

This is my final complaint before AFCA escalation.

Yours sincerely,

Jane Smith
Date: 16 June 2026`,
      accept_offer: `To the Claims Manager,
Allianz Australia Insurance Limited

RE: Acceptance of Settlement Offer

I accept your settlement offer of $18,500.00.

Yours sincerely,

Sarah Williams
Date: 16 June 2026`,
      deny_offer: `To the Claims Manager,
Allianz Australia Insurance Limited

RE: Rejection of Settlement Offer

I reject your offer as inadequate.

Yours sincerely,

Sarah Williams
Date: 16 June 2026`,
      escalation: `To AFCA
GPO Box 3, Melbourne VIC 3001

RE: Escalation — Commonwealth Bank

I escalate my unresolved dispute.

Yours faithfully,

Jane Smith
Date: 16 June 2026`
    },
    lockedFeatures: []
  }
];

const letterTypeLabels = {
  letter1: "1st Complaint Letter",
  letter2: "2nd Complaint Letter",
  letter3: "3rd & Final Complaint",
  accept_offer: "Accept Offer Letter",
  deny_offer: "Deny Offer Letter",
  escalation: "Escalation Letter"
};

export default function PricingSection() {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(0);
  const [activeLetterType, setActiveLetterType] = useState("letter1");

  return (
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

      {/* Letter Type Selector */}
      {Object.keys(plans[activePlan].sampleLetters).length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(letterTypeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setActiveLetterType(type)}
              className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                activeLetterType === type
                  ? "bg-[#FFD700] text-black border-[#FFD700] font-bold"
                  : "bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Sample Letter Preview */}
      <motion.div
        key={`${activePlan}-${activeLetterType}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-8"
      >
        {/* Letter Header Banner */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: plans[activePlan].popular ? '#FFD700' : '#C0392B' }}>
          <FileText className="w-5 h-5 text-white" />
          <div>
            <p className="font-bold text-white text-sm">{plans[activePlan].name} Plan — {letterTypeLabels[activeLetterType]}</p>
            <p className="text-white/80 text-xs">Sample Document</p>
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
            {plans[activePlan].sampleLetters[activeLetterType]}
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
  );
}