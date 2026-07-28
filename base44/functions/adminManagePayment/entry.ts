import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { HttpError, jsonError, requireAdmin } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const { paymentId, action } = await req.json();
    if (!paymentId || !action) {
      throw new HttpError(400, 'paymentId and action are required');
    }

    const payments = await base44.asServiceRole.entities.PaymentRequest.filter({ id: paymentId });
    const payment = payments[0];
    if (!payment) {
      throw new HttpError(404, 'Payment request not found');
    }

    let updateData: Record<string, unknown>;
    if (action === 'verify') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      updateData = {
        status: 'verified',
        subscription_active: true,
        verified_date: new Date().toISOString(),
        subscription_expiry: expiry.toISOString().split('T')[0],
      };
    } else if (action === 'reject') {
      updateData = {
        status: 'rejected',
        subscription_active: false,
      };
    } else {
      throw new HttpError(400, 'Unsupported payment action');
    }

    const updatedPayment = await base44.asServiceRole.entities.PaymentRequest.update(paymentId, updateData);

    return Response.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    return jsonError(error);
  }
});
