import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { /* entity automation — no body */ }

    const { paymentId, status, data: automationData, event: automationEvent } = body;

    // Support both entity automation path and direct frontend call
    let payment;
    if (automationEvent?.entity_name === 'PaymentRequest') {
      // Automation path — read from payload
      payment = automationData;
      if (!payment) return Response.json({ skipped: 'no payment data' });
      // Determine effective status for routing
      const effectiveStatus = payment.status;
      if (!['pending', 'verified'].includes(effectiveStatus)) {
        return Response.json({ skipped: 'status not pending or verified' });
      }
      // Reuse same email logic below by setting status
      body.status = effectiveStatus;
      body.paymentId = payment.id;
    } else {
      // Direct call from admin UI
      if (!paymentId || !status) {
        return Response.json({ error: 'Missing paymentId or status' }, { status: 400 });
      }
      payment = await base44.asServiceRole.entities.PaymentRequest.get(paymentId);
    }
    if (!payment) {
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }

    const effectivePaymentStatus = body.status;

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

    // Send email to admin (chaoscontrollerapp@gmail.com) for new payments
    if (effectivePaymentStatus === 'pending') {
      const adminEmail = 'chaoscontrollerapp@gmail.com';
      const adminSubject = `New Payment Notification - ${payment.plan_name} Plan`;
      const adminBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border: 2px solid #FFD700; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 60px; height: 60px; margin-bottom: 15px; }
            h1 { color: #b45309; font-size: 24px; margin: 0 0 10px 0; }
            .badge { background: #FFD700; color: #000; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; }
            .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .label { color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .value { color: #000000; font-size: 16px; font-weight: bold; }
            .highlight { color: #b45309; font-size: 20px; }
            .cta { text-align: center; margin-top: 30px; }
            .button { background: #FFD700; color: #000; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg" alt="Chaos Controller" class="logo" />
              <h1>New Payment Received</h1>
              <span class="badge">${payment.plan_name} Plan</span>
            </div>

            <div class="section">
              <div class="label">Customer Name</div>
              <div class="value">${payment.user_name || 'Not provided'}</div>
            </div>

            <div class="section">
              <div class="label">Customer Email</div>
              <div class="value">${payment.user_email}</div>
            </div>

            <div class="section">
              <div class="label">Plan Selected</div>
              <div class="value highlight">${payment.plan_name} — ${payment.amount} AUD</div>
            </div>

            ${payment.payid_reference ? `
            <div class="section">
              <div class="label">Payment Reference</div>
              <div class="value">${payment.payid_reference || 'Not provided'}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="label">Submitted Date</div>
              <div class="value">${new Date(payment.created_date).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            <div class="cta">
              <a href="https://chaoscontroller.com.au/dashboard" class="button">Verify Payment in Admin Dashboard</a>
            </div>

            <div class="footer">
              <p>Chaos Controller™ — Professional Dispute Management</p>
              <p>This is an automated notification from your payment system.</p>
            </div>
          </div>
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
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border: 2px solid #16a34a; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 60px; height: 60px; margin-bottom: 15px; }
            h1 { color: #16a34a; font-size: 24px; margin: 0 0 10px 0; }
            .badge { background: #16a34a; color: #000; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; }
            .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .label { color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .value { color: #000000; font-size: 16px; font-weight: bold; }
            .highlight { color: #b45309; font-size: 20px; }
            .success { color: #16a34a; font-size: 18px; font-weight: bold; }
            .cta { text-align: center; margin-top: 30px; }
            .button { background: #16a34a; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
            .features { background: #fef9e7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
            .check { color: #16a34a; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/191cbddd0_Untitleddesign.jpg" alt="Chaos Controller" class="logo" />
              <h1>Payment Verified!</h1>
              <span class="badge">${payment.plan_name} Activated</span>
            </div>

            <div class="section">
              <p class="success">Your ${payment.plan_name} subscription has been successfully activated!</p>
            </div>

            <div class="section">
              <div class="label">Subscription Period</div>
              <div class="value">
                ${payment.subscription_expiry 
                  ? `Until ${new Date(payment.subscription_expiry).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`
                  : 'Active'
                }
              </div>
            </div>

            <div class="features">
              <div class="label" style="color: #b45309;">What's Included in ${payment.plan_name}:</div>
              ${payment.plan_name === 'Starter' ? `
                <div class="feature-item"><span class="check">✓</span> 3 active cases</div>
                <div class="feature-item"><span class="check">✓</span> Evidence vault — 25 files per case</div>
                <div class="feature-item"><span class="check">✓</span> AI document scanning & data extraction</div>
                <div class="feature-item"><span class="check">✓</span> 1st Complaint Letter generator</div>
                <div class="feature-item"><span class="check">✓</span> Automated case timeline builder</div>
              ` : payment.plan_name === 'Pro' ? `
                <div class="feature-item"><span class="check">✓</span> Unlimited active cases</div>
                <div class="feature-item"><span class="check">✓</span> Unlimited evidence files</div>
                <div class="feature-item"><span class="check">✓</span> All 6 professional letters</div>
                <div class="feature-item"><span class="check">✓</span> Tribunal-ready escalation bundles</div>
                <div class="feature-item"><span class="check">✓</span> Google Calendar & Outlook auto-sync</div>
                <div class="feature-item"><span class="check">✓</span> Smart checklist with proof tracking</div>
              ` : `
                <div class="feature-item"><span class="check">✓</span> Everything in Pro — unlimited</div>
                <div class="feature-item"><span class="check">✓</span> Full ZIP case bundle export</div>
                <div class="feature-item"><span class="check">✓</span> Chaos Score & case strength analytics</div>
                <div class="feature-item"><span class="check">✓</span> Priority email support</div>
                <div class="feature-item"><span class="check">✓</span> Merchant shared case portals</div>
              `}
            </div>

            <div class="cta">
              <a href="https://chaoscontroller.com.au/dashboard" class="button">Go to Your Dashboard</a>
            </div>

            <div class="footer">
              <p>Chaos Controller™ — Professional Dispute Management</p>
              <p>Questions? Reply to this email or contact chaoscontrollerapp@gmail.com</p>
            </div>
          </div>
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