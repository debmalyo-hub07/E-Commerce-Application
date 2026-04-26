import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Payment from "@/models/Payment";
import ProcessedWebhookEvent from "@/models/ProcessedWebhookEvent";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      console.error("[Webhook] Invalid Razorpay signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventType, payload } = event;

    console.log(`[Webhook] Received: ${eventType}`);

    const alreadyProcessed = await ProcessedWebhookEvent.findOne({ eventId: event.id });
    if (alreadyProcessed) {
      console.log(`[Webhook] Duplicate event ${event.id} — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    await ProcessedWebhookEvent.create({ eventId: event.id, eventType });

    switch (eventType) {
      case "payment.captured": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (order && order.paymentStatus !== "PAYMENT_VERIFIED") {
          await Order.findByIdAndUpdate(order._id, {
            razorpayPaymentId: payment.id,
            paymentStatus: "PAYMENT_VERIFIED",
            orderStatus: "CONFIRMED",
          });

          const user = await User.findById(order.userId);
          if (user) {
            const items = order.items.map((item) => ({
              name: (item.productSnapshot as any)?.name || "Product",
              quantity: item.quantity,
              price: item.totalPrice,
              imageUrl: (item.productSnapshot as any)?.imageUrl,
            }));

            const shippingAddress =
              typeof order.addressSnapshot === "object" && order.addressSnapshot !== null
                ? `${(order.addressSnapshot as any).fullName}, ${(order.addressSnapshot as any).addressLine1}, ${(order.addressSnapshot as any).city} ${(order.addressSnapshot as any).pincode}`
                : "Delivery Address";

            try {
              const { enqueueOrderConfirmEmail } = await import("@stylemart/shared/lib/email-queue").then(m => m.getEmailQueueFunctions());
              await enqueueOrderConfirmEmail({
                to: user.email,
                customerName: user.name,
                orderNumber: order.orderNumber,
                items,
                total: order.totalAmount,
                shippingAddress,
              });

              console.log(`[Webhook] payment.captured: Order ${order.orderNumber} confirmed and confirmation email queued`);
            } catch (emailErr) {
              console.error("[Webhook] Failed to queue confirmation email:", emailErr);
            }
          } else {
            console.warn(`[Webhook] User not found for order ${order.orderNumber}`);
          }
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (order && order.paymentStatus === "PENDING") {
          const mongoSession = await mongoose.startSession();
          mongoSession.startTransaction();
          try {
            for (const item of order.items) {
              await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: item.quantity } },
                { session: mongoSession }
              );
            }
            await Order.findByIdAndUpdate(
              order._id,
              { paymentStatus: "FAILED", orderStatus: "CANCELLED" },
              { session: mongoSession }
            );
            await mongoSession.commitTransaction();
          } catch (err) {
            await mongoSession.abortTransaction();
            throw err;
          } finally {
            mongoSession.endSession();
          }
          console.log(`[Webhook] payment.failed: Stock restored for order ${order.orderNumber}`);
        }
        break;
      }

      case "refund.created":
      case "refund.processed": {
        const refund = payload.refund?.entity;
        if (!refund?.payment_id) break;

        await Payment.updateMany(
          { providerPaymentId: refund.payment_id },
          { refundStatus: eventType === "refund.processed" ? "PROCESSED" : "INITIATED", refundId: refund.id }
        );

        if (eventType === "refund.processed") {
          const payment = await Payment.findOne({ providerPaymentId: refund.payment_id });
          if (payment) {
            const order = await Order.findById(payment.orderId);
            if (order) {
              const user = await User.findById(order.userId);
              if (user) {
                const refundAmount = (refund.amount as number) / 100;
                try {
                  const { enqueueRefundEmail } = await import("@stylemart/shared/lib/email-queue").then(m => m.getEmailQueueFunctions());
                  await enqueueRefundEmail({
                    to: user.email,
                    customerName: user.name,
                    orderNumber: order.orderNumber,
                    refundAmount,
                    refundMethod: "Original Payment Method",
                  });
                  console.log(`[Webhook] Refund confirmation email queued for order ${order.orderNumber}`);
                } catch (emailErr) {
                  console.error("[Webhook] Failed to queue refund email:", emailErr);
                }
              }
            }
          }
        }

        console.log(`[Webhook] ${eventType}: Refund ${refund.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
