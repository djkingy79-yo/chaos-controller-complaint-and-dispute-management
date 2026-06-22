import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOGO_URL = 'https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg';

function encodeSubject(subject) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
}

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Build multipart/mixed MIME message supporting multiple base64 PDF attachments
function buildMultipartMime({ to, from, subject, htmlBody, attachments }) {
  const boundary = `chaos_boundary_${Date.now()}`;

  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    htmlBody,
  ];

  for (const att of (attachments || [])) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: application/pdf; name="${att.filename}"`);
    lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    lines.push(`Content-Transfer-Encoding: base64`);
    lines.push(``);
    // att.base64 must be raw base64 (not URL-safe), split into 76-char lines
    const wrapped = att.base64.match(/.{1,76}/g)?.join('\r\n') || att.base64;
    lines.push(wrapped);
  }

  lines.push(`--${boundary}--`);

  const raw = lines.join('\r\n');
  // URL-safe base64 for Gmail API
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildHtmlBody(letterLabel, caseItem, recipientEmail) {
  const caseRef = `CC-${caseItem.id.slice(0, 8).toUpperCase()}`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
<tr><td style="background:#ffffff;padding:16px 24px;border-bottom:2px solid #FFD700;text-align:center;">
<img src="${LOGO_URL}" alt="Chaos Controller" style="height:48px;width:auto;display:inline-block;" />
</td></tr>
<tr><td style="padding:28px 28px 20px 28px;color:#333333;font-size:14px;line-height:1.7;">
<p>Please find attached a formal <strong>${letterLabel}</strong> regarding the following dispute:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
  <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Case Reference</td><td style="color:#b45309;font-weight:bold;">${caseRef}</td></tr>
  <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Organisation</td><td style="color:#333333;">${caseItem.organisation_name || 'N/A'}</td></tr>
  <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Category</td><td style="color:#333333;">${caseItem.category ? caseItem.category.charAt(0).toUpperCase() + caseItem.category.slice(1) : 'N/A'}</td></tr>
</table>
<p>This correspondence has been formally documented and a copy retained in the Chaos Controller™ case management system.</p>
<p style="margin-top:16px;font-size:12px;color:#999999;">Sent via Chaos Controller™ — AI-Powered Consumer Advocacy</p>
</td></tr>
<tr><td style="background:#f9f9f9;border-top:1px solid #e0e0e0;padding:16px 24px;text-align:center;color:#666666;font-size:11px;">
Chaos Controller™ &mdash; <a href="https://chaoscontroller.com.au" style="color:#0066cc;text-decoration:none;">chaoscontroller.com.au</a>
</td></tr>
</table>
</td></tr>
</table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { caseId, letterType, letterLabel, recipientEmail, subject, attachments } = body;
    // attachments: [{ filename: string, base64: string }]

    if (!caseId || !letterType || !recipientEmail || !subject) {
      return Response.json({ error: 'caseId, letterType, recipientEmail, subject required' }, { status: 400 });
    }

    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    const caseItem = cases[0];
    if (!caseItem) return Response.json({ error: 'Case not found' }, { status: 404 });

    // Create pending log record first
    const log = await base44.asServiceRole.entities.EmailLog.create({
      case_id: caseId,
      letter_type: letterType,
      recipient_email: recipientEmail,
      subject,
      status: 'pending',
      attachment_names: (attachments || []).map(a => a.filename),
    });

    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

      const htmlBody = buildHtmlBody(letterLabel || letterType, caseItem, recipientEmail);

      const raw = buildMultipartMime({
        to: recipientEmail,
        from: 'Chaos Controller <chaoscontrollerapp@gmail.com>',
        subject,
        htmlBody,
        attachments: attachments || [],
      });

      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!gmailRes.ok) {
        const err = await gmailRes.text();
        throw new Error(`Gmail API error: ${err}`);
      }

      const gmailData = await gmailRes.json();

      // Update log to sent
      await base44.asServiceRole.entities.EmailLog.update(log.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        gmail_message_id: gmailData.id || '',
      });

      // Timeline event
      await base44.asServiceRole.entities.TimelineEvent.create({
        case_id: caseId,
        title: `${letterLabel || letterType} sent to ${recipientEmail}`,
        description: `Email sent via Gmail. Subject: "${subject}". Attachments: ${(attachments || []).map(a => a.filename).join(', ') || 'none'}.`,
        event_type: 'complaint',
        event_date: new Date().toISOString().split('T')[0],
        is_action_required: false,
      });

      return Response.json({ success: true, logId: log.id, gmailMessageId: gmailData.id });

    } catch (sendError) {
      // Update log to failed
      await base44.asServiceRole.entities.EmailLog.update(log.id, {
        status: 'failed',
        error_message: sendError.message,
      });
      throw sendError;
    }

  } catch (error) {
    console.error('sendLetterEmail failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});