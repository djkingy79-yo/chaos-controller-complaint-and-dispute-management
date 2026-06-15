import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is Chaos Controller?",
        a: "Chaos Controller is a consumer advocacy and dispute management platform that helps you organize evidence, draft professional complaint letters, track deadlines, and escalate disputes to the appropriate ombudsman or tribunal. It's designed to give you the tools to effectively resolve consumer disputes with banks, insurers, telcos, utilities, and other organisations."
      },
      {
        q: "How do I create my first case?",
        a: "Tap 'New Case' from the main menu, select your dispute category (Banking, Insurance, Tenancy, Telco, Utilities, or Other), fill in your personal details, answer the guided questions about your dispute, and review the AI-generated complaint letter. The entire process takes about 10-15 minutes."
      },
      {
        q: "Is Chaos Controller a law firm?",
        a: "No. Chaos Controller is not a law firm and does not provide legal advice. We provide administrative and organizational tools to help you manage consumer disputes. For legal advice, you should consult with a qualified legal practitioner."
      },
      {
        q: "How much does it cost to use Chaos Controller?",
        a: "Visit our 'Plans & Pricing' page for current pricing information. We offer various subscription tiers to suit different needs, and you can cancel at any time."
      }
    ]
  },
  {
    category: "Cases & Documentation",
    questions: [
      {
        q: "What information should I include in my case?",
        a: "Include all relevant details: your personal information, the organisation's details, account/reference numbers, incident dates, a clear summary of the issue, full details of what happened, and your desired outcome. The more complete your information, the better the AI can draft your complaint letter."
      },
      {
        q: "What types of documents can I upload to the Evidence Vault?",
        a: "You can upload PDFs, images (JPG, PNG), Word documents (DOC, DOCX), and other common file formats. Supported document types include emails, receipts, contracts, bank statements, invoices, notices, correspondence, leases, reports, and ID documents."
      },
      {
        q: "How does AI document scanning work?",
        a: "When you upload a document, you can choose to 'Scan with AI'. The AI analyzes the document and extracts key information like names, addresses, account numbers, policy numbers, dates, amounts, and timeline events. This extracted data can then be used to populate your case details automatically."
      },
      {
        q: "Can I edit the AI-generated complaint letter?",
        a: "Yes. After the AI generates your letter, you can edit it directly, make changes, and save your modifications. You can also regenerate the letter at any time if you update your case details."
      },
      {
        q: "What is the Matter Strength score?",
        a: "The Matter Strength score (0-100%) indicates how well-documented your case is. It's calculated based on completed case details, uploaded evidence, timeline events, complaint letters, and response status. A higher score (80%+) means you're better prepared for escalation."
      }
    ]
  },
  {
    category: "Escalations & Ombudsmen",
    questions: [
      {
        q: "When should I escalate my complaint?",
        a: "You should escalate when: the organisation has responded unsatisfactorily, they haven't responded within their stated timeframe (typically 21 days), or they've issued a final response that you disagree with. Your Matter Strength score should be 80%+ before escalating."
      },
      {
        q: "Which ombudsman handles my type of dispute?",
        a: "Banking and finance disputes go to AFCA (Australian Financial Complaints Authority). Insurance complaints also go to AFCA. Telecommunications disputes go to TIO (Telecommunications Industry Ombudsman). Energy and water utilities go to EWON (Energy & Water Ombudsman NSW). Tenancy disputes in NSW go to NCAT (NSW Civil and Administrative Tribunal)."
      },
      {
        q: "What is an escalation bundle?",
        a: "An escalation bundle is a comprehensive document package that includes: a cover page with case summary, an escalation readiness checklist, a chronological timeline of all events, an evidence index, and your complaint letter. This bundle is formatted for submission to ombudsmen and tribunals."
      },
      {
        q: "How do I submit my escalation?",
        a: "When you're ready, tap 'Escalate Now' in your case. You'll be directed to the appropriate ombudsman's website where you can complete their online complaint form. Download and attach your escalation bundle as supporting documentation."
      },
      {
        q: "How long does an ombudsman investigation take?",
        a: "Investigation times vary by body and case complexity. AFCA typically takes 30-90 days for standard cases. TIO aims to resolve complaints within 30-60 days. NCAT hearings may be scheduled within 4-8 weeks. The ombudsman will keep you updated throughout the process."
      }
    ]
  },
  {
    category: "Deadlines & Timelines",
    questions: [
      {
        q: "What is the Deadline War Room?",
        a: "The Deadline War Room shows all your upcoming deadlines across all cases in one place. Deadlines are color-coded by urgency (red = overdue, orange = due soon, green = on track) and sorted by date so you can see what needs attention immediately."
      },
      {
        q: "How long do organisations have to respond to complaints?",
        a: "Most organisations have 21 days to respond to formal complaints, though this can vary. AFCA members must respond within 21 days for standard complaints. Some industries have different timeframes set by their ombudsman schemes."
      },
      {
        q: "What happens if a deadline is missed?",
        a: "If an organisation misses their response deadline, mark the deadline as 'Missed' in your case. This strengthens your escalation and should be noted in your complaint to the ombudsman. You can then proceed with escalation if you haven't received a response."
      },
      {
        q: "Can I set reminders for deadlines?",
        a: "Yes. When you create a deadline, you can set reminder notifications. You'll receive alerts as the deadline approaches so you never miss an important date."
      }
    ]
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Is my data secure?",
        a: "Yes. We use industry-standard encryption for data in transit and at rest. Your information is stored securely and only accessible to you. We do not sell or share your personal information with third parties except as described in our Privacy Policy."
      },
      {
        q: "What happens to my data if I delete my account?",
        a: "When you delete your account, all your personal information and case data will be deleted or anonymized within 30 days, unless we're required to retain it for legal reasons. You can export your data before deletion if needed."
      },
      {
        q: "Can I download my case data?",
        a: "Yes. You can print or download your case documents, including complaint letters, timelines, evidence indexes, and complete escalation bundles at any time."
      }
    ]
  },
  {
    category: "Technical Support",
    questions: [
      {
        q: "What browsers are supported?",
        a: "Chaos Controller works best on the latest versions of Chrome, Safari, Firefox, and Edge. For mobile devices, we support iOS Safari and Android Chrome. The platform is fully responsive and works on phones, tablets, and desktops."
      },
      {
        q: "How do I contact support?",
        a: "You can reach our support team by email at info@chaoscontroller.com.au, by phone at 1300 4 CHAOS (1300 424 267), or through the 'Contact Support' link in the Help & Guide section. We typically respond within 24-48 hours."
      },
      {
        q: "Can I use Chaos Controller offline?",
        a: "No. Chaos Controller requires an internet connection to function, as it needs to access our servers for AI processing, data storage, and document generation."
      }
    ]
  }
];

export default function QnA() {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(faqs.map(f => f.category))];

  const filteredFaqs = faqs
    .filter(section => selectedCategory === "All" || section.category === selectedCategory)
    .map(section => ({
      ...section,
      questions: section.questions.filter(q =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(section => section.questions.length > 0);

  const toggleQuestion = (sectionIndex, questionIndex) => {
    const key = `${sectionIndex}-${questionIndex}`;
    setExpandedIndex(expandedIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Q&A</h1>
              <p className="text-sm text-muted-foreground mt-1">Frequently asked questions and answers</p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              Back
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Contact */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-2">Can't find what you're looking for?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Our support team is ready to help with any questions about your cases or the platform.
              </p>
              <a 
                href="mailto:chaoscontrollerapp@gmail.com"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Sections */}
        {filteredFaqs.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-3">
            <h2 className="font-heading font-bold text-lg text-foreground px-1">{section.category}</h2>
            <div className="space-y-2">
              {section.questions.map((item, questionIdx) => {
                const key = `${sectionIdx}-${questionIdx}`;
                const isExpanded = expandedIndex === key;

                return (
                  <div
                    key={questionIdx}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(sectionIdx, questionIdx)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium text-foreground text-sm">{item.q}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 pl-12">
                        <p className="text-sm text-foreground leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No questions found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term or category</p>
          </div>
        )}

        {/* Footer Links */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Chaos Controller. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}