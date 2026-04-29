import { Queue, Worker, Job } from "bullmq";
import { createIORedisConnection } from "../lib/redis";
import { connectDB } from "../lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { orderService } from "../services/order.service";
import {
  PENDING_ORDER_EXPIRE_HOURS,
  SOFT_DELETE_PURGE_DAYS,
  QUEUE_NAMES,
} from "@nexmart/shared/constants";

export const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, {
  connection: createIORedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: { count: 50 },
  },
});

export const scheduleDailyCleanup = async () => {
  await cleanupQueue.add(
    "DAILY_CLEANUP",
    { tasks: ["expire_orders", "purge_deleted_users"] },
    {
      repeat: {
        pattern: "0 0 * * *",
      },
    }
  );
  console.log("[CleanupQueue] Daily cleanup job scheduled.");
};

interface CleanupJobData {
  tasks: string[];
}

export const cleanupWorker = new Worker<CleanupJobData>(
  QUEUE_NAMES.CLEANUP,
  async (job: Job<CleanupJobData>) => {
    const { tasks } = job.data;

    for (const task of tasks) {
      if (task === "expire_orders") {
        await expireStaleOrders();
      } else if (task === "purge_deleted_users") {
        await purgeDeletedUsers();
      }
    }
  },
  { connection: createIORedisConnection(), concurrency: 1 }
);

async function expireStaleOrders(): Promise<void> {
  await connectDB();
  const cutoff = new Date(
    Date.now() - PENDING_ORDER_EXPIRE_HOURS * 60 * 60 * 1000
  );

  const staleOrders = await Order.find({
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
    createdAt: { $lt: cutoff },
  })
    .select("_id")
    .lean();

  let expiredCount = 0;

  for (const order of staleOrders) {
    try {
      await orderService.cancelOrder(order._id.toString(), "SYSTEM", "Expired pending order");
      expiredCount++;
    } catch (err) {
      console.error(`[CleanupQueue] Failed to expire order ${order._id}:`, err);
    }
  }

  console.log(`[CleanupQueue] Expired ${expiredCount} stale orders.`);
}

async function purgeDeletedUsers(): Promise<void> {
  await connectDB();
  const cutoff = new Date(
    Date.now() - SOFT_DELETE_PURGE_DAYS * 24 * 60 * 60 * 1000
  );

  const result = await User.deleteMany({
    status: "DELETED",
    updatedAt: { $lt: cutoff },
  });

  console.log(`[CleanupQueue] Purged ${result.deletedCount} soft-deleted users.`);
}

cleanupWorker.on("error", (err) => {
  console.error("[CleanupWorker] Error:", err);
});
