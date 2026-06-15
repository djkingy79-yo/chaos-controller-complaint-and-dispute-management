import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, ArrowLeft, CheckCircle2, AlertTriangle, Clock, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

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
    documents: [
      { name: "Initial Complaint Letter", type: "letter" },
      { name: "AFCA Escalation Bundle", type: "bundle" },
      { name: "Final Resolution Letter", type: "resolution" }
    ]
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
    documents: [
      { name: "Claim Rejection Letter", type: "letter" },
      { name: "AFCA Submission Bundle", type: "bundle" },
      { name: "Settlement Agreement", type: "resolution" }
    ]
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
    documents: [
      { name: "Bond Claim Dispute", type: "letter" },
      { name: "NCAT Tribunal Bundle", type: "bundle" },
      { name: "Tribunal Decision", type: "resolution" }
    ]
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
    documents: [
      { name: "Initial Complaint", type: "letter" },
      { name: "TIO Escalation Bundle", type: "bundle" },
      { name: "Credit Confirmation", type: "resolution" }
    ]
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
    documents: [
      { name: "Billing Dispute Letter", type: "letter" },
      { name: "EWON Escalation Bundle", type: "bundle" },
      { name: "Corrected Invoice", type: "resolution" }
    ]
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

export default function SampleReports() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Sample Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real examples of successful dispute resolutions</p>
        </div>
      </div>

      {!selectedReport ? (
        /* Reports Grid */
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
                className="cursor-pointer bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{categoryIcons[report.category]}</span>
                      <Badge className={`${status.className} border`}>
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {report.duration}
                      </span>
                    </div>
                    
                    <h3 className="font-heading font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-foreground font-medium">{report.outcome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">{report.keyElements.length} key elements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <span className="text-muted-foreground">{report.documents.length} documents</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl font-display font-bold text-primary">
                      {report.strength}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Matter Strength
                    </div>
                    <Eye className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
          <Button variant="outline" onClick={() => setSelectedReport(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </Button>

          {/* Report Header */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{categoryIcons[selectedReport.category]}</span>
                  <Badge className={`${statusConfig[selectedReport.status].className} border`}>
                    {statusConfig[selectedReport.status].label}
                  </Badge>
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  {selectedReport.title}
                </h2>
                <p className="text-muted-foreground">vs {selectedReport.organisation}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-display font-bold text-primary mb-1">
                  {selectedReport.strength}%
                </div>
                <div className="text-sm text-muted-foreground">Matter Strength</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Outcome</div>
                <div className="font-semibold text-success">{selectedReport.outcome}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Duration</div>
                <div className="font-semibold text-foreground">{selectedReport.duration}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Category</div>
                <div className="font-semibold text-foreground capitalize">{selectedReport.category}</div>
              </div>
            </div>
          </div>

          {/* Case Summary */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Case Summary</h3>
            <p className="text-foreground leading-relaxed">{selectedReport.description}</p>
          </div>

          {/* Key Elements */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Key Success Elements
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {selectedReport.keyElements.map((element, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-success/5 border border-success/20 rounded-lg p-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="text-sm font-medium text-foreground">{element}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Case Documents
            </h3>
            <div className="space-y-3">
              {selectedReport.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{doc.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{doc.type}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" /> View Sample
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border border-primary/30 rounded-xl p-6 text-center">
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">
              Ready to Build Your Own Case?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              These examples show what's possible with strong documentation and the right approach.
            </p>
            <Button onClick={() => navigate("/new-case")} className="gap-2">
              Start Your Case <FileText className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}