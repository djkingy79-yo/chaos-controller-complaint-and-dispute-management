import { FileText, Building2, Shield, Home, Phone, Zap, Scale } from "lucide-react";

export const templateCategories = [
  { id: "all", label: "All Templates", icon: FileText },
  { id: "banking", label: "Banking", icon: Building2, color: "#CC0000" },
  { id: "insurance", label: "Insurance", icon: Shield, color: "#660099" },
  { id: "tenancy", label: "Tenancy", icon: Home, color: "#0066CC" },
  { id: "telco", label: "Telco", icon: Phone, color: "#9B59B6" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#F39C12" },
  { id: "general", label: "General", icon: Scale, color: "#27AE60" },
  { id: "legal", label: "Legal & Statutory", icon: Scale, color: "#B8860B" },
  { id: "employment", label: "Employment", icon: Building2, color: "#2E86AB" },
  { id: "government", label: "Government", icon: Building2, color: "#4A4E69" },
];

export const templates = [
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

Due to [reason — job loss/illness/relationship breakdown], I am currently experiencing genuine financial difficulty and am unable to meet my current repayment obligations of $[Amount] per [week/fortnight/month].

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
  {
    id: "bank-scam",
    category: "banking",
    title: "Scam / Fraud Reimbursement Request",
    description: "Request reimbursement after falling victim to a scam or fraud.",
    body: `Dear [Bank Name] Fraud & Disputes Team,

I am writing to formally request reimbursement following a scam/fraud transaction from my account [Account Number] on [Date].

WHAT HAPPENED:
On [Date], I was contacted by [describe scammer — e.g. "a person claiming to be from the ATO"]. I was induced into transferring $[Amount] to [BSB/Account details]. I believed the transaction was legitimate at the time due to [explain how you were deceived].

Upon realising I had been scammed on [Date], I immediately contacted your fraud team (Reference: [Number]) and the Australian Cyber Security Centre.

I am requesting reimbursement under [bank's] scam reimbursement framework and the Australian Banking Association Scam-Safe Accord.

The bank failed to [protect me / warn me / flag the unusual transaction] despite [describe what triggered no action].

I request:
1. Full reimbursement of $[Amount]
2. Written outcome within 21 days
3. If denied, a written explanation with specific reasons referencing relevant policies

If unresolved, I will escalate to AFCA immediately.

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "bank-credit",
    category: "banking",
    title: "Credit Decision Dispute",
    description: "Challenge a credit decision or credit limit reduction.",
    body: `Dear [Bank Name] Credit Disputes Team,

I am writing to formally dispute [the reduction of my credit limit / the rejection of my credit application] on [Date].

Account/Application Number: [Number]
Decision Date: [Date]
Current/Requested Credit: $[Amount]

I believe this decision is incorrect because [explain — e.g. "my financial circumstances have not materially changed"].

Under the National Consumer Credit Protection Act 2009, credit decisions must be based on accurate and comprehensive information. I request:

1. Full written explanation of the reasons for this decision
2. Details of any credit reporting information relied upon
3. Review of the decision in light of the additional information I am providing: [list supporting docs]

I am also entitled to a free copy of any credit report used in this decision.

If unresolved within 30 days, I will escalate to AFCA.

Yours sincerely,
[Your Full Name]
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
  {
    id: "insurance-total-loss",
    category: "insurance",
    title: "Dispute Total Loss Valuation",
    description: "Challenge the payout amount offered for a written-off vehicle or property.",
    body: `Dear [Insurance Company] Disputes Resolution Team,

I am writing to formally dispute the market value assessment applied to my total loss claim [Claim Number] for my [vehicle/property] at [address / registration].

Your assessor has valued my [vehicle/property] at $[Their Amount], which I believe significantly undervalues the asset.

BASIS FOR DISPUTE:
Independent market research shows comparable [vehicles/properties] are currently selling for $[Your Evidence Amount]. I enclose the following evidence:
- [Evidence 1 — e.g. three comparable vehicle listings from carsales.com.au]
- [Evidence 2 — e.g. independent valuation report from [valuer] dated [date]]
- [Evidence 3 — e.g. service history and recent receipts]

I request:
1. A review of the valuation using current market comparable data
2. Engagement of an independent assessor
3. Written response within 15 business days

If unresolved, I will escalate to AFCA.

Yours sincerely,
[Your Full Name]
[Policy Number]
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

1. [e.g. "The carpet was professionally cleaned on [Date] as evidenced by invoice attached"]
2. [e.g. "The damage at [location] was present at the commencement of the tenancy and documented in the entry condition report"]
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

These repairs are urgent because [explain impact — health risk, security issue, inability to use essential service].

I formally request these repairs be completed within [48 hours for urgent / 14 days for non-urgent].

If repairs are not completed within this timeframe, I reserve the right to:
1. Apply to the tribunal for an urgent repair order
2. Arrange repairs myself and deduct the cost from rent (where permitted)
3. Pursue compensation for any losses suffered

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "tenancy-entry",
    category: "tenancy",
    title: "Unlawful Entry by Landlord",
    description: "Formally object to a landlord entering the property without proper notice.",
    body: `Dear [Landlord / Property Manager],

I am writing to formally object to your entry of my rental property at [Property Address] on [Date] at approximately [Time].

Under the Residential Tenancies Act [State Year], a landlord must provide [24/48] hours' written notice before entering a rental property, except in genuine emergency situations. No valid notice was provided to me prior to this entry.

This constitutes a breach of my right to quiet enjoyment and my right to privacy as a tenant.

I formally request:
1. Written acknowledgement of this breach
2. Written confirmation that proper notice will be provided for all future entries
3. That you refrain from entering the premises without lawful notice

Should this conduct continue, I will apply to [relevant tribunal] for an order restraining unauthorised entry and seeking compensation for this breach.

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "tenancy-notice-dispute",
    category: "tenancy",
    title: "Dispute Notice to Vacate",
    description: "Challenge a termination notice you believe is invalid or retaliatory.",
    body: `Dear [Landlord / Property Manager / Real Estate Agency],

I am writing to formally dispute the Notice to Vacate served on [Date], requiring me to vacate the property at [Property Address] by [Vacate Date].

I believe this notice is invalid for the following reasons:
1. [e.g. "Insufficient notice period — [X] days given, [Y] days required under the Act"]
2. [e.g. "The notice does not comply with the prescribed form under the Act"]
3. [e.g. "This notice is retaliatory, issued following my complaint about repairs on [Date]"]

I intend to remain in occupation and will be applying to [NCAT / VCAT / QCAT / SACAT / other] for a declaration that this notice is void and of no effect.

I request that you immediately withdraw this notice, failing which I will proceed with tribunal action.

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

I have been incorrectly charged $[Amount] for [service/charge description]. This charge is incorrect because [explain reason].

I have contacted your customer service team on [dates] and have not received a satisfactory resolution. Reference numbers: [list reference numbers].

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

Since [Date], I have been experiencing [describe issue — no connection, drop-outs, slow speeds, no mobile coverage]. I have reported this issue on [dates] with reference numbers [numbers].

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

Under the National Energy Customer Framework (NECF) and your dispute obligations, I am entitled to fair and accurate billing.

If this is not resolved within 10 business days, I will escalate to the [Energy & Water Ombudsman NSW / VIC / QLD — select relevant].

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

I dispute this notice because [explain reason — payments were made, account is in dispute, hardship arrangement is in place, etc.].

Under the National Energy Customer Framework, you are not permitted to disconnect:
- A customer who has a complaint under active dispute
- A customer on a payment plan or hardship arrangement
- A residential customer during extreme weather or on weekends

I formally request:
1. Immediate suspension of the disconnection notice
2. Investigation of my payment history
3. Confirmation of correct account balance within 3 business days

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

I have attempted to resolve this matter by [describe previous attempts — phone calls, emails, in-person visits] on [dates], however I have not received a satisfactory response.

I am requesting the following resolution:
1. [Specific resolution — refund, repair, apology, policy change, etc.]
2. [Timeline — e.g. "within 14 days"]

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
[Explain the dispute clearly and chronologically — what happened, when, what you did about it, and what response you received]

SUPPORTING EVIDENCE:
- [Evidence 1 — e.g. copy of complaint lodged on date]
- [Evidence 2 — e.g. response received from company]
- [Evidence 3 — e.g. receipts, photos, statements]

RESOLUTION SOUGHT:
I am seeking: [Describe what you want — refund of $X, service reinstatement, formal apology, etc.]

I confirm that I have given [Organisation Name] a reasonable opportunity to resolve this matter and have not previously lodged this complaint with another EDR scheme.

Yours sincerely,
[Your Full Name]
[Your Contact Details]
[Date]`
  },
  {
    id: "general-demand",
    category: "general",
    title: "Letter of Demand",
    description: "Formal letter demanding payment or action before legal proceedings.",
    body: `LETTER OF DEMAND

[Your Name]
[Your Address]
[Date]

To: [Recipient Name / Organisation]
[Their Address]

Dear [Recipient Name],

RE: FORMAL DEMAND — [Brief description e.g. "Refund of $X / Repayment of Debt"]

I write to formally demand that you [pay the sum of $[Amount] / take the following action: (describe)] within 14 days of the date of this letter.

BACKGROUND:
[Describe the circumstances — what occurred, dates, amounts, and your attempts to resolve the matter informally]

LEGAL BASIS:
You are liable to me because [state reason — breach of contract, Australian Consumer Law guarantee failure, negligence, etc.].

I have suffered loss and damage as a result of your conduct, including:
- $[Amount] — [description of loss]
- $[Amount] — [additional loss if applicable]

DEMAND:
I demand that you:
1. Pay $[Amount] to my nominated account: BSB [XXX-XXX], Account [XXXXXXXX]; OR
2. Take the following action by [Date]: [describe]

If I do not receive payment/compliance by [Date 14 days from now], I will commence legal proceedings without further notice. I will also seek costs.

This letter may be tendered in any subsequent proceedings.

Yours faithfully,
[Your Full Name]
[Your Contact Details]`
  },

  // LEGAL & STATUTORY
  {
    id: "authority-to-act",
    category: "legal",
    title: "Authority to Act / Third Party Authority",
    description: "Authorise someone to act on your behalf in dealings with an organisation.",
    body: `AUTHORITY TO ACT ON MY BEHALF

I, [Your Full Name], of [Your Address], hereby authorise the following person to act on my behalf in all matters relating to my account and/or dispute with [Organisation Name]:

AUTHORISED REPRESENTATIVE:
Full Name: [Representative's Full Name]
Relationship to me: [e.g. Spouse / Partner / Friend / Support Worker / Legal Representative]
Contact Phone: [Phone]
Contact Email: [Email]
Address: [Address]

SCOPE OF AUTHORITY:
I authorise [Representative's Name] to:
☑ Discuss my account details and correspondence
☑ Lodge and manage complaints on my behalf
☑ Receive written correspondence and decisions
☑ Make decisions regarding the resolution of my dispute
☑ Access documents and evidence relating to my account

ACCOUNT DETAILS:
Account Name: [Your Full Name]
Account Number: [Account Number]
Date of Birth: [Your DOB]

This authority is valid from [Date] until [End Date / "revoked in writing"].

I declare that I am competent to grant this authority and do so voluntarily.

Signed: _________________________
Full Name: [Your Full Name]
Date: [Date]

Witness (if required):
Signed: _________________________
Full Name: [Witness Name]
Date: [Date]`
  },
  {
    id: "stat-dec",
    category: "legal",
    title: "Statutory Declaration (General)",
    description: "Template for a general statutory declaration — must be witnessed by an authorised person.",
    body: `STATUTORY DECLARATION
(Oaths Act [State] / Statutory Declarations Act 1959 (Cth))

I, [Your Full Name], of [Your Address], [Your Occupation], do solemnly and sincerely declare:

1. I am [describe your role — e.g. "the complainant in a dispute against [Organisation Name]"].

2. On [Date], [describe event — state the facts clearly and in sequence].

3. [Continue with numbered paragraphs for each factual matter you are declaring]

4. The documents attached and marked Exhibit "A" are true copies of [describe documents].

5. The information contained in this declaration is true and correct to the best of my knowledge and belief.

I understand that a person who intentionally makes a false statement in a statutory declaration is guilty of an offence under section 11 of the Statutory Declarations Act 1959 (Cth), and I believe that the statements in this declaration are true in every particular.

Declared at [City/Town], in the State/Territory of [State] on [Date].

Signature of declarant: _________________________
Full Name: [Your Full Name]

DECLARATION TAKEN BY AUTHORISED WITNESS:
I, [Witness Full Name], of [Witness Address], being an authorised witness under the Statutory Declarations Act 1959 (Cth), certify that:
(a) the declarant appeared before me;
(b) I am satisfied as to the identity of the declarant; and
(c) the declarant signed this declaration in my presence.

Signature of witness: _________________________
Full Name: [Witness Full Name]
Qualification: [e.g. Justice of the Peace / Solicitor / Police Officer]
Date: [Date]

NOTE: Authorised witnesses include: justices of the peace, lawyers, police officers, medical practitioners, pharmacists, dentists, accountants, engineers, teachers, and bank officers of 5+ years.`
  },
  {
    id: "stat-dec-lost-docs",
    category: "legal",
    title: "Statutory Declaration — Lost / Destroyed Documents",
    description: "Declare that original documents have been lost or destroyed.",
    body: `STATUTORY DECLARATION — LOST OR DESTROYED DOCUMENTS

I, [Your Full Name], of [Your Address], [Occupation], do solemnly and sincerely declare:

1. I am the owner/holder of [describe the document — e.g. "a purchase receipt for [item] purchased from [store] on [date] for $[amount]"].

2. The original document has been [lost / destroyed / stolen] in the following circumstances:
[Describe how and when the document was lost or destroyed]

3. I have made reasonable efforts to locate/recover the document, including:
[Describe your search efforts]

4. I am not aware of the original document being in the possession of any other person.

5. To the best of my knowledge and belief, the contents of the said document were as follows:
[Describe the key details of the missing document]

6. This declaration is made for the purpose of [state purpose — e.g. "supporting an insurance claim"].

I understand that a person who intentionally makes a false statement in a statutory declaration is guilty of an offence under the Statutory Declarations Act 1959 (Cth).

Declared at [City], [State] on [Date].

Signature: _________________________  [Your Full Name]

Before me: _________________________  [Witness Name, Qualification, Date]`
  },
  {
    id: "affidavit-template",
    category: "legal",
    title: "Affidavit (General — Tribunal Use)",
    description: "Formal affidavit template for use in tribunal or court proceedings.",
    body: `AFFIDAVIT

In the matter of: [Case/Application Name]
Tribunal/Court: [e.g. NSW Civil and Administrative Tribunal (NCAT)]
Application Number: [Number]

I, [Your Full Name], of [Your Address], [Occupation], make oath / solemnly affirm and say as follows:

1. I am the Applicant/Respondent in these proceedings and I make this affidavit from my own personal knowledge, unless otherwise stated.

2. [Paragraph — state facts clearly and sequentially, one topic per numbered paragraph]
   Example: "On [Date], I entered into a [type of agreement] with [Organisation Name] for [describe]."

3. [Continue with numbered paragraphs for each factual matter]

4. Attached and marked Exhibit "A" is a true copy of [document description].
   Attached and marked Exhibit "B" is a true copy of [document description].

5. For the reasons set out above, I seek the following orders:
   (a) [Order 1]
   (b) [Order 2]

SWORN / AFFIRMED at [City], [State], on [Date].

Signature of deponent: _________________________
Full Name: [Your Full Name]

Sworn/affirmed before me:
Signature: _________________________
Full Name: [JP / Commissioner / Solicitor Name]
Qualification: [Justice of the Peace / Solicitor / etc.]
Date: [Date]`
  },
  {
    id: "poa-general",
    category: "legal",
    title: "General Power of Attorney (Short Form)",
    description: "Short-form authority to appoint someone to act on your legal/financial matters. Seek legal advice before use.",
    body: `GENERAL POWER OF ATTORNEY

I, [Your Full Name (the "Principal")], of [Your Full Address], appoint:

ATTORNEY:
Full Name: [Attorney's Full Name]
Address: [Attorney's Full Address]
Date of Birth: [Attorney's DOB]

as my Attorney to act on my behalf.

POWERS GRANTED:
My Attorney is authorised to:
1. Manage and deal with my [financial / legal / property] affairs as set out below
2. Execute documents, sign cheques, and enter into agreements on my behalf
3. [Describe specific powers — e.g. "manage my bank accounts at [Bank Name]"]
4. Deal with [specific organisation] in relation to [specific matter]

LIMITATIONS:
This authority is limited to: [describe any limits — or state "no specific limitations"]

DURATION:
This Power of Attorney is valid from [Start Date] to [End Date / "until revoked"].

I declare that at the time of signing this document I have legal capacity and am doing so voluntarily.

Signed: _________________________
Full Name (Principal): [Your Full Name]
Date: [Date]

Witnessed by:
Signature: _________________________
Full Name: [Witness Name]
Qualification: [e.g. Justice of the Peace]
Date: [Date]

IMPORTANT: This is a general template only. For an enduring power of attorney or significant property/financial matters, obtain a properly executed document from a qualified lawyer.`
  },
  {
    id: "privacy-access",
    category: "legal",
    title: "Privacy Act — Access to Personal Information",
    description: "Request access to your personal information held by an organisation.",
    body: `Dear Privacy Officer,
[Organisation Name]
[Organisation Address]

RE: REQUEST FOR ACCESS TO PERSONAL INFORMATION
(Privacy Act 1988 (Cth) — Australian Privacy Principle 12)

I, [Your Full Name], of [Your Address], request access to all personal information held about me by [Organisation Name].

MY DETAILS:
Full Name: [Your Full Name]
Date of Birth: [DOB]
Account/Reference Number: [Number if applicable]
Email: [Your Email]
Phone: [Your Phone]

INFORMATION REQUESTED:
I request copies of all personal information held about me, including but not limited to:
- Account records, notes, and correspondence
- Credit or financial information
- Any information shared with third parties
- Call recordings or transcripts
- Complaint or dispute records

Under APP 12 of the Privacy Act 1988 (Cth), you are required to respond to this request within 30 days and may only charge a reasonable fee.

If access is denied in whole or in part, please provide written reasons as required by APP 12.5.

Should you fail to comply, I will lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "privacy-correction",
    category: "legal",
    title: "Privacy Act — Correction of Personal Information",
    description: "Request an organisation correct inaccurate personal information they hold about you.",
    body: `Dear Privacy Officer,
[Organisation Name]

RE: REQUEST TO CORRECT PERSONAL INFORMATION
(Privacy Act 1988 (Cth) — Australian Privacy Principle 13)

I, [Your Full Name], request the correction of inaccurate personal information held about me.

INACCURATE INFORMATION:
Field: [Current incorrect value held]
Correct information: [What it should say]

Reason the current record is incorrect:
[Explain why the information is wrong and provide evidence if available]

Supporting evidence attached: [List evidence — e.g. "Birth certificate, statutory declaration, court order"]

Under APP 13 of the Privacy Act 1988 (Cth), you must take reasonable steps to correct this information within 30 days and at no charge to me.

If you decline to correct this information, please provide written reasons.

If this request is not actioned, I will lodge a complaint with the Office of the Australian Information Commissioner (OAIC).

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "credit-report-dispute",
    category: "legal",
    title: "Credit Report Error Dispute",
    description: "Dispute inaccurate information on your credit report.",
    body: `Dear Credit Reporting Body / [Organisation Name],

RE: DISPUTE OF CREDIT REPORT INFORMATION
(Privacy Act 1988 (Cth) — Part IIIA)

I am writing to formally dispute information listed on my credit report held by [Equifax / Experian / illion].

MY DETAILS:
Full Name: [Your Full Name]
Date of Birth: [DOB]
Current Address: [Address]
Previous Address: [Address if applicable]

DISPUTED INFORMATION:
Credit Provider: [Name]
Type of Listing: [Default / Enquiry / Court Judgement]
Date Listed: [Date]
Amount: $[Amount] (if applicable)

REASON FOR DISPUTE:
This listing is incorrect because: [Explain — e.g. "the debt was paid on [date]", "I was not the person responsible for this debt", "this account was never opened by me"]

I request that this listing be corrected or removed within 30 days.

I am also requesting the credit reporting body provide written acknowledgement of this dispute and notify the credit provider concerned.

If this dispute is not resolved, I will escalate to the Office of the Australian Information Commissioner (OAIC).

Yours sincerely,
[Your Full Name]
[Date]`
  },

  // EMPLOYMENT
  {
    id: "unfair-dismissal",
    category: "employment",
    title: "Unfair Dismissal — Initial Response",
    description: "Respond to a termination you believe was harsh, unjust or unreasonable.",
    body: `Dear [Employer Name / HR Manager],

RE: DISPUTE OF TERMINATION OF EMPLOYMENT

I am writing to formally dispute my termination on [Date], which I consider to be harsh, unjust and unreasonable in the circumstances.

I was employed as [Job Title] from [Start Date] until [Termination Date].

GROUNDS FOR DISPUTE:
1. [e.g. "No valid reason was given for termination as required under the Fair Work Act 2009"]
2. [e.g. "I was not afforded the opportunity to respond to the alleged conduct"]
3. [e.g. "The termination was disproportionate to the alleged conduct"]
4. [e.g. "I was not warned that my employment was at risk"]

I request:
1. Written reasons for my termination referencing specific conduct or performance issues
2. Copies of all performance reviews, warnings, and records relied upon
3. Reconsideration of the decision to terminate

Please be aware that I intend to lodge an application with the Fair Work Commission for unfair dismissal unless this matter is resolved. Applications must be lodged within 21 days of the dismissal taking effect.

I am seeking reinstatement to my position, or in the alternative, compensation for lost wages and entitlements.

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "underpayment",
    category: "employment",
    title: "Wage Underpayment Demand",
    description: "Formally demand repayment of underpaid wages, super, or entitlements.",
    body: `Dear [Employer Name / Payroll Manager],

RE: FORMAL DEMAND — UNDERPAYMENT OF WAGES AND ENTITLEMENTS

I am writing to formally advise that I believe I have been underpaid wages and/or entitlements during my employment as [Job Title] from [Start Date] to [End Date / "present"].

UNDERPAYMENT DETAILS:
Award/Agreement: [e.g. "General Retail Industry Award 2020"]
Classification: [Your classification]
Correct hourly rate: $[Amount]
Rate paid: $[Amount]
Period of underpayment: [Date range]
Estimated underpayment: $[Amount]

I also claim the following outstanding entitlements:
- Annual leave: [X hours] = $[Amount]
- Superannuation shortfall: $[Amount] (estimated)
- [Other entitlements]

Under the Fair Work Act 2009 and the National Employment Standards, you are required to pay all wages and entitlements in full and on time.

I request full repayment of $[Total Amount] within 14 days. I also request a corrected payslip for each affected pay period.

If this is not resolved, I will lodge a complaint with the Fair Work Ombudsman.

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "workplace-bullying",
    category: "employment",
    title: "Workplace Bullying / Harassment Complaint",
    description: "Formally raise a complaint about bullying, harassment or discrimination at work.",
    body: `Dear [HR Manager / Employer],

RE: FORMAL COMPLAINT — WORKPLACE BULLYING/HARASSMENT

I am writing to make a formal complaint regarding conduct by [Name(s) of respondent(s)], [Job Title], which I believe constitutes workplace bullying/harassment under the Fair Work Act 2009 and/or [organisation's] workplace policies.

DESCRIPTION OF CONDUCT:
[Date]: [Describe specific incident — what was said/done, where, who witnessed it]
[Date]: [Describe further incident]
[Additional incidents as relevant]

This conduct has:
- Created a hostile and unsafe work environment
- Caused me significant stress and [physical/psychological] harm

I request that [Organisation Name]:
1. Investigate this complaint promptly and fairly
2. Keep my complaint confidential to those involved in the process
3. Take immediate action to stop the bullying/harassment
4. Provide me with a written outcome within 20 business days

I am entitled to a safe workplace under the Work Health and Safety Act [State Year] and [organisation's] own policies.

If this complaint is not properly investigated, I will escalate to the Fair Work Commission and/or the relevant work health and safety regulator.

Yours sincerely,
[Your Full Name]
[Date]`
  },
  {
    id: "redundancy-dispute",
    category: "employment",
    title: "Genuine Redundancy Dispute",
    description: "Challenge a redundancy you believe was not genuine.",
    body: `Dear [HR Manager / Employer],

RE: DISPUTE — GENUINE REDUNDANCY

I am writing to formally dispute that my redundancy, effective [Date], meets the requirements of a "genuine redundancy" under the Fair Work Act 2009.

I was employed as [Job Title] from [Start Date].

I dispute the genuineness of this redundancy because:
1. [e.g. "My role has not been eliminated — it has been performed by [person] since my departure"]
2. [e.g. "You failed to consult with me as required under the [Enterprise Agreement / Modern Award]"]
3. [e.g. "Redeployment to [Role] was reasonably available and was not offered to me"]

I request:
1. Written evidence that my role has been genuinely eliminated
2. Documentation of redeployment options considered
3. Copies of all consultation records

I am seeking [reinstatement / compensation for unfair dismissal] and will lodge an application with the Fair Work Commission if this is not resolved. Applications must be lodged within 21 days.

Yours sincerely,
[Your Full Name]
[Date]`
  },

  // GOVERNMENT
  {
    id: "centrelink-dispute",
    category: "government",
    title: "Centrelink Decision Dispute",
    description: "Challenge a Centrelink payment decision or debt notice.",
    body: `Dear Services Australia Review Officer,

RE: REQUEST FOR REVIEW OF DECISION
Customer Reference Number (CRN): [Your CRN]
Decision Date: [Date]
Decision Type: [e.g. "Rejection of JobSeeker Payment / Debt Raised"]

I am writing to formally request a review of the above decision made on [Date].

REASON FOR DISPUTE:
I believe this decision is incorrect because:
1. [Specific reason — e.g. "My income for the period was $[X], not $[Y] as assessed"]
2. [Specific reason — e.g. "I reported my income correctly on [Date]"]
3. [Specific reason — e.g. "The debt raised is based on an incorrect calculation"]

SUPPORTING EVIDENCE:
- [Document 1]
- [Document 2]

I request:
1. An Authorised Review Officer (ARO) review of this decision
2. If the ARO upholds the decision, referral to the Administrative Review Tribunal (ART)
3. Suspension of any debt recovery action while this review is pending

Under the Social Security (Administration) Act 1999, I have the right to a review of this decision.

Yours sincerely,
[Your Full Name]
[Your Address]
[Date]`
  },
  {
    id: "ndis-plan-dispute",
    category: "government",
    title: "NDIS Plan Review Request",
    description: "Request a review of your NDIS plan or a funding decision.",
    body: `Dear NDIS Review Team,
National Disability Insurance Agency (NDIA)

RE: REQUEST FOR INTERNAL REVIEW OF DECISION
Participant Name: [Your Full Name]
NDIS Participant Number: [Your NDIS Number]
Decision Date: [Date]
Decision Description: [e.g. "Rejection of support / Reduced funding in plan"]

I am writing to formally request an internal review of the above NDIS decision.

REASONS FOR REVIEW:
1. [Reason — e.g. "The support is reasonable and necessary for me to pursue my goals"]
2. [Reason — e.g. "Evidence provided by [specialist name] was not given adequate weight"]
3. [Reason — e.g. "The decision does not reflect my functional impact or support needs"]

MY FUNCTIONAL IMPACT:
[Describe in plain language how your disability affects your daily life and why the requested support is necessary]

SUPPORTING DOCUMENTS ENCLOSED:
- [List reports, assessments, specialist letters]

Under Section 100 of the NDIS Act 2013, I request a formal internal review. I understand I must apply within 3 months of the decision.

If the internal review does not result in a satisfactory outcome, I will lodge an application with the Administrative Review Tribunal (ART).

Yours sincerely,
[Your Full Name]
[Your Contact Details]
[Date]`
  },
  {
    id: "council-complaint",
    category: "government",
    title: "Council / Local Government Complaint",
    description: "Formally complain about a council decision, fine, or failure to act.",
    body: `Dear [Council Name] Complaints Officer,

RE: FORMAL COMPLAINT — [Brief Description]
Property Address: [Your Address]
Council Reference (if known): [Number]

I am writing to make a formal complaint regarding [describe issue — e.g. "an infringement notice issued on [Date]" / "failure to maintain public infrastructure" / "a planning decision"].

DETAILS OF COMPLAINT:
On [Date], [describe what happened clearly and in chronological order].

I believe the Council has [acted unlawfully / failed to fulfil its obligations / applied its policy incorrectly] in this matter because [explain legal or policy basis].

I am requesting:
1. [Specific outcome — e.g. withdrawal of infringement / action to repair footpath / review of decision]
2. Written response within 20 business days

If this complaint is not resolved to my satisfaction, I will escalate to the [relevant State Ombudsman / NCAT / VCAT / QCAT].

Please acknowledge receipt of this complaint.

Yours sincerely,
[Your Full Name]
[Your Address / Email / Phone]
[Date]`
  },
  {
    id: "tax-dispute",
    category: "government",
    title: "ATO Tax Assessment Objection",
    description: "Formally object to an ATO tax assessment or decision.",
    body: `Australian Taxation Office
[ATO Address — see ato.gov.au for correct address by state]

RE: NOTICE OF OBJECTION TO ASSESSMENT
Taxpayer Name: [Your Full Name]
Tax File Number: [TFN]
Assessment/Decision Date: [Date]
Tax Year: [Year]

Pursuant to Part IVC of the Taxation Administration Act 1953, I formally object to the above assessment/decision.

GROUNDS OF OBJECTION:
1. [Ground 1 — e.g. "The deduction of $[X] was incorrectly disallowed. The expense was incurred in the course of producing assessable income pursuant to section 8-1 of the ITAA 1997 because..."]

2. [Ground 2 — e.g. "The income amount of $[X] was incorrectly included in my assessable income because..."]

RELIEF SOUGHT:
I seek [amendment of the assessment to reduce the tax payable by $[X] / removal of the penalty / other].

Please contact me at [phone/email] to discuss.

Yours faithfully,
[Your Full Name]
[Your Address]
[Date]

Attachments: [List supporting documents]`
  },
  {
    id: "medicare-dispute",
    category: "government",
    title: "Medicare / Services Australia Complaint",
    description: "Dispute a Medicare billing issue or Services Australia decision.",
    body: `Dear Services Australia Complaints Officer,

RE: FORMAL COMPLAINT — MEDICARE BILLING DISPUTE
Medicare Number: [Your Medicare Number]
Reference/Receipt Number: [Number if available]

I am writing to make a formal complaint regarding a Medicare billing matter.

ISSUE DETAILS:
On [Date], I [received a bill / was denied a rebate / was incorrectly charged] in relation to [describe — service type, provider name, date of service].

The amount in dispute is $[Amount].

I believe this is incorrect because [explain — e.g. "the service is covered under Medicare item [number]", "I have a valid referral", "the bulk billing arrangement was agreed at the time of service"].

I request:
1. Investigation of this matter
2. Correction of my Medicare record / refund of $[Amount]
3. Written response within 20 business days

If this matter is not resolved, I will escalate to the Commonwealth Ombudsman at www.ombudsman.gov.au.

Yours sincerely,
[Your Full Name]
[Your Address]
[Date]`
  },
];