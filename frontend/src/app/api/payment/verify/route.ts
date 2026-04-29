import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import Order from "@/models/Order";
import CartItem from "@/models/CartItem";
import Payment from "@/models/Payment";
import { z } from "zod";
import { paymentService } from "@backend/services/payment.service";

const verifySchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = verifySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid verification data", data: null },
        { status: 400 }
      );
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = validated.data;

    const isValid = paymentService.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error(
        `[Payment Verify] Signature mismatch - Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`
      );
      
      await paymentService.logAuditEvent(null, {
        userId: session.user.id,
        action: "PAYMENT_VERIFICATION_FAILED",
        entityType: "Order",
        entityId: razorpay_order_id, // This might need a proper ID lookup, but using the order_id for now
        metadata: { reason: "Signature verification failed" }
      });

      return NextResponse.json(
        { success: false, data: null, error: "Payment verification failed", error_code: "PAYMENT_VERIFICATION_FAILED" },
        { status: 400 }
      );
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).session(mongoSession);
      if (!order) throw new Error("Order not found");

      if (order.paymentStatus === "PAYMENT_VERIFIED") {
        await mongoSession.commitTransaction();
        return NextResponse.json({
          success: true,
          data: { orderId: order._id.toString(), orderNumber: order.orderNumber, status: "already_verified" },
          error: null,
        });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentStatus: "PAYMENT_VERIFIED",
          orderStatus: "CONFIRMED",
        },
        { session: mongoSession, new: true }
      );

      await CartItem.deleteMany({ userId: order.userId }).session(mongoSession);

      const [payment] = await Payment.create(
        [
          {
            orderId: order._id,
            userId: order.userId,
            amount: order.totalAmount,
            currency: "INR",
            method: "RAZORPAY",
            status: "SUCCESS",
            providerPaymentId: razorpay_payment_id,
            providerOrderId: razorpay_order_id,
          },
        ],
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();

      await paymentService.logAuditEvent(null, {
        userId: session.user.id,
        action: "PAYMENT_VERIFIED",
        entityType: "Order",
        entityId: order._id.toString(),
        metadata: {
          orderNumber: order.orderNumber,
          paymentId: razorpay_payment_id,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: updatedOrder!._id.toString(),
          orderNumber: updatedOrder!.orderNumber,
          paymentId: payment._id.toString(),
          status: "verified",
        },
        error: null,
      });
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Payment verification failed", error_code: "VERIFICATION_ERROR" },
      { status: 500 }
    );
  }
}
