import mongoose from "mongoose";
import { connectDB } from "../lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import AuditLog from "@/models/AuditLog";
import { generateOrderNumber } from "@nexmart/shared/utils";
import { ALLOWED_ORDER_STATUS_TRANSITIONS } from "@nexmart/shared/constants";

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

  async createOrder(params: {
    userId: string;
    addressId: string;
    addressSnapshot: any;
    items: any[];
    subtotal: number;
    discountAmount: number;
    gstAmount: number;
    shippingAmount: number;
    totalAmount: number;
    couponCode?: string;
    paymentMethod: "RAZORPAY" | "COD";
    razorpayOrderId?: string;
  }): Promise<any> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Deduct stock for all items
      for (const item of params.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productSnapshot?.name || item.productId} is not available.`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}.`);
        }

        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stockQuantity: -item.quantity } },
          { session }
        );
      }

      // 2. Generate Order Number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 3. Create Order
      const [order] = await Order.create(
        [
          {
            ...params,
            orderNumber,
            paymentStatus: params.paymentMethod === "COD" ? "PENDING_COD" : "PENDING",
            orderStatus: "PENDING",
          },
        ],
        { session }
      );

      // 4. If COD, delete cart items (for RAZORPAY, we wait for verify)
      if (params.paymentMethod === "COD") {
        const CartItem = (mongoose.models.CartItem as any) || mongoose.model("CartItem");
        await CartItem.deleteMany({ userId: params.userId }).session(session);
      }

      await session.commitTransaction();
      return order;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async getOrderWithDetails(orderId: string, userId?: string) {
    await connectDB();
    const filter: Record<string, unknown> = { _id: orderId };
    if (userId) filter.userId = userId;

    return Order.findOne(filter)
      .populate("userId", "name email phone")
      .lean();
  },

  async updateOrderStatus(orderId: string, updates: { orderStatus: string; trackingNumber?: string; notes?: string }) {
    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    this.validateStatusTransition(order.orderStatus, updates.orderStatus);

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true }
    );

    // TODO: Trigger notifications via queue
    
    return updatedOrder;
  },
};
