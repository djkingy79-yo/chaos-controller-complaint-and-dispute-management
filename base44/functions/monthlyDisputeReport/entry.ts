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
    body { font-family: 'Times New Roman', Times, serif; line-height: 1.2; color: #000; background: white; white-space: pre-wrap; }
    .letterhead-header { width: 100%; height: 80px; background-image: url('https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/1d2d51203_C6128B0A-C09C-469B-8922-3D3E5F42AC3D.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center top; background-color: #ffffff; }
    .content { padding: 0 25mm 20mm 25mm; background: white; }
    .header-section { margin-bottom: 16pt; }
    .header-section h1 { font-size: 14pt; font-weight: bold; color: #000; margin: 0 0 4pt 0; }
    .header-section p { font-size: 10pt; color: #666; margin: 0; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
    .stat-card { background: white; padding: 12px; border: 1px solid #ddd; border-left: 3px solid #000; }
    .stat-number { font-size: 24pt; font-weight: bold; color: #000; }
    .stat-label { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .success-rate { background: white; border: 2px solid #000; padding: 16px; text-align: center; margin: 16px 0; }
    .success-rate .number { font-size: 36pt; font-weight: bold; color: #000; }
    .success-rate .label { font-size: 10pt; color: #666; }
    .section { margin: 16px 0; }
    .section-title { font-size: 12pt; font-weight: bold; color: #000; margin-bottom: 8pt; border-bottom: 1px solid #000; padding-bottom: 4pt; }
    .category-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="letterhead-header"></div>
  <div class="content">
  <div class="header-section">
    <h1>Monthly Dispute Resolution Report</h1>
    <p>${reportMonth}</p>
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

    <div style="margin-top:20pt;padding-top:10pt;border-top:1px solid #ddd;font-size:9pt;color:#666;">
      <p style="margin:0;">Generated: ${format(new Date(), 'd MMMM yyyy')}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send via platform email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: subject,
      body: body,
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