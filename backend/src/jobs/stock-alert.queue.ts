import { Queue, Worker, Job } from "bullmq";
import { createIORedisConnection } from "../lib/redis";
import { connectDB } from "../lib/mongoose";
import Product from "@/models/Product";
import User from "@/models/User";
import { emailService } from "../services/email.service";
import { notificationService } from "../services/notification.service";
import { LOW_STOCK_THRESHOLD, QUEUE_NAMES } from "@nexmart/shared/constants";

interface StockAlertJobData {
  productId: string;
  productName: string;
  currentStock: number;
}

export const stockAlertQueue = new Queue(QUEUE_NAMES.STOCK_ALERT, {
  connection: createIORedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
  },
});

export const enqueueStockAlert = (data: StockAlertJobData) =>
  stockAlertQueue.add("STOCK_ALERT", data);

export const checkAndEnqueueStockAlerts = async (
  orderItems: Array<{ productId: string }>
): Promise<void> => {
  await connectDB();
  const productIds = [...new Set(orderItems.map((i) => i.productId))];

  const lowStockProducts = await Product.find({
    _id: { $in: productIds },
    stockQuantity: { $lte: LOW_STOCK_THRESHOLD },
    isActive: true,
  })
    .select("_id name stockQuantity")
    .lean();

  for (const product of lowStockProducts) {
    await enqueueStockAlert({
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.stockQuantity,
    });
  }
};

export const stockAlertWorker = new Worker<StockAlertJobData>(
  QUEUE_NAMES.STOCK_ALERT,
  async (job: Job<StockAlertJobData>) => {
    await connectDB();
    const { productId, productName, currentStock } = job.data;

    const admins = await User.find({
      role: "ADMIN",
      status: "ACTIVE",
    })
      .select("_id email name")
      .lean();

    const message = `Low stock alert: "${productName}" has only ${currentStock} unit(s) remaining.`;

    await Promise.allSettled(
      admins.map((admin: typeof admins[0]) =>
        notificationService.create({
          userId: admin._id.toString(),
          type: "system",
          title: "Low Stock Alert",
          message,
          metadata: { productId, currentStock },
        })
      )
    );

    const superAdmin = admins[0];

    if (superAdmin?.email) {
      await emailService.sendRaw({
        to: superAdmin.email,
        subject: `Low Stock: ${productName} — NexMart Admin`,
        html: `<p>Hi ${superAdmin.name},</p><p>${message}</p><p><a href="${process.env.APP_URL}/admin/products">Manage Products</a></p>`,
      });
    }

    console.log(`[StockAlertQueue] Alert sent for product: ${productName} (stock: ${currentStock})`);
  },
  { connection: createIORedisConnection(), concurrency: 2 }
);

stockAlertWorker.on("error", (err) => {
  console.error("[StockAlertWorker] Error:", err);
});
