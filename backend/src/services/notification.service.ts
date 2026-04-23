import { connectDB } from "../lib/mongoose";
import Notification from "../../frontend/src/models/Notification";

export type NotificationType =
  | "order_update"
  | "payment"
  | "review"
  | "refund"
  | "account"
  | "system";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async create(params: CreateNotificationParams) {
    await connectDB();
    return Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
      isRead: false,
    });
  },

  async markAsRead(notificationId: string, userId: string) {
    await connectDB();
    return Notification.updateMany(
      { _id: notificationId, userId },
      { $set: { isRead: true } }
    );
  },

  async markAllAsRead(userId: string) {
    await connectDB();
    return Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  },

  async getForUser(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    await connectDB();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(options.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
    ]);

    return { notifications, total, page, limit };
  },

  async getUnreadCount(userId: string): Promise<number> {
    await connectDB();
    return Notification.countDocuments({ userId, isRead: false });
  },

  async notifyOrderUpdate(
    userId: string,
    orderNumber: string,
    newStatus: string
  ) {
    const statusMessages: Record<string, string> = {
      CONFIRMED: `Order ${orderNumber} has been confirmed!`,
      PROCESSING: `Order ${orderNumber} is being prepared.`,
      SHIPPED: `Order ${orderNumber} has been shipped!`,
      OUT_FOR_DELIVERY: `Order ${orderNumber} is out for delivery.`,
      DELIVERED: `Order ${orderNumber} has been delivered. Enjoy!`,
      CANCELLED: `Order ${orderNumber} has been cancelled.`,
      REFUNDED: `Refund for order ${orderNumber} has been processed.`,
    };

    await notificationService.create({
      userId,
      type: "order_update",
      title: "Order Update",
      message: statusMessages[newStatus] ?? `Order ${orderNumber} status changed to ${newStatus}.`,
      metadata: { orderNumber, status: newStatus },
    });
  },
};
