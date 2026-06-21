import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOGO_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/4bbb85089_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png';

function htmlEmail(bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">
<tr><td style="background:#000;padding:16px 24px;border-bottom:2px solid #FFD700;text-align:center;">
<img src="${LOGO_URL}" alt="Chaos Controller" style="height:48px;width:auto;display:inline-block;" />
</td></tr>
<tr><td style="padding:28px 28px 20px 28px;color:#e0e0e0;font-size:14px;line-height:1.7;">
${bodyHtml}
</td></tr>
<tr><td style="background:#0a0a0a;border-top:1px solid #222;padding:16px 24px;text-align:center;color:#555;font-size:11px;">
Chaos Controller™ &mdash; AI-Powered Consumer Advocacy &nbsp;|&nbsp; <a href="https://chaoscontroller.com.au" style="color:#FFD700;text-decoration:none;">chaoscontroller.com.au</a>
</td></tr>
</table>
</td></tr>
</table></body></html>`;
}

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
    const subject = `New Evidence Uploaded: "${caseItem.title}"`;
    const html = htmlEmail(`
      <p style="color:#aaa;font-size:12px;margin:0 0 20px 0;">NEW EVIDENCE UPLOADED</p>
      <p>Hi <strong style="color:#fff;">${owner.full_name || 'there'}</strong>,</p>
      <p>New evidence has been added to your case in Chaos Controller™.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;padding:16px;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#888;font-size:12px;width:120px;">Case</td><td style="color:#fff;font-weight:bold;">${caseItem.title}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:12px;">Organisation</td><td style="color:#fff;">${caseItem.organisation_name || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:12px;">File</td><td style="color:#FFD700;font-weight:bold;">${evidence.file_name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:12px;">Type</td><td style="color:#fff;">${fileTypeLabel}</td></tr>
        ${evidence.description ? `<tr><td style="padding:6px 0;color:#888;font-size:12px;">Description</td><td style="color:#ccc;">${evidence.description}</td></tr>` : ''}
        ${evidence.event_date ? `<tr><td style="padding:6px 0;color:#888;font-size:12px;">Dated</td><td style="color:#ccc;">${new Date(evidence.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
      </table>
      <p style="color:#ccc;">Your evidence vault is growing stronger. Log in to review and continue building your case.</p>
      <p style="margin-top:24px;"><a href="https://chaoscontroller.com.au/case/${caseItem.id}" style="background:#FFD700;color:#000;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Your Case</a></p>
    `);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: owner.email,
      subject,
      body: html,
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