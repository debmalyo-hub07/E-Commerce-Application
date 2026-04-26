import { Queue, Worker, Job } from "bullmq";
import { createIORedisConnection } from "../lib/redis";
import { notificationService, type CreateNotificationParams } from "../services/notification.service";
import { QUEUE_NAMES } from "@stylemart/shared/constants";

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: createIORedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 500 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
});

export const enqueueNotification = (data: CreateNotificationParams) =>
  notificationQueue.add("CREATE_NOTIFICATION", data);

export const notificationWorker = new Worker<CreateNotificationParams>(
  QUEUE_NAMES.NOTIFICATION,
  async (job: Job<CreateNotificationParams>) => {
    await notificationService.create(job.data);
    console.log(`[NotificationQueue] Created notification for user ${job.data.userId}`);
  },
  { connection: createIORedisConnection(), concurrency: 10 }
);

notificationWorker.on("error", (err) => {
  console.error("[NotificationWorker] Error:", err);
});
