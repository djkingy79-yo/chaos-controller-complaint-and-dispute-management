import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { data } = body;

    if (!data || !data.case_id) {
      return Response.json({ skipped: "no evidence data" });
    }

    const evidence = data;

    // Fetch the case
    const cases = await base44.asServiceRole.entities.Case.filter({ id: evidence.case_id });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ skipped: "case not found" });

    // Fetch the case owner
    const users = await base44.asServiceRole.entities.User.list();
    const owner = users.find(u => u.id === caseItem.created_by_id);
    if (!owner?.email) return Response.json({ skipped: "no owner email" });

    const fileTypeLabels = {
      email: "Email",
      photo: "Photo",
      contract: "Contract",
      statement: "Statement",
      notice: "Notice",
      receipt: "Receipt",
      report: "Report",
      correspondence: "Correspondence",
      lease: "Lease",
      bank_statement: "Bank Statement",
      invoice: "Invoice",
      id_document: "ID Document",
      other: "Document"
    };

    const fileTypeLabel = fileTypeLabels[evidence.file_type] || "Document";
    const subject = `📎 New Evidence Uploaded: "${caseItem.title}"`;
    const body_text = `Hi ${owner.full_name || "there"},

New evidence has been added to your case in Chaos Controller™.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW EVIDENCE UPLOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || "N/A"}

File: ${evidence.file_name}
Type: ${fileTypeLabel}
${evidence.description ? `Description: ${evidence.description}` : ""}
${evidence.event_date ? `Dated: ${new Date(evidence.event_date).toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : ""}

Your evidence vault is growing stronger. Log in to review and continue building your case.

View your case:
https://chaoscontroller.com.au/case/${caseItem.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never Fear. Control Starts Here.
Chaos Controller™ — AI-Powered Consumer Advocacy
Support: chaoscontrollerapp@gmail.com`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: owner.email,
      subject,
      body: body_text,
      from_name: "Chaos Controller™"
    });

    // In-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: caseItem.created_by_id,
      case_id: caseItem.id,
      title: `New evidence uploaded: ${evidence.file_name}`,
      message: `A ${fileTypeLabel.toLowerCase()} has been added to "${caseItem.title}".`,
      type: "document_uploaded",
      urgency: "low",
      is_read: false
    });

    return Response.json({ sent: true, to: owner.email, file: evidence.file_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});