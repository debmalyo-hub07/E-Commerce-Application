import crypto from "crypto";
import { razorpay } from "../lib/razorpay";
import { connectDB } from "../lib/mongoose";
import AuditLog from "@/models/AuditLog";
import type mongoose from "mongoose";

interface CreateRazorpayOrderParams {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RefundParams {
  paymentId: string;
  amount?: number;
  notes?: Record<string, string>;
}

export const paymentService = {
  async createRazorpayOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrderResult> {
    const { amount, receipt, notes = {} } = params;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      notes,
    });

    return {
      id: order.id,
      amount: order.amount as number,
      currency: order.currency,
      receipt: order.receipt ?? receipt,
      status: order.status,
    };
  },

  verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    return generated === signature;
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const generated = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return generated === signature;
  },

  async initiateRefund(params: RefundParams): Promise<{ refundId: string; status: string }> {
    const { paymentId, amount, notes = {} } = params;

    const refundParams: Record<string, unknown> = { notes };
    if (amount !== undefined) {
      refundParams.amount = Math.round(amount * 100);
      refundParams.speed = "normal";
    }

    const refund = await razorpay.payments.refund(paymentId, refundParams);

    return {
      refundId: refund.id,
      status: refund.status,
    };
  },

  async fetchRefundStatus(refundId: string): Promise<{ status: string; amount: number }> {
    const refund = await razorpay.refunds.fetch(refundId);
    return {
      status: refund.status,
      amount: (refund.amount as number) / 100,
    };
  },

  async logAuditEvent(
    session: mongoose.ClientSession | null,
    params: {
      userId?: string;
      action: string;
      entityType: string;
      entityId: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
    }
  ): Promise<void> {
    await connectDB();
    const data = {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
    };

    if (session) {
      await AuditLog.create([data], { session });
    } else {
      await AuditLog.create(data);
    }
  },
};
