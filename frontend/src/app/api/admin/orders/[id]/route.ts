import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { ALLOWED_ORDER_STATUS_TRANSITIONS } from "@stylemart/shared/constants";
import { rateLimiters, applyRateLimit } from "@stylemart/shared/lib/ratelimit";

interface RouteContext { params: Promise<{ id: string }>; }

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  const rateLimitResponse = await applyRateLimit(
    _req,
    rateLimiters.adminEndpoint,
    token.id as string
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const { id } = await ctx.params;

    const order = await Order.findById(id)
      .populate("userId", "name email phone")
      .populate("addressId")
      .lean();

    if (!order) return notFoundResponse("Order");

    const payments = await Payment.find({ orderId: id }).sort({ createdAt: -1 }).lean();

    return successResponse({ ...order, payments });
  } catch {
    return errorResponse("Failed to fetch order", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.adminEndpoint,
    token.id as string
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();
    const { orderStatus, trackingNumber, notes } = body;

    const order = await Order.findById(id);
    if (!order) return notFoundResponse("Order");

    const allowed = ALLOWED_ORDER_STATUS_TRANSITIONS[order.orderStatus] ?? [];
    if (!allowed.includes(orderStatus)) {
      return errorResponse(
        `Cannot transition from ${order.orderStatus} to ${orderStatus}. Allowed: ${allowed.join(", ") || "none"}`,
        "VALIDATION_ERROR",
        400
      );
    }

    if (orderStatus === "SHIPPED" && !trackingNumber) {
      return errorResponse(
        "Tracking number is required when marking order as SHIPPED",
        "VALIDATION_ERROR",
        400
      );
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const updateData: Record<string, unknown> = { orderStatus };
      if (notes) updateData.notes = notes;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;

      const updated = await Order.findByIdAndUpdate(
        id,
        updateData,
        { new: true, session: mongoSession }
      );

      await AuditLog.create(
        [
          {
            userId: token.id,
            action: "ORDER_STATUS_UPDATED",
            entityType: "Order",
            entityId: id,
            metadata: {
              from: order.orderStatus,
              to: orderStatus,
              updatedBy: token.email,
              trackingNumber: trackingNumber || null,
            },
          },
        ],
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();

      const user = await User.findById(order.userId);
      if (user && (orderStatus === "SHIPPED" || orderStatus === "DELIVERED")) {
        try {
          const { enqueueShippingUpdateEmail } = await import("@stylemart/shared/lib/email-queue").then(m => m.getEmailQueueFunctions());
          await enqueueShippingUpdateEmail({
            to: user.email,
            customerName: user.name,
            orderNumber: order.orderNumber,
            trackingNumber: trackingNumber || undefined,
            carrier: "Standard Courier",
            estimatedDelivery:
              orderStatus === "SHIPPED"
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                : undefined,
          });
          console.log(`[Admin] Shipping update email queued for order ${order.orderNumber}`);
        } catch (emailErr) {
          console.error(`[Admin] Failed to queue shipping email:`, emailErr);
        }
      }

      return successResponse(updated);
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Failed to update order",
      "INTERNAL_ERROR",
      500
    );
  }
}
