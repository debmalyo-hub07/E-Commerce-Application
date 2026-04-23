import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { ALLOWED_ORDER_STATUS_TRANSITIONS } from "@stylemart/shared/constants";

interface RouteContext { params: Promise<{ id: string }>; }

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: _req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

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
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();
    const { orderStatus, notes } = body;

    const order = await Order.findById(id).select("orderStatus").lean();
    if (!order) return notFoundResponse("Order");

    const allowed = ALLOWED_ORDER_STATUS_TRANSITIONS[order.orderStatus] ?? [];
    if (!allowed.includes(orderStatus)) {
      return errorResponse(
        `Cannot transition from ${order.orderStatus} to ${orderStatus}. Allowed: ${allowed.join(", ") || "none"}`,
        "VALIDATION_ERROR",
        400
      );
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      { orderStatus, ...(notes ? { notes } : {}) },
      { new: true }
    ).lean();

    await AuditLog.create({
      userId: token.id,
      action: "ORDER_STATUS_UPDATED",
      entityType: "Order",
      entityId: id,
      metadata: {
        from: order.orderStatus,
        to: orderStatus,
        updatedBy: token.email,
      },
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Failed to update order", "INTERNAL_ERROR", 500);
  }
}
