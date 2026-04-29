/**
 * Backend Worker Entry Point
 * Starts all BullMQ workers and schedules recurring jobs.
 * Run with: npx tsx watch src/worker.ts (dev) or node dist/worker.js (prod)
 */

import { emailWorker } from "./jobs/email.queue";
import { notificationWorker } from "./jobs/notification.queue";
import { stockAlertWorker } from "./jobs/stock-alert.queue";
import { cleanupWorker, scheduleDailyCleanup } from "./jobs/cleanup.queue";

console.log("🚀 NexMart Backend Worker starting...");

// Start all workers
const workers = [emailWorker, notificationWorker, stockAlertWorker, cleanupWorker];

for (const worker of workers) {
  worker.on("active", (job) => {
    console.log(`[Worker] Job active: ${worker.name}:${job.id}`);
  });
  worker.on("completed", (job) => {
    console.log(`[Worker] Job completed: ${worker.name}:${job.id}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job failed: ${worker.name}:${job?.id} — ${err.message}`);
  });
}

// Schedule recurring cleanup job
scheduleDailyCleanup()
  .then(() => console.log("✅ Daily cleanup job scheduled"))
  .catch((err) => console.error("❌ Failed to schedule cleanup:", err));

console.log("✅ All workers started:");
console.log("   📧 Email worker");
console.log("   🔔 Notification worker");
console.log("   📦 Stock alert worker");
console.log("   🧹 Cleanup worker (daily at midnight)");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Closing workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});
