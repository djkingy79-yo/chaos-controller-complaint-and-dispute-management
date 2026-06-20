import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by scheduled automation — use service role
    const deadlines = await base44.asServiceRole.entities.Deadline.list();
    const cases = await base44.asServiceRole.entities.Case.list();
    const users = await base44.asServiceRole.entities.User.list();

    const caseMap = Object.fromEntries(cases.map((c) => [c.id, c]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const now = new Date();
    const reminders = [];

    for (const deadline of deadlines) {
      if (!deadline.deadline_date || deadline.status !== "pending") continue;

      const deadlineDate = new Date(deadline.deadline_date);
      const daysUntil = Math.ceil((deadlineDate - now) / 86400000);

      // Remind at 7 days, 3 days, 2 days (48hr), 1 day, and on the day
      if (![7, 3, 2, 1, 0].includes(daysUntil)) continue;

      const caseItem = caseMap[deadline.case_id];
      if (!caseItem) continue;

      const caseOwner = userMap[caseItem.created_by_id];
      if (!caseOwner?.email) continue;

      const urgencyLabel = daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : daysUntil === 2 ? "in 48 HOURS" : `in ${daysUntil} days`;
      const subject = `⚠️ Deadline ${urgencyLabel}: ${deadline.title}`;
      const body = `Hi ${caseOwner.full_name || "there"},

This is an automated reminder from Chaos Controller™.

DEADLINE ALERT — ${urgencyLabel.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Case: ${caseItem.title}
Organisation: ${caseItem.organisation_name || "N/A"}
Deadline: ${deadline.title}
Due Date: ${new Date(deadline.deadline_date).toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

${daysUntil === 0 ? "⚠️ This deadline is DUE TODAY. Take action immediately." : `You have ${daysUntil} day${daysUntil === 1 ? "" : "s"} to act.`}

Log in to Chaos Controller™ to review your case and take action:
https://chaoscontroller.base44.app/case/${caseItem.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never Fear. Control Starts Here.
Chaos Controller™ — AI-Powered Consumer Advocacy`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: caseOwner.email,
        subject,
        body,
        from_name: "Chaos Controller™",
      });

      // Also create an in-app notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: caseItem.created_by_id,
        case_id: deadline.case_id,
        title: `Deadline ${urgencyLabel}: ${deadline.title}`,
        message: `Your deadline for case "${caseItem.title}" is due ${urgencyLabel}.`,
        type: "deadline",
        urgency: daysUntil === 0 ? "critical" : daysUntil === 1 ? "high" : "medium",
        is_read: false,
      });

      reminders.push({ deadline: deadline.title, case: caseItem.title, daysUntil, email: caseOwner.email });
    }

    return Response.json({ sent: reminders.length, reminders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});