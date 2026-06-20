import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/20c6363b8_67B5CC10-D393-47DF-871D-C5B37790EF8E.jpg"
              alt="Chaos Controller Logo"
              className="w-full max-w-2xl mx-auto block"
            />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl text-foreground">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mt-1">Last updated: 15 June 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">1. Introduction</h2>
          <p className="text-foreground leading-relaxed">
            Chaos Controller ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use our consumer 
            advocacy and dispute management platform.
          </p>
          <p className="text-foreground leading-relaxed mt-4">
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access or use the Platform.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">2. Information We Collect</h2>
          
          <h3 className="font-heading font-semibold text-lg text-foreground mt-6 mb-3">2.1 Personal Information</h3>
          <p className="text-foreground leading-relaxed">
            We collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Register for an account (name, email address, password)</li>
            <li>Create a case (complainant details, organisation details)</li>
            <li>Upload documents to the Evidence Vault</li>
            <li>Generate complaint letters or other documents</li>
            <li>Contact our support team</li>
          </ul>

          <h3 className="font-heading font-semibold text-lg text-foreground mt-6 mb-3">2.2 Case Information</h3>
          <p className="text-foreground leading-relaxed">
            We store information related to your consumer disputes, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Case titles, categories, and descriptions</li>
            <li>Organisation names and contact details</li>
            <li>Account numbers, policy numbers, and reference numbers</li>
            <li>Incident dates and timelines</li>
            <li>Issue summaries and desired outcomes</li>
            <li>Complaint letters and correspondence</li>
          </ul>

          <h3 className="font-heading font-semibold text-lg text-foreground mt-6 mb-3">2.3 Automatically Collected Information</h3>
          <p className="text-foreground leading-relaxed">
            When you access the Platform, we automatically collect certain information, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Device information (browser type, operating system)</li>
            <li>IP address and general location</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Log data (access times, referring pages)</li>
          </ul>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">3. How We Use Your Information</h2>
          <p className="text-foreground leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Provide, maintain, and improve the Platform</li>
            <li>Create and manage your user account</li>
            <li>Process your case data and generate documents</li>
            <li>Send you service-related communications</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Detect, investigate, and prevent fraudulent transactions</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">4. AI Processing</h2>
          <p className="text-foreground leading-relaxed">
            The Platform uses artificial intelligence to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Generate complaint letters based on your case details</li>
            <li>Extract data from uploaded documents</li>
            <li>Create timeline events from evidence</li>
            <li>Analyze case strength and provide recommendations</li>
          </ul>
          <p className="text-foreground leading-relaxed mt-4">
            When you use AI features, your data is processed by our AI service providers in accordance with 
            their privacy policies and our data processing agreements. We do not allow AI providers to use 
            your data for training their models.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">5. Information Sharing</h2>
          <p className="text-foreground leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We may share information in the following situations:
          </p>

          <h3 className="font-heading font-semibold text-lg text-foreground mt-6 mb-3">5.1 Service Providers</h3>
          <p className="text-foreground leading-relaxed">
            We may share information with third-party service providers who perform services on our behalf, such as:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Cloud hosting and data storage providers</li>
            <li>AI processing services</li>
            <li>Email and communication services</li>
            <li>Analytics providers</li>
          </ul>
          <p className="text-foreground leading-relaxed mt-2">
            These providers are contractually obligated to protect your information and use it only for 
            the purposes we specify.
          </p>

          <h3 className="font-heading font-semibold text-lg text-foreground mt-6 mb-3">5.2 Legal Requirements</h3>
          <p className="text-foreground leading-relaxed">
            We may disclose information if required to do so by law or in response to valid requests by 
            public authorities (e.g., a court or government agency).
          </p>

          <h3 className="font-heading font-semibold text-lg text-foreground mt-6 mb-3">5.3 Business Transfers</h3>
          <p className="text-foreground leading-relaxed">
            If Chaos Controller is involved in a merger, acquisition, or sale of all or a portion of its 
            assets, you will be notified via email and/or a prominent notice on our website of any change 
            in ownership or uses of your personal information.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">6. Data Security</h2>
          <p className="text-foreground leading-relaxed">
            We implement appropriate technical and organisational security measures to protect your 
            personal information, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security assessments and updates</li>
            <li>Employee training on data protection</li>
          </ul>
          <p className="text-foreground leading-relaxed mt-4">
            However, no method of transmission over the internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your information, we cannot 
            guarantee its absolute security.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">7. Your Privacy Rights</h2>
          <p className="text-foreground leading-relaxed">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
            <li><strong>Objection:</strong> Object to processing of your personal information</li>
            <li><strong>Restriction:</strong> Request restriction of processing your personal information</li>
          </ul>
          <p className="text-foreground leading-relaxed mt-4">
            To exercise these rights, please contact us at chaoscontrollerapp@gmail.com. We will respond 
            to your request within 30 days.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">8. Data Retention</h2>
          <p className="text-foreground leading-relaxed">
            We retain your personal information for as long as necessary to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Provide you with the Platform services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
          </ul>
          <p className="text-foreground leading-relaxed mt-4">
            When you delete your account, we will delete or anonymize your personal information within 
            30 days, unless we are required to retain it for legal reasons.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">9. Cookies and Tracking</h2>
          <p className="text-foreground leading-relaxed">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
            <li>Remember your preferences and settings</li>
            <li>Understand how you use the Platform</li>
            <li>Improve our services and user experience</li>
          </ul>
          <p className="text-foreground leading-relaxed mt-4">
            You can control cookie settings through your browser. However, disabling cookies may limit 
            your ability to use certain features of the Platform.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">10. International Data Transfers</h2>
          <p className="text-foreground leading-relaxed">
            Your information may be transferred to — and maintained on — computers located outside of 
            your state, province, country, or other governmental jurisdiction where the data protection 
            laws may differ from those of your jurisdiction.
          </p>
          <p className="text-foreground leading-relaxed mt-4">
            We take all steps reasonably necessary to ensure that your data is treated securely and in 
            accordance with this Privacy Policy and applicable law.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">11. Children's Privacy</h2>
          <p className="text-foreground leading-relaxed">
            The Platform is not intended for users under the age of 18. We do not knowingly collect 
            personal information from children. If we become aware that we have collected personal 
            information from a child without parental consent, we will take steps to delete that information.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">12. Changes to This Privacy Policy</h2>
          <p className="text-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          <p className="text-foreground leading-relaxed mt-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this 
            Privacy Policy are effective when they are posted on this page.
          </p>
        </section>

        <section className="prose prose-sm max-w-none">
          <h2 className="font-heading font-bold text-xl text-foreground mb-4">13. Contact Us</h2>
          <p className="text-foreground leading-relaxed">
            For questions or concerns about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="bg-secondary/30 border border-border rounded-lg p-4 mt-4">
            <p className="text-foreground font-medium">Chaos Controller</p>
            <p className="text-foreground">Email: chaoscontrollerapp@gmail.com</p>
            <p className="text-foreground">Website: chaoscontroller.com.au</p>
          </div>
        </section>

        {/* Acceptance Button */}
        <div className="border-t border-border pt-8 mt-8">
          <Button 
            onClick={() => navigate("/")}
            className="w-full gap-2"
          >
            <Lock className="w-4 h-4" />
            I Acknowledge the Privacy Policy
          </Button>
        </div>
      </div>
    </div>
  );
}