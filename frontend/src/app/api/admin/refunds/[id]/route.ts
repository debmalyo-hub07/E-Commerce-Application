import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const refundApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().optional(),
});

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();

    const validated = refundApprovalSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        "Invalid request data",
        "VALIDATION_ERROR",
        400
      );
    }

    const order = await Order.findById(id);
    if (!order) return notFoundResponse("Order");

    if (order.paymentStatus !== "REFUND_INITIATED") {
      return errorResponse(
        "No pending refund request for this order",
        "NO_PENDING_REFUND",
        400
      );
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      if (validated.data.status === "APPROVED") {
        if (order.paymentMethod === "RAZORPAY") {
          const payment = await Payment.findOne({ orderId: id }).session(mongoSession);
          if (!payment || !payment.providerPaymentId) {
            throw new Error("Payment record not found for refund processing");
          }

          const refund = await razorpay.payments.refund(payment.providerPaymentId, {
            amount: Math.round(order.totalAmount * 100),
            notes: { orderId: id, reason: validated.data.note || "Customer refund request approved" },
          });

          await Payment.findByIdAndUpdate(
            payment._id,
            {
              refundId: refund.id,
              refundAmount: order.totalAmount,
              refundStatus: "SUCCESS",
              refundInitiatedAt: new Date(),
              status: "REFUNDED",
            },
            { session: mongoSession }
          );
        }

        await Order.findByIdAndUpdate(
          id,
          { paymentStatus: "REFUNDED", orderStatus: "REFUNDED" },
          { session: mongoSession }
        );
      } else {
        await Order.findByIdAndUpdate(
          id,
          { paymentStatus: "PAYMENT_VERIFIED" },
          { session: mongoSession }
        );
      }

      await AuditLog.create(
        [
          {
            userId: token.id,
            action: "REFUND_PROCESSED",
            entityType: "Order",
            entityId: id,
            metadata: {
              status: validated.data.status,
              note: validated.data.note || null,
              approvedBy: token.email,
            },
          },
        ],
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();

      const user = await User.findById(order.userId);
      if (user) {
        try {
          const { enqueueRefundEmail } = await import("@stylemart/shared/lib/email-queue").then(m => m.getEmailQueueFunctions());
          await enqueueRefundEmail({
            to: user.email,
            customerName: user.name,
            orderNumber: order.orderNumber,
            refundAmount: order.totalAmount,
            refundMethod: "Original Payment Method",
          });
        } catch (emailErr) {
          console.error("[Admin Refund] Failed to queue refund status email:", emailErr);
        }
      }

      return successResponse({
        message: `Refund request ${validated.data.status.toLowerCase()}`,
        order,
      });
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  } catch (err) {
    console.error("[PATCH /api/admin/refunds/[id]] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Failed to process refund",
      "INTERNAL_ERROR",
      500
    );
  }
}
