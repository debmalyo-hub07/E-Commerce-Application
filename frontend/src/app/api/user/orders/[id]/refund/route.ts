import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { enqueueRefundEmail } from "@backend/jobs/email.queue";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const refundRequestSchema = z.object({
  reason: z.string().min(10, "Please provide a reason (at least 10 characters)").max(500),
});

export async function POST(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();

    const validated = refundRequestSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.errors.map((e) => `${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const order = await Order.findOne({ _id: id, userId: token.id });
    if (!order) return notFoundResponse("Order");

    if (order.orderStatus !== "DELIVERED") {
      return errorResponse(
        "Only delivered orders can be refunded",
        "INVALID_ORDER_STATUS",
        400
      );
    }

    const deliveryDate = new Date(order.updatedAt);
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 7) {
      return errorResponse(
        "Refund requests can only be made within 7 days of delivery",
        "REFUND_WINDOW_EXPIRED",
        400
      );
    }

    if (order.paymentStatus === "REFUND_INITIATED" || order.paymentStatus === "REFUNDED") {
      return errorResponse(
        "A refund has already been initiated for this order",
        "REFUND_ALREADY_INITIATED",
        400
      );
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const updated = await Order.findByIdAndUpdate(
        id,
        { paymentStatus: "REFUND_INITIATED" },
        { new: true, session: mongoSession }
      );

      await AuditLog.create(
        [
          {
            userId: token.id,
            action: "REFUND_REQUESTED",
            entityType: "Order",
            entityId: id,
            metadata: {
              reason: validated.data.reason,
              orderNumber: order.orderNumber,
              amount: order.totalAmount,
            },
          },
        ],
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();

      const user = await User.findById(token.id);
      if (user) {
        try {
          await enqueueRefundEmail({
            to: user.email,
            customerName: user.name,
            orderNumber: order.orderNumber,
            refundAmount: order.totalAmount,
            refundMethod: "Original Payment Method",
          });
        } catch (emailErr) {
          console.error("[Refund] Failed to queue refund email:", emailErr);
        }
      }

      return successResponse({
        message: "Refund request submitted successfully",
        order: updated,
      });
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  } catch (err) {
    console.error("[POST /api/user/orders/[id]/refund] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Failed to request refund",
      "INTERNAL_ERROR",
      500
    );
  }
}
