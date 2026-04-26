import mongoose from "mongoose";
import { connectDB } from "../lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import AuditLog from "@/models/AuditLog";
import { generateOrderNumber } from "@stylemart/shared/utils";
import { ALLOWED_ORDER_STATUS_TRANSITIONS } from "@stylemart/shared/constants";

export const orderService = {
  validateStock(cartItems: Array<{
    product: { name: string; stockQuantity: number };
    variant?: { stock: number } | null;
    quantity: number;
  }>): void {
    for (const item of cartItems) {
      const available = item.variant
        ? item.variant.stock
        : item.product.stockQuantity;

      if (available < item.quantity) {
        const error = new Error(
          `Insufficient stock for "${item.product.name}". Available: ${available}, Requested: ${item.quantity}`
        );
        (error as Error & { error_code: string }).error_code = "INSUFFICIENT_STOCK";
        throw error;
      }
    }
  },

  async deductStock(
    session: mongoose.ClientSession,
    items: Array<{ productId: string | mongoose.Types.ObjectId; variantId?: string | mongoose.Types.ObjectId | null; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: -item.quantity } },
        { session }
      );
    }
  },

  async restoreStock(
    session: mongoose.ClientSession,
    items: Array<{ productId: string | mongoose.Types.ObjectId; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: item.quantity } },
        { session }
      );
    }
  },

  validateStatusTransition(currentStatus: string, newStatus: string): void {
    const allowed = ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`
      );
    }
  },

  generateOrderNumber(): string {
    return generateOrderNumber();
  },

  async getOrderWithDetails(orderId: string, userId?: string) {
    await connectDB();
    const filter: Record<string, unknown> = { _id: orderId };
    if (userId) filter.userId = userId;

    return Order.findOne(filter)
      .populate("userId", "name email phone")
      .populate("addressId")
      .lean();
  },

  async cancelOrder(
    orderId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<void> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error("Order not found");

      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stockQuantity: item.quantity } },
          { session }
        );
      }

      const newPaymentStatus =
        order.paymentStatus === "PAYMENT_VERIFIED" || order.paymentStatus === "PENDING_COD"
          ? "REFUND_INITIATED"
          : "FAILED";

      await Order.findByIdAndUpdate(orderId, {
        orderStatus: "CANCELLED",
        paymentStatus: newPaymentStatus,
      }, { session });

      await AuditLog.create([{
        userId: cancelledBy,
        action: "ORDER_CANCELLED",
        entityType: "Order",
        entityId: orderId,
        metadata: { reason },
      }], { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
