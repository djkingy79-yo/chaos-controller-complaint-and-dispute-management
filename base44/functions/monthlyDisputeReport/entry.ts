import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { format, subMonths, startOfMonth, endOfMonth } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }

    // Calculate last month's date range
    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    console.log(`Generating monthly report for ${format(lastMonthStart, 'MMMM yyyy')}`);

    // Get all cases for last month
    const allCases = await base44.asServiceRole.entities.Case.filter({});
    
    // Filter cases created or updated last month
    const lastMonthCases = allCases.filter(c => {
      const caseDate = new Date(c.created_date);
      return caseDate >= lastMonthStart && caseDate <= lastMonthEnd;
    });

    // Count by status
    const resolvedCases = lastMonthCases.filter(c => c.status === 'resolved');
    const escalatedCases = lastMonthCases.filter(c => c.status === 'escalated');
    const closedCases = lastMonthCases.filter(c => c.status === 'closed');
    const activeCases = lastMonthCases.filter(c => 
      !['resolved', 'escalated', 'closed'].includes(c.status)
    );

    // Calculate success rate
    const totalCompleted = resolvedCases.length + escalatedCases.length + closedCases.length;
    const successRate = totalCompleted > 0 
      ? ((resolvedCases.length + closedCases.length) / totalCompleted * 100).toFixed(1)
      : 0;

    // Count by category
    const categoryBreakdown = {};
    lastMonthCases.forEach(c => {
      const cat = c.category || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    // Get user's email preferences from settings or use their account email
    const userEmail = user.email;

    // Generate report email
    const reportMonth = format(lastMonthStart, 'MMMM yyyy');
    const subject = `📊 Monthly Dispute Report — ${reportMonth}`;
    
    const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { padding: 24px; background: #f9fafb; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .stat-card { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #1e40af; }
    .stat-number { font-size: 28px; font-weight: bold; color: #1e40af; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .success-rate { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .success-rate .number { font-size: 48px; font-weight: bold; }
    .success-rate .label { font-size: 14px; opacity: 0.9; }
    .section { margin: 24px 0; }
    .section-title { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .footer { text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">Chaos Controller™</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Monthly Dispute Resolution Report</p>
    <p style="margin: 4px 0 0 0; font-size: 14px;">${reportMonth}</p>
  </div>
  
  <div class="content">
    <div class="success-rate">
      <div class="number">${successRate}%</div>
      <div class="label">Overall Success Rate</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
        (Resolved + Closed) / Total Completed Cases
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-number">${lastMonthCases.length}</div>
        <div class="stat-label">Total Cases</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${activeCases.length}</div>
        <div class="stat-label">Active Cases</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${resolvedCases.length}</div>
        <div class="stat-label">Resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${escalatedCases.length}</div>
        <div class="stat-label">Escalated</div>
      </div>
    </div>

    ${closedCases.length > 0 ? `
    <div class="stat-card" style="margin-bottom: 20px;">
      <div class="stat-number">${closedCases.length}</div>
      <div class="stat-label">Closed</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Cases by Category</div>
      ${Object.entries(categoryBreakdown).map(([cat, count]) => `
        <div class="category-item">
          <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          <strong>${count}</strong>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <div class="section-title">Report Summary</div>
      <p style="font-size: 14px; color: #4b5563;">
        This month, you had <strong>${lastMonthCases.length}</strong> cases in the Chaos Controller™ system. 
        ${resolvedCases.length > 0 ? `Out of these, <strong>${resolvedCases.length}</strong> case(s) were successfully resolved, ` : ''}
        ${escalatedCases.length > 0 ? `<strong>${escalatedCases.length}</strong> case(s) required external escalation, ` : ''}
        ${closedCases.length > 0 ? `and <strong>${closedCases.length}</strong> case(s) were closed. ` : ''}
        Your success rate of <strong>${successRate}%</strong> reflects cases that reached resolution without requiring escalation to external tribunals or bodies.
      </p>
    </div>

    <div class="footer">
      <p>Generated by Chaos Controller™ | chaoscontroller.com.au</p>
      <p>Report generated on ${format(new Date(), 'd MMMM yyyy')}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send via platform email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: subject,
      body: body.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      from_name: "Chaos Controller™"
    });
    console.log('Monthly report sent');

    return Response.json({
      success: true,
      message: `Monthly report for ${reportMonth} sent to ${userEmail}`,
      stats: {
        totalCases: lastMonthCases.length,
        resolved: resolvedCases.length,
        escalated: escalatedCases.length,
        closed: closedCases.length,
        active: activeCases.length,
        successRate: successRate
      }
    });

  } catch (error) {
    console.error('Error generating monthly report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});