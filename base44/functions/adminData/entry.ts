import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsonError, requireAdmin } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const [cases, users, deadlines, payments] = await Promise.all([
      base44.asServiceRole.entities.Case.list('-created_date', 200),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Deadline.list('-deadline_date', 200),
      base44.asServiceRole.entities.PaymentRequest.list('-created_date', 500),
    ]);

    return Response.json({
      success: true,
      data: {
        cases,
        users,
        deadlines,
        payments,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
});
