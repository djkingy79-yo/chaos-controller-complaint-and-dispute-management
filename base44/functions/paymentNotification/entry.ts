import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* entity automation — no body */ }

    const { paymentId, status, data, event } = body;

    // Support both entity automation path and direct frontend call
    let payment;
    let effectivePaymentStatus;
    
    if (event?.entity_name === 'PaymentRequest') {
      // Entity automation path — data contains the full entity record
      if (!data || !data.id) {
        return Response.json({ skipped: 'no payment data in automation payload' });
      }
      payment = data;
      effectivePaymentStatus = payment.status;
      
      // Only process pending or verified statuses
      if (!['pending', 'verified'].includes(effectivePaymentStatus)) {
        return Response.json({ skipped: `status ${effectivePaymentStatus} not processed` });
      }
    } else if (paymentId && status) {
      // Direct call from admin UI
      payment = await base44.asServiceRole.entities.PaymentRequest.get(paymentId);
      if (!payment) {
        return Response.json({ error: 'Payment not found' }, { status: 404 });
      }
      effectivePaymentStatus = status;
    } else {
      return Response.json({ error: 'Invalid request - missing paymentId and status, or automation data' }, { status: 400 });
    }

    // Send email using Core integration
    const sendEmail = async (to, subject, body) => {
      try {
        await base44.integrations.Core.SendEmail({
          to,
          subject,
          body,
          from_name: "Chaos Controller™",
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
        // Silently fail - don't block payment processing
      }
    };

    // Send email to admin for new payments
    if (effectivePaymentStatus === 'pending') {
      const adminEmail = 'chaoscontrollerapp@gmail.com';
      const adminSubject = `New Payment Notification - ${payment.plan_name} Plan`;
      const adminBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:20px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:2px solid #FFD700;border-radius:12px;overflow:hidden;">
                <tr><td style="background:#ffffff;padding:16px 24px;border-bottom:2px solid #FFD700;text-align:center;">
                  <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg" alt="Chaos Controller" style="height:60px;width:auto;display:inline-block;" />
                </td></tr>
                <tr><td style="padding:28px 28px 20px 28px;color:#333333;font-size:14px;line-height:1.7;">
                  <h1 style="color:#b45309;font-size:24px;margin:0 0 20px 0;text-align:center;">New Payment Received</h1>
                  <span style="background:#FFD700;color:#000;padding:6px 16px;border-radius:20px;font-weight:bold;font-size:12px;display:inline-block;margin-bottom:20px;">${payment.plan_name} Plan</span>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:140px;">Customer Name</td><td style="color:#000000;font-weight:bold;">${payment.user_name || 'Not provided'}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Customer Email</td><td style="color:#000000;font-weight:bold;">${payment.user_email}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Plan Selected</td><td style="color:#b45309;font-weight:bold;font-size:16px;">${payment.plan_name} — ${payment.amount} AUD</td></tr>
                    ${payment.payid_reference ? `<tr><td style="padding:6px 0;color:#666666;font-size:12px;">Payment Reference</td><td style="color:#000000;font-weight:bold;">${payment.payid_reference}</td></tr>` : ''}
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Submitted Date</td><td style="color:#000000;font-weight:bold;">${new Date(payment.created_date).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
                  </table>
                  
                  <div style="text-align:center;margin-top:30px;">
                    <a href="https://chaoscontroller.com.au/dashboard" style="background:#FFD700;color:#000;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">Verify Payment in Admin Dashboard</a>
                  </div>
                </td></tr>
                <tr><td style="background:#f9f9f9;border-top:1px solid #e0e0e0;padding:16px 24px;text-align:center;color:#666666;font-size:11px;">
                  Chaos Controller™ — Professional Dispute Management &nbsp;|&nbsp; <a href="https://chaoscontroller.com.au" style="color:#0066cc;text-decoration:none;">chaoscontroller.com.au</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;

      await sendEmail(adminEmail, adminSubject, adminBody);
    }

    // Send email to customer when payment is verified
    if (effectivePaymentStatus === 'verified') {
      const customerEmail = payment.user_email;
      const customerSubject = `Payment Verified - ${payment.plan_name} Plan Activated`;
      const customerBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:20px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:2px solid #16a34a;border-radius:12px;overflow:hidden;">
                <tr><td style="background:#ffffff;padding:16px 24px;border-bottom:2px solid #16a34a;text-align:center;">
                  <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg" alt="Chaos Controller" style="height:60px;width:auto;display:inline-block;" />
                </td></tr>
                <tr><td style="padding:28px 28px 20px 28px;color:#333333;font-size:14px;line-height:1.7;">
                  <h1 style="color:#16a34a;font-size:24px;margin:0 0 20px 0;text-align:center;">Payment Verified!</h1>
                  <span style="background:#16a34a;color:#fff;padding:6px 16px;border-radius:20px;font-weight:bold;font-size:12px;display:inline-block;margin-bottom:20px;">${payment.plan_name} Activated</span>
                  
                  <p style="color:#16a34a;font-size:18px;font-weight:bold;margin:20px 0;">Your ${payment.plan_name} subscription has been successfully activated!</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;width:160px;">Customer Name</td><td style="color:#000000;font-weight:bold;">${payment.user_name || '—'}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Customer Email</td><td style="color:#000000;font-weight:bold;">${payment.user_email}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Plan Activated</td><td style="color:#16a34a;font-weight:bold;font-size:15px;">${payment.plan_name}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Amount Paid</td><td style="color:#000000;font-weight:bold;">${payment.amount} AUD</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Transaction ID</td><td style="color:#000000;font-weight:bold;font-size:11px;">${payment.id}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Payment Date</td><td style="color:#000000;font-weight:bold;">${new Date(payment.verified_date || payment.updated_date || payment.created_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
                    <tr><td style="padding:6px 0;color:#666666;font-size:12px;">Subscription Active Until</td><td style="color:#000000;font-weight:bold;">
                      ${payment.subscription_expiry 
                        ? new Date(payment.subscription_expiry).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'Ongoing'
                      }
                    </td></tr>
                  </table>
                  
                  <div style="background:#fef9e7;border:1px solid #f59e0b;padding:20px;border-radius:8px;margin:20px 0;">
                    <div style="color:#b45309;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:bold;">What's Included in ${payment.plan_name}:</div>
                    ${payment.plan_name === 'Starter' ? `
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">3 active cases</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Evidence vault — 25 files per case</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">AI document scanning & data extraction</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">1st Complaint Letter generator</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Automated case timeline builder</td></tr>
                      </table>
                    ` : payment.plan_name === 'Pro' ? `
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Unlimited active cases</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Unlimited evidence files</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">All 6 professional letters</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Tribunal-ready escalation bundles</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Google Calendar & Outlook auto-sync</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Smart checklist with proof tracking</td></tr>
                      </table>
                    ` : `
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Everything in Pro — unlimited</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Full ZIP case bundle export</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Chaos Score & case strength analytics</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Priority email support</td></tr>
                        <tr><td style="padding:4px 0;"><span style="color:#16a34a;font-weight:bold;">✓</span></td><td style="padding:4px 0;color:#333333;font-size:13px;">Merchant shared case portals</td></tr>
                      </table>
                    `}
                  </div>
                  
                  <div style="text-align:center;margin-top:30px;">
                    <a href="https://chaoscontroller.com.au/dashboard" style="background:#16a34a;color:#fff;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">Go to Your Dashboard</a>
                  </div>
                </td></tr>
                <tr><td style="background:#f9f9f9;border-top:1px solid #e0e0e0;padding:16px 24px;text-align:center;color:#666666;font-size:11px;">
                  Chaos Controller™ — Professional Dispute Management &nbsp;|&nbsp; <a href="https://chaoscontroller.com.au" style="color:#0066cc;text-decoration:none;">chaoscontroller.com.au</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;

      await sendEmail(customerEmail, customerSubject, customerBody);
    }

    return Response.json({ success: true, message: `Email sent for ${effectivePaymentStatus} payment` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});