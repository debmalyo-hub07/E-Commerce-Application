import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { ioRedis } from "../lib/redis";
import { emailService } from "../services/email.service";
import { connectDB } from "../lib/mongoose";
import AuditLog from "../../frontend/src/models/AuditLog";
import { EMAIL_JOBS, QUEUE_NAMES } from "../../shared/constants";

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: ioRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

interface OrderConfirmJobData {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>;
  total: number;
  shippingAddress: string;
}

interface ShippingUpdateJobData {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

interface RefundJobData {
  to: string;
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  refundMethod: string;
}

interface AccountSuspendedJobData {
  to: string;
  customerName: string;
  reason?: string;
}

type EmailJobData =
  | { type: typeof EMAIL_JOBS.ORDER_CONFIRM; payload: OrderConfirmJobData }
  | { type: typeof EMAIL_JOBS.SHIPPING_UPDATE; payload: ShippingUpdateJobData }
  | { type: typeof EMAIL_JOBS.REFUND_CONFIRM; payload: RefundJobData }
  | { type: typeof EMAIL_JOBS.ACCOUNT_SUSPENDED; payload: AccountSuspendedJobData };

export const enqueueOrderConfirmEmail = (data: OrderConfirmJobData) =>
  emailQueue.add(EMAIL_JOBS.ORDER_CONFIRM, { type: EMAIL_JOBS.ORDER_CONFIRM, payload: data });

export const enqueueShippingUpdateEmail = (data: ShippingUpdateJobData) =>
  emailQueue.add(EMAIL_JOBS.SHIPPING_UPDATE, { type: EMAIL_JOBS.SHIPPING_UPDATE, payload: data });

export const enqueueRefundEmail = (data: RefundJobData) =>
  emailQueue.add(EMAIL_JOBS.REFUND_CONFIRM, { type: EMAIL_JOBS.REFUND_CONFIRM, payload: data });

export const enqueueAccountSuspendedEmail = (data: AccountSuspendedJobData) =>
  emailQueue.add(EMAIL_JOBS.ACCOUNT_SUSPENDED, { type: EMAIL_JOBS.ACCOUNT_SUSPENDED, payload: data });

export const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job: Job<EmailJobData>) => {
    const { type, payload } = job.data;

    switch (type) {
      case EMAIL_JOBS.ORDER_CONFIRM:
        await emailService.sendOrderConfirmation(payload.to, payload);
        break;

      case EMAIL_JOBS.SHIPPING_UPDATE:
        await emailService.sendShippingUpdate(payload.to, payload);
        break;

      case EMAIL_JOBS.REFUND_CONFIRM:
        await emailService.sendRefundConfirmation(payload.to, {
          ...payload,
          processingDays: 5,
        });
        break;

      case EMAIL_JOBS.ACCOUNT_SUSPENDED:
        await emailService.sendAccountSuspended(payload.to, {
          ...payload,
          supportEmail: "support@stylemart.in",
        });
        break;

      default:
        throw new Error(`Unknown email job type`);
    }

    console.log(`[EmailQueue] Sent ${type} email to ${(payload as { to: string }).to}`);
  },
  {
    connection: ioRedis,
    concurrency: 5,
  }
);

const emailQueueEvents = new QueueEvents(QUEUE_NAMES.EMAIL, { connection: ioRedis });

emailQueueEvents.on("failed", async ({ jobId, failedReason }) => {
  console.error(`[EmailQueue] Job ${jobId} failed: ${failedReason}`);
  try {
    await connectDB();
    await AuditLog.create({
      action: "JOB_FAILED",
      entityType: "EmailQueue",
      entityId: jobId,
      metadata: { reason: failedReason, queue: QUEUE_NAMES.EMAIL },
    });
  } catch (dbErr) {
    console.error("[EmailQueue] Failed to log dead-letter event:", dbErr);
  }
});

emailWorker.on("error", (err) => {
  console.error("[EmailWorker] Worker error:", err);
});
