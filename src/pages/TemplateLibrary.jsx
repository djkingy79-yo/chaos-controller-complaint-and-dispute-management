import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Copy, Check, Search, FileText, Building2, Phone, Zap, Shield, Home, Scale, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const categories = [
  { id: "all", label: "All Templates", icon: FileText },
  { id: "banking", label: "Banking", icon: Building2, color: "#CC0000" },
  { id: "insurance", label: "Insurance", icon: Shield, color: "#660099" },
  { id: "tenancy", label: "Tenancy", icon: Home, color: "#0066CC" },
  { id: "telco", label: "Telco", icon: Phone, color: "#9B59B6" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#F39C12" },
  { id: "general", label: "General", icon: Scale, color: "#27AE60" },
];

const templates = [
  // BANKING
  {
    id: "bank-fees",
    category: "banking",
    title: "Unauthorised Fee Dispute",
    description: "Challenge unexpected or unexplained charges on your account.",
    body: `Dear [Bank Name] Complaints Department,

I am writing to formally dispute an unauthorised fee charged to my account [Account Number] on [Date].

I have been a loyal customer since [Year] and have not been provided with adequate notice or justification for this charge.

The fee of $[Amount] was applied without my consent and is not consistent with my current account terms and conditions. I request an immediate investigation and full refund of this charge.

I also request written confirmation of the reason for this charge within 5 business days.

Under the Banking Code of Practice, I am entitled to transparent and fair treatment regarding account fees.

If this matter is not resolved to my satisfaction within 30 days, I will escalate my complaint to the Australian Financial Complaints Authority (AFCA) at www.afca.org.au.

Please contact me at [Your Email] or [Your Phone] to discuss this matter.

Yours sincerely,
[Your Full Name]
[Your Address]
[Date]`
  },
  {
    id: "bank-transfer",
    category: "banking",
    title: "Failed or Delayed Transfer",
    description: "Request investigation into a transfer that didn't arrive or was delayed.",
    body: `Dear [Bank Name] Complaints Department,

I am writing regarding a failed/delayed transfer from my account [Account Number] on [Date].

On [Date], I initiated a transfer of $[Amount] to [Recipient Name] (BSB: [BSB], Account: [Account Number]). As of [Today's Date], the funds have not been received by the intended recipient.

This delay has caused significant financial inconvenience including [describe impact].

I request:
1. Immediate investigation into the whereabouts of these funds
2. Same-day resolution or a written update within 24 hours
3. Compensation for any fees or losses incurred due to this delay

Under the ePayments Code, I am entitled to a resolution within a reasonable timeframe.

If this is not resolved within 5 business days, I will escalate to AFCA.

Yours sincerely,
[Your Full Name]
[Your Address]
[Date]`
  },
  {
    id: "bank-hardship",
    category: "banking",
    title: "Financial Hardship Request",
    description: "Request hardship assistance or repayment variation on a loan.",
    body: `Dear [Bank Name] Hardship Team,

I am writing to formally request hardship assistance in relation to my [Loan/Credit Card] account [Account Number].

Due to [reason - job loss/illness/relationship breakdown], I am currently experiencing genuine financial difficulty and am unable to meet my current repayment obligations of $[Amount] per [week/fortnight/month].

I am requesting:
- A temporary repayment reduction to $[Proposed Amount] for [Duration]
- OR a repayment pause for [Number] months
- Waiver of any fees associated with this variation

I am committed to repaying my debt and this request is to allow me time to stabilise my financial situation.

Supporting documentation is available upon request including [list documents].

Under the National Consumer Credit Protection Act 2009, I am entitled to make a hardship request and have it considered fairly.

Please respond within 21 days as required by law.

Yours sincerely,
[Your Full Name]
[Your Address]
[Date]`
  },

  // INSURANCE
  {
    id: "insurance-rejection",
    category: "insurance",
    title: "Rejected Claim Dispute",
    description: "Challenge an insurer's decision to deny your claim.",
    body: `Dear [Insurance Company] Internal Disputes Resolution Team,

I am writing to formally dispute the rejection of my insurance claim [Claim Number] dated [Date].

My claim was rejected on the grounds of [stated reason]. I believe this decision is incorrect and does not accurately reflect the circumstances of the incident or the terms of my policy [Policy Number].

Specifically:
- The policy terms at clause [X] clearly cover [type of event]
- The incident occurred on [Date] and is documented by [evidence type]
- I have maintained my policy in good standing since [Year]

I request:
1. A full review of my claim by a senior assessor
2. Written explanation of all reasons for rejection referencing specific policy clauses
3. Reconsideration in light of the enclosed supporting documentation

If this matter is not resolved within 45 days, I will escalate to the Australian Financial Complaints Authority (AFCA).

Yours sincerely,
[Your Full Name]
[Policy Number]
[Date]`
  },
  {
    id: "insurance-delay",
    category: "insurance",
    title: "Delayed Claim Payout",
    description: "Demand resolution of a claim that has been unreasonably delayed.",
    body: `Dear [Insurance Company] Complaints Department,

I am writing to formally complain about the unreasonable delay in processing my insurance claim [Claim Number], lodged on [Date].

It has now been [X] weeks/months since I submitted my claim, with no clear resolution in sight. I have contacted your team on [dates] and been advised of ongoing delays without explanation.

This delay has caused me significant hardship including [financial impact, stress, inability to repair property, etc.].

I formally request:
1. Payment of my claim within 10 business days
2. Written update within 3 business days explaining all outstanding requirements
3. Compensation for losses incurred due to your delay

The General Insurance Code of Practice requires claims to be handled in a fair, transparent and timely manner.

If I do not receive a satisfactory response within 10 business days, I will escalate to AFCA.

Yours sincerely,
[Your Full Name]
[Date]`
  },

  // TENANCY
  {
    id: "tenancy-bond",
    category: "tenancy",
    title: "Unfair Bond Deduction",
    description: "Challenge deductions from your rental bond.",
    body: `Dear [Property Manager / Real Estate Agency],

I am writing to formally dispute the bond deductions claimed following the end of my tenancy at [Property Address], which concluded on [End Date].

You have claimed deductions of $[Amount] for [reason stated]. I dispute these deductions on the following grounds:

1. [Specific dispute - e.g. "The carpet was professionally cleaned on [Date] as evidenced by invoice attached"]
2. [Specific dispute - e.g. "The damage at [location] was present at the commencement of the tenancy and documented in the entry condition report"]
3. Normal fair wear and tear is not the tenant's responsibility under the Residential Tenancies Act [State Year].

I request the return of my full bond of $[Amount] / the disputed amount of $[Amount] within 7 days.

If this matter is not resolved, I will apply to [NCAT / VCAT / QCAT / relevant tribunal] for resolution of this dispute.

Yours sincerely,
[Your Full Name]
[Your Contact Details]
[Date]`
  },
  {
    id: "tenancy-repairs",
    category: "tenancy",
    title: "Urgent Repairs Not Actioned",
    description: "Formally demand urgent repairs be carried out.",
    body: `Dear [Landlord / Property Manager],

I am writing to formally notify you of urgent repairs required at my rental property [Property Address].

On [Date], I reported the following urgent repair(s):
- [Description of repair needed]

Despite my request on [Date] and follow-up on [Date], these repairs have not been carried out. This is a breach of your obligations under the Residential Tenancies Act [State Year].

These repairs are urgent because [explain impact - health risk, security issue, inability to use essential service].

I formally request these repairs be completed within [48 hours for urgent / 14 days for non-urgent].

If repairs are not completed within this timeframe, I reserve the right to:
1. Apply to the tribunal for an urgent repair order
2. Arrange repairs myself and deduct the cost from rent (where permitted)
3. Pursue compensation for any losses suffered

Please confirm receipt of this notice and your intended timeline for repairs.

Yours sincerely,
[Your Full Name]
[Date]`
  },

  // TELCO
  {
    id: "telco-billing",
    category: "telco",
    title: "Billing Error Dispute",
    description: "Dispute incorrect charges on your phone or internet bill.",
    body: `Dear [Telco Provider] Complaints Department,

I am writing to formally dispute charges on my account [Account Number / Service Number] for the billing period [Date Range].

I have been incorrectly charged $[Amount] for [service/charge description]. This charge is incorrect because [explain reason - service was cancelled, usage was within plan limits, etc.].

I have contacted your customer service team on [dates] and have not received a satisfactory resolution. Reference numbers from these contacts: [list reference numbers].

I request:
1. Immediate credit or refund of $[Amount]
2. Corrected invoice within 5 business days
3. Confirmation this will not recur

Under the Telecommunications Consumer Protections (TCP) Code, customers are entitled to accurate billing and swift dispute resolution.

If this is not resolved within 15 business days, I will escalate my complaint to the Telecommunications Industry Ombudsman (TIO) at www.tio.com.au.

Yours sincerely,
[Your Full Name]
[Service Number]
[Date]`
  },
  {
    id: "telco-service",
    category: "telco",
    title: "Ongoing Service Failure",
    description: "Demand resolution of persistent internet or mobile service outages.",
    body: `Dear [Telco Provider] Complaints Department,

I am writing to formally complain about ongoing service failures affecting my [internet/mobile] service [Account Number / Service Number].

Since [Date], I have been experiencing [describe issue - no connection, drop-outs, slow speeds, no mobile coverage]. I have reported this issue on [dates] with reference numbers [numbers].

Despite [X] weeks/months of reports, the issue remains unresolved. This has significantly impacted my [work/study/household] and I am paying full price for a service I cannot use.

I request:
1. Urgent investigation and resolution within 5 business days
2. Pro-rata credit or refund for the period of service failure from [Start Date]
3. Written explanation of cause and steps to prevent recurrence

Under the TCP Code and Australian Consumer Law, I am entitled to a service that is fit for purpose.

If not resolved within 15 business days, I will escalate to the TIO.

Yours sincerely,
[Your Full Name]
[Date]`
  },

  // UTILITIES
  {
    id: "utilities-billing",
    category: "utilities",
    title: "Incorrect Energy Bill Dispute",
    description: "Challenge an unusually high or incorrect energy bill.",
    body: `Dear [Energy Provider] Complaints Department,

I am writing to formally dispute my energy bill for account [Account Number], issued on [Date], in the amount of $[Amount].

This bill is [X times] higher than my usual usage and I believe it is the result of [estimated reading / faulty meter / billing error / incorrect tariff].

I have not changed my usage patterns or added new appliances. My previous bills averaged approximately $[Average Amount] per quarter.

I request:
1. An urgent review and re-issue of this bill
2. A meter re-read or meter accuracy test within 10 business days
3. A payment hold on this disputed amount until resolution

Under the National Energy Customer Framework (NECF) and your hardship/dispute obligations, I am entitled to fair and accurate billing.

If this is not resolved within 10 business days, I will escalate to the [Energy & Water Ombudsman NSW / Vic / Qld - select relevant].

Yours sincerely,
[Your Full Name]
[Account Number]
[Date]`
  },
  {
    id: "utilities-disconnection",
    category: "utilities",
    title: "Wrongful Disconnection Notice",
    description: "Respond to and challenge a disconnection threat.",
    body: `Dear [Energy/Water Provider] Complaints Department,

I am writing urgently to dispute a disconnection notice issued for my account [Account Number] at [Property Address].

I dispute this notice because [explain reason - payments were made, account is in dispute, hardship arrangement is in place, etc.].

Under the National Energy Customer Framework, you are not permitted to disconnect:
- A customer who has a complaint under active dispute
- A customer on a payment plan or hardship arrangement
- A residential customer during extreme weather or on weekends

I formally request:
1. Immediate suspension of the disconnection notice
2. Investigation of my payment history
3. Confirmation of correct account balance within 3 business days

I am willing to arrange a payment plan if a genuine debt exists, however I require an accurate, itemised statement first.

If disconnection proceeds unlawfully, I will seek urgent relief through the Energy & Water Ombudsman and relevant tribunal.

Yours sincerely,
[Your Full Name]
[Date]`
  },

  // GENERAL
  {
    id: "general-complaint",
    category: "general",
    title: "General Consumer Complaint",
    description: "A flexible template for any consumer dispute.",
    body: `Dear [Organisation Name] Complaints Department,

I am writing to make a formal complaint regarding [brief description of issue].

Account/Reference Number: [Number]
Date of Incident: [Date]
Description of Issue: [Provide full details of what happened, when it happened, and how it has affected you]

I have attempted to resolve this matter by [describe previous attempts - phone calls, emails, in-person visits] on [dates], however I have not received a satisfactory response.

I am requesting the following resolution:
1. [Specific resolution - refund, repair, apology, policy change, etc.]
2. [Timeline - e.g. "within 14 days"]

Under Australian Consumer Law, I am entitled to remedies when a product or service fails to meet consumer guarantees.

If this complaint is not resolved within [21/30] days, I will escalate to the relevant ombudsman or regulatory body.

Please acknowledge receipt of this complaint within 5 business days.

Yours sincerely,
[Your Full Name]
[Your Contact Details]
[Date]`
  },
  {
    id: "general-escalation",
    category: "general",
    title: "Escalation to Ombudsman",
    description: "Template for formally escalating to an ombudsman or regulator.",
    body: `Dear [Ombudsman/Regulator Name],

I am writing to lodge a formal complaint against [Organisation Name] regarding [brief description].

BACKGROUND:
I lodged a formal complaint with [Organisation Name] on [Date] (Reference: [Number]). Despite [X] weeks/months, the matter has not been resolved to my satisfaction.

SUMMARY OF COMPLAINT:
[Explain the dispute clearly and chronologically - what happened, when, what you did about it, and what response you received]

SUPPORTING EVIDENCE:
I have the following documentation to support my complaint:
- [Evidence 1 - e.g. copy of complaint lodged on date]
- [Evidence 2 - e.g. response received from company]
- [Evidence 3 - e.g. receipts, photos, statements]

RESOLUTION SOUGHT:
I am seeking: [Describe what you want - refund of $X, service reinstatement, formal apology, etc.]

I confirm that I have given [Organisation Name] a reasonable opportunity to resolve this matter and have not previously lodged this complaint with another EDR scheme.

Yours sincerely,
[Your Full Name]
[Your Contact Details]
[Date]`
  }
];

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copied, setCopied] = useState(false);

  const filtered = templates.filter(t => {
    const matchCat = selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedTemplate.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const catColor = (cat) => categories.find(c => c.id === cat)?.color || "#FFD700";
  const catLabel = (cat) => categories.find(c => c.id === cat)?.label || cat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Letter Template Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Select, copy and customise professional complaint letters</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Browse */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#FFD700] text-black border-[#FFD700]"
                      : "bg-card border-border text-foreground hover:border-[#FFD700]/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Template List */}
          <div className="space-y-2">
            {filtered.map((t, idx) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTemplate?.id === t.id
                    ? "border-[#FFD700] bg-[#FFD700]/5"
                    : "border-border bg-card hover:border-[#FFD700]/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${catColor(t.category)}20` }}>
                    <FileText className="w-4 h-4" style={{ color: catColor(t.category) }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground leading-tight">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</p>
                    <Badge className="mt-2 text-xs px-2 py-0.5" style={{ backgroundColor: `${catColor(t.category)}25`, color: catColor(t.category), border: `1px solid ${catColor(t.category)}40` }}>
                      {catLabel(t.category)}
                    </Badge>
                  </div>
                </div>
              </motion.button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No templates found.</p>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <motion.div
              key={selectedTemplate.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Template Header */}
              <div className="p-5 border-b border-border flex items-center justify-between gap-4"
                style={{ borderLeft: `4px solid ${catColor(selectedTemplate.category)}` }}>
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">{selectedTemplate.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
                </div>
                <Button
                  onClick={handleCopy}
                  className="shrink-0 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold gap-2"
                >
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Letter</>}
                </Button>
              </div>

              {/* Instructions */}
              <div className="px-5 py-3 bg-muted/40 border-b border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">How to use:</span> Copy this template, paste it into your word processor or email, then replace all <span className="font-bold text-[#FFD700]">[bracketed fields]</span> with your specific details before sending.
                </p>
              </div>

              {/* Letter Body */}
              <div className="p-5">
                <pre className="whitespace-pre-wrap font-body text-sm text-foreground leading-relaxed bg-background border border-border rounded-lg p-5">
                  {selectedTemplate.body}
                </pre>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center border-2 border-dashed border-border rounded-xl p-8">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-bold text-foreground mb-2">Select a Template</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a template from the list to preview and copy the full letter text.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}