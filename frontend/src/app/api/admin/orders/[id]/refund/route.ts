import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import Product from "@/models/Product";
import AuditLog from "@/models/AuditLog";
import { razorpay } from "@/lib/razorpay";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

interface RouteContext { params: Promise<{ id: string }>; }

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id: orderId } = await ctx.params;
    const { amount, reason } = await request.json();

    const order = await Order.findById(orderId).lean();
    if (!order) return notFoundResponse("Order");

    if (!["PAYMENT_VERIFIED", "SUCCESS"].includes(order.paymentStatus)) {
      return errorResponse(
        "Refund can only be initiated for verified payments",
        "VALIDATION_ERROR",
        400
      );
    }

    const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 }).lean();
    if (!payment || !payment.providerPaymentId) {
      return errorResponse("No payment found for this order", "NOT_FOUND", 404);
    }

    const refundAmount = amount ?? order.totalAmount;
    const refundParams: Record<string, unknown> = { notes: { reason, admin: token.email } };
    if (amount) refundParams.amount = Math.round(refundAmount * 100);

    const refund = await razorpay.payments.refund(payment.providerPaymentId, refundParams);

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      await Order.findByIdAndUpdate(orderId, {
        orderStatus: "REFUNDED",
        paymentStatus: "REFUND_INITIATED",
      }, { session: mongoSession });

      await Payment.findByIdAndUpdate(payment._id, {
        refundId: refund.id,
        refundAmount,
        refundStatus: refund.status,
        refundInitiatedAt: new Date(),
      }, { session: mongoSession });

      await AuditLog.create([{
        userId: token.id,
        action: "REFUND_INITIATED",
        entityType: "Order",
        entityId: orderId,
        metadata: {
          refundId: refund.id,
          refundAmount,
          reason,
          initiatedBy: token.email,
        },
      }], { session: mongoSession });

      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stockQuantity: item.quantity } },
          { session: mongoSession }
        );
      }

      await mongoSession.commitTransaction();
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }

    return successResponse({
      refundId: refund.id,
      refundAmount,
      status: refund.status,
    });
  } catch (err) {
    console.error("[POST /api/admin/orders/[id]/refund] Error:", err);
    return errorResponse("Failed to process refund", "INTERNAL_ERROR", 500);
  }
}
