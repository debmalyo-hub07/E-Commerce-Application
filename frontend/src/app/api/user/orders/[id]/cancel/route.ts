import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import AuditLog from "@/models/AuditLog";
import { ORDER_CANCEL_WINDOW_MS } from "@stylemart/shared/constants";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    const { id } = await params;
    const { reason } = await request.json();

    await connectDB();

    const order = await Order.findOne({
      _id: id,
      userId: token.id,
    });

    if (!order) {
      return errorResponse("Order not found", "NOT_FOUND", 404);
    }

    const allowedStatuses = ["PENDING", "CONFIRMED"];
    if (!allowedStatuses.includes(order.orderStatus)) {
      return errorResponse(
        `Cannot cancel order in ${order.orderStatus} status`,
        "INVALID_ORDER_STATUS",
        400
      );
    }

    const createdAtTime = new Date(order.createdAt).getTime();
    const nowTime = Date.now();
    const ageMs = nowTime - createdAtTime;

    if (ageMs > ORDER_CANCEL_WINDOW_MS) {
      return errorResponse(
        "Order cancellation window has expired (1 hour)",
        "ORDER_CANCEL_WINDOW_EXPIRED",
        400
      );
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stockQuantity: item.quantity } },
          { session: mongoSession }
        );
      }

      await Order.findByIdAndUpdate(
        order._id,
        {
          orderStatus: "CANCELLED",
          paymentStatus: order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus,
          cancelRequestedAt: new Date(),
          notes: reason || "Cancelled by customer",
        },
        { session: mongoSession }
      );

      await AuditLog.create(
        [
          {
            userId: token.id,
            action: "ORDER_CANCELLED",
            entityType: "Order",
            entityId: order._id,
            metadata: {
              orderNumber: order.orderNumber,
              reason: reason || "No reason provided",
              cancelledAt: new Date(),
            },
          },
        ],
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();

      return successResponse(
        { orderId: order._id.toString(), status: "cancelled" },
        200
      );
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  } catch (err) {
    console.error(`[POST /api/user/orders/${params}/cancel] Error:`, err);
    return errorResponse(
      err instanceof Error ? err.message : "Failed to cancel order",
      "INTERNAL_ERROR",
      500
    );
  }
}
