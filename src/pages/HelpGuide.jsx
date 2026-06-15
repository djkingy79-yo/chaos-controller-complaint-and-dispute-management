import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FolderOpen, 
  Clock, 
  CheckSquare, 
  Building2, 
  Calendar,
  Printer,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  PlusCircle,
  Upload,
  Send,
  Shield,
  Scale,
  Lock
} from "lucide-react";

const guides = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    color: "text-primary",
    bgColor: "bg-primary/10",
    sections: [
      {
        title: "Creating Your First Case",
        steps: [
          "Tap 'New Case' from the main menu",
          "Select your dispute category (Banking, Insurance, Tenancy, Telco, Utilities, or Other)",
          "Fill in your personal details (name, address, email, phone)",
          "Complete the guided questions for your specific category",
          "Review the AI-generated complaint letter",
          "Save your case — it will appear in 'My Cases'"
        ],
        tips: ["You can edit any case details later", "Start with basic info — you can add more details as you go"]
      },
      {
        title: "Understanding the Dashboard",
        steps: [
          "View all your active cases at a glance",
          "Check your case strength scores (Matter Strength)",
          "See upcoming deadlines in the Deadline War Room",
          "Access quick actions from the Command Centre",
          "Review recent letters and documents"
        ],
        tips: ["Cases are color-coded by status", "Higher strength scores mean better documentation"]
      }
    ]
  },
  {
    id: "evidence-vault",
    title: "Evidence Vault",
    icon: FolderOpen,
    color: "text-success",
    bgColor: "bg-success/10",
    sections: [
      {
        title: "Uploading Documents",
        steps: [
          "Open any case and tap the 'Evidence' tab",
          "Tap 'Upload Documents' or drag files into the vault",
          "Select one or multiple files from your device",
          "Choose the document type (Email, Receipt, Contract, etc.)",
          "Add a description (optional but helpful)",
          "Tap 'Upload' to add to your evidence vault"
        ],
        tips: ["Supported formats: PDF, JPG, PNG, DOC, DOCX", "You can upload multiple files at once"]
      },
      {
        title: "AI Document Scanning",
        steps: [
          "After upload, tap 'Scan with AI' on any document",
          "The AI extracts key information automatically",
          "Review extracted data: names, dates, account numbers, amounts",
          "Timeline events are auto-created from the document",
          "Use extracted data to populate your case details"
        ],
        tips: ["Scanning takes 10-30 seconds", "You can edit any extracted data before saving"]
      },
      {
        title: "Organizing Evidence",
        steps: [
          "Filter by document type using the filter dropdown",
          "Sort by date to see chronological order",
          "Tap any document to view full details",
          "Delete unwanted documents by tapping the trash icon",
          "Download documents by tapping the download button"
        ],
        tips: ["Keep all relevant documents — even seemingly minor ones", "Date-stamped evidence is most valuable"]
      }
    ]
  },
  {
    id: "timeline",
    title: "Timeline Builder",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    sections: [
      {
        title: "Building Your Case Timeline",
        steps: [
          "Open your case and tap the 'Timeline' tab",
          "Tap 'Add Event' to create a new timeline entry",
          "Select the event date",
          "Choose event type (Incident, Complaint, Response, etc.)",
          "Add a title and detailed description",
          "Mark as 'Action Required' if you need to do something",
          "Save the event"
        ],
        tips: ["Be specific with dates — accuracy matters", "Include all interactions with the organisation"]
      },
      {
        title: "Auto-Generated Events",
        steps: [
          "AI-scanned documents automatically create timeline events",
          "Emails create 'Correspondence' events",
          "Letters create 'Complaint' or 'Response' events",
          "Notices create 'Deadline' events",
          "Review and edit auto-generated events for accuracy"
        ],
        tips: ["Auto-events save time but always verify details", "You can merge duplicate events"]
      },
      {
        title: "Using Your Timeline",
        steps: [
          "View all events in chronological order",
          "Filter by event type to see specific interactions",
          "Print the timeline for your escalation bundle",
          "Use it to track response deadlines",
          "Reference it when writing complaint letters"
        ],
        tips: ["A complete timeline strengthens your case significantly", "Update it as new events occur"]
      }
    ]
  },
  {
    id: "complaint-letters",
    title: "Complaint Letters",
    icon: FileText,
    color: "text-accent",
    bgColor: "bg-accent/10",
    sections: [
      {
        title: "Generating a Complaint Letter",
        steps: [
          "Complete your case details (issue summary, desired outcome)",
          "Upload at least one piece of evidence",
          "Open the 'Letters' tab in your case",
          "Tap 'Generate Letter' to create a draft",
          "The AI uses your case data to write a professional letter",
          "Review the letter carefully"
        ],
        tips: ["More complete case data = better letters", "Letters follow formal Australian complaint standards"]
      },
      {
        title: "Editing Your Letter",
        steps: [
          "Tap 'Edit' to modify the letter text",
          "Make changes directly in the text editor",
          "Tap 'Save' when finished",
          "Or tap 'Regenerate' to create a new version",
          "Use 'Copy' to paste into email or document"
        ],
        tips: ["Always personalize the letter before sending", "Check that all details are accurate"]
      },
      {
        title: "Sending Your Letter",
        steps: [
          "Tap 'Print' to print a physical copy",
          "Or copy the text and paste into email",
          "Send to the organisation's complaints address/email",
          "Record the sending date in your timeline",
          "Set a response deadline (typically 21 days)"
        ],
        tips: ["Keep proof of sending (email receipt, post tracking)", "Update case status to 'Complaint Sent'"]
      }
    ]
  },
  {
    id: "escalation",
    title: "Escalation Bundles",
    icon: Printer,
    color: "text-primary",
    bgColor: "bg-primary/10",
    sections: [
      {
        title: "Preparing for Escalation",
        steps: [
          "Complete all case details and upload evidence",
          "Generate your complaint letter",
          "Build your timeline with all events",
          "Check your Matter Strength score (aim for 80%+)",
          "Review the Escalation Readiness Checklist",
          "Ensure all critical items are marked complete"
        ],
        tips: ["Strong documentation = stronger escalation", "Don't escalate until you've received a response"]
      },
      {
        title: "Creating Your Bundle",
        steps: [
          "Open the 'Bundle' tab in your case",
          "Review the bundle preview (cover page + 4 sections)",
          "Section 1: Escalation Readiness Checklist",
          "Section 2: Chronological Timeline",
          "Section 3: Evidence Index",
          "Section 4: Complaint Letter"
        ],
        tips: ["The bundle is formatted for tribunal submission", "All documents use proper legal formatting"]
      },
      {
        title: "Submitting Your Escalation",
        steps: [
          "Tap 'Escalate Now' when ready",
          "You'll be directed to the appropriate ombudsman website",
          "Banking/Insurance → AFCA (afca.org.au/make-a-complaint)",
          "Telco → TIO (tio.com.au/make-a-complaint)",
          "Utilities → EWON (ewon.com.au/make-a-complaint)",
          "Tenancy → NCAT (ncat.nsw.gov.au/apply)",
          "Complete their online complaint form",
          "Attach your printed bundle as supporting documentation"
        ],
        tips: ["Keep a copy of your submission confirmation", "Note your ombudsman case reference number"]
      }
    ]
  },
  {
    id: "deadlines",
    title: "Deadline War Room",
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    sections: [
      {
        title: "Tracking Deadlines",
        steps: [
          "Access 'Deadlines' from the main menu",
          "View all upcoming deadlines across all cases",
          "Deadlines are sorted by urgency (most urgent first)",
          "Red = overdue, Orange = due soon, Green = on track",
          "Tap any deadline to see full details"
        ],
        tips: ["Check this page daily for urgent items", "Response deadlines are typically 21 days from complaint"]
      },
      {
        title: "Adding Deadlines",
        steps: [
          "Open a case and tap 'Add Deadline'",
          "Enter what the deadline is for",
          "Select the deadline date",
          "Choose deadline type (Response Due, Submission, Tribunal Date, etc.)",
          "Set who's responsible (You, Provider, Tribunal)",
          "Add notes or upload proof documents"
        ],
        tips: ["Set reminders for important deadlines", "Upload proof when you complete a deadline"]
      },
      {
        title: "Managing Deadlines",
        steps: [
          "Mark deadlines as 'Complete' when done",
          "Upload proof documents to verify completion",
          "Extend deadlines if the organisation requests more time",
          "Mark as 'Missed' if a deadline passes (triggers escalation)",
          "Delete deadlines that are no longer relevant"
        ],
        tips: ["Missed provider deadlines strengthen your escalation", "Keep proof of all deadline compliance"]
      }
    ]
  },
  {
    id: "checklist",
    title: "Smart Checklist",
    icon: CheckSquare,
    color: "text-success",
    bgColor: "bg-success/10",
    sections: [
      {
        title: "Understanding Your Checklist",
        steps: [
          "Access 'Checklist' from the main menu",
          "View all checklist items across your cases",
          "Items are categorized (Complaint, Evidence, Response, etc.)",
          "Status shows: Complete, Needs Review, Missing, or Locked",
          "Items requiring proof show a paperclip icon"
        ],
        tips: ["Green checkmarks = complete with proof", "Red X = missing critical item"]
      },
      {
        title: "Completing Checklist Items",
        steps: [
          "Tap any checklist item to view details",
          "Complete the required action",
          "Upload proof document if required",
          "Tap 'Mark Complete' to update status",
          "Items without proof cannot be marked complete"
        ],
        tips: ["Proof requirements ensure case strength", "You can add notes to any item"]
      },
      {
        title: "Checklist Categories",
        steps: [
          "Complaint: Letter drafted, sent, response received",
          "Evidence: Documents uploaded, AI-scanned, indexed",
          "Response: Organisation responded within deadline",
          "Deadline: All deadlines tracked and met",
          "Escalation: Bundle ready, ombudsman contacted",
          "Document: All required documents generated"
        ],
        tips: ["100% checklist completion = escalation ready", "Use filters to focus on specific categories"]
      }
    ]
  },
  {
    id: "directories",
    title: "Directories",
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    sections: [
      {
        title: "Finding Complaint Contacts",
        steps: [
          "Access 'Directories' from the main menu",
          "Browse by industry category",
          "Search for specific organisations",
          "View complaints addresses, emails, phone numbers",
          "Copy contact details directly"
        ],
        tips: ["Directory data is regularly updated", "Use the search function for faster lookup"]
      },
      {
        title: "Ombudsman Contacts",
        steps: [
          "View all Australian ombudsman services",
          "AFCA: Banking, finance, insurance",
          "TIO: Telecommunications",
          "EWON: Energy and water utilities",
          "NCAT: Tenancy disputes (NSW)",
          "Each listing includes website, phone, submission forms"
        ],
        tips: ["Contact details link directly to complaint forms", "Note jurisdiction limits for each body"]
      },
      {
        title: "Using Directory Data",
        steps: [
          "Copy complaints email for your letter",
          "Paste complaints address into your case",
          "Use phone numbers for follow-up calls",
          "Reference ombudsman details in escalation letters",
          "Save frequently-used contacts to your case"
        ],
        tips: ["Always verify contact details on organisation websites", "Some organisations have multiple complaints channels"]
      }
    ]
  },
  {
    id: "calendar",
    title: "Calendar View",
    icon: Calendar,
    color: "text-accent",
    bgColor: "bg-accent/10",
    sections: [
      {
        title: "Viewing Your Schedule",
        steps: [
          "Access 'Calendar' from the main menu",
          "See all deadlines and events in monthly view",
          "Color-coded by case and event type",
          "Tap any date to see detailed events",
          "Switch between month, week, and day views"
        ],
        tips: ["Calendar syncs with your Deadline War Room", "Hover/tap events for quick preview"]
      },
      {
        title: "Adding Calendar Events",
        steps: [
          "Click any date to add a new event",
          "Or add from within a case timeline",
          "Set event title, date, and type",
          "Choose reminder settings",
          "Events appear across all calendar views"
        ],
        tips: ["Set reminders 3 days before important deadlines", "Recurring events can be set for regular reviews"]
      }
    ]
  },
  {
    id: "case-management",
    title: "Case Management",
    icon: Shield,
    color: "text-primary",
    bgColor: "bg-primary/10",
    sections: [
      {
        title: "Case Statuses",
        steps: [
          "Draft: Case created, not yet sent",
          "Complaint Sent: Letter sent to organisation",
          "Awaiting Response: Waiting for their reply",
          "Response Received: They've responded",
          "Escalation Ready: Ready for ombudsman",
          "Escalated: Submitted to ombudsman",
          "Resolved: Matter settled",
          "Closed: Case archived"
        ],
        tips: ["Update status as your case progresses", "Status affects your Matter Strength score"]
      },
      {
        title: "Case Priority Levels",
        steps: [
          "Low: No urgency, standard timeline",
          "Medium: Normal priority (default)",
          "High: Time-sensitive, needs attention",
          "Urgent: Critical deadline or severe impact"
        ],
        tips: ["Priority affects sorting and notifications", "Upgrade priority if deadlines approach"]
      },
      {
        title: "Editing Cases",
        steps: [
          "Open any case from 'My Cases'",
          "Tap 'Edit' in the Summary tab",
          "Modify any case details",
          "Add or update organisation details",
          "Save changes — they update everywhere"
        ],
        tips: ["Changes sync across all tabs instantly", "You can regenerate letters after editing"]
      }
    ]
  }
];

export default function HelpGuide() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.sections.some(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Help & User Guide</h1>
              <p className="text-sm text-muted-foreground mt-1">Step-by-step instructions for every feature</p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              Back
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">


        {/* Quick Start Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-2">New to Chaos Controller?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Start by creating your first case. Tap "New Case" from the menu, select your dispute category, 
                and follow the guided questions. The AI will help you draft a professional complaint letter.
              </p>
              <Button onClick={() => navigate("/new-case")} className="gap-2 text-sm">
                <PlusCircle className="w-4 h-4" />
                Create Your First Case
              </Button>
            </div>
          </div>
        </div>

        {/* Guide Sections */}
        {filteredGuides.map((guide) => {
          const Icon = guide.icon;
          const isExpanded = expandedSection === guide.id;

          return (
            <div key={guide.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggleSection(guide.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${guide.bgColor}`}>
                    <Icon className={`w-5 h-5 ${guide.color}`} />
                  </div>
                  <span className="font-heading font-semibold text-foreground">{guide.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-6 border-t border-border pt-5">
                  {guide.sections.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="font-heading font-semibold text-foreground mb-3">{section.title}</h4>
                      
                      {/* Steps */}
                      <div className="space-y-2 mb-4">
                        {section.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-primary">{stepIdx + 1}</span>
                            </div>
                            <p className="text-sm text-foreground pt-0.5">{step}</p>
                          </div>
                        ))}
                      </div>

                      {/* Tips */}
                      {section.tips && section.tips.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-500 mb-1">Pro Tips:</p>
                              {section.tips.map((tip, tipIdx) => (
                                <p key={tipIdx} className="text-xs text-amber-700 dark:text-amber-400">• {tip}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No guides found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}

        {/* Legal Links */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Chaos Controller. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 text-center">
          <h3 className="font-heading font-semibold text-foreground mb-2">Still Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our support team is here to assist you with any questions about your cases or the platform.
          </p>
          <a 
            href="mailto:chaoscontrollerapp@gmail.com"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}