import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import CartItem from "@/models/CartItem";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import Address from "@/models/Address";
import User from "@/models/User";
import Razorpay from "razorpay";
import { z } from "zod";
import { rateLimiters, applyRateLimit } from "@stylemart/shared/lib/ratelimit";

const createOrderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().optional(),
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", data: null },
      { status: 401 }
    );
  }

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.paymentEndpoint,
    session.user.id
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();
    const validated = createOrderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", data: null },
        { status: 400 }
      );
    }

    const { addressId, paymentMethod, couponCode } = validated.data;
    const userId = session.user.id;

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const cartItems = await CartItem.find({ userId })
        .populate("productId")
        .session(mongoSession)
        .lean();

      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      for (const item of cartItems) {
        const product = item.productId as unknown as { stockQuantity: number; name: string; isActive: boolean };
        if (!product || !product.isActive) throw new Error("Product not found or inactive");
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      let subtotal = 0;
      const orderItems = [];

      for (const item of cartItems) {
        const product = item.productId as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          sellingPrice: number;
          gstPercent: number;
          discountPercent: number;
          images: Array<{ url: string; isPrimary: boolean }>;
          stockQuantity: number;
        };

        const unitPrice = product.sellingPrice;
        const gstPercent = product.gstPercent;
        const discountPercent = product.discountPercent;
        const priceAfterDiscount = unitPrice * (1 - discountPercent / 100);
        const gstAmount = priceAfterDiscount * (gstPercent / 100);
        const finalPrice = priceAfterDiscount + gstAmount;
        const itemTotal = finalPrice * item.quantity;

        subtotal += itemTotal;

        orderItems.push({
          productId: product._id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice,
          gstPercent,
          totalPrice: itemTotal,
          productSnapshot: {
            name: product.name,
            sellingPrice: unitPrice,
            gstPercent,
            discountPercent,
            imageUrl: product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || "",
          },
        });

        await Product.findByIdAndUpdate(
          product._id,
          { $inc: { stockQuantity: -item.quantity } },
          { session: mongoSession }
        );
      }

      let discountAmount = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { $gt: new Date() },
        }).session(mongoSession);

        if (coupon) {
          if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
            throw new Error(`Coupon requires minimum order of ${coupon.minOrderValue}`);
          }
          if (coupon.type === "PERCENTAGE") {
            discountAmount = subtotal * (coupon.value / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.value;
          }
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }, { session: mongoSession });
        }
      }

      const gstAmount = subtotal * 0.18;
      const shippingAmount = subtotal > 1000 ? 0 : 50;
      const totalAmount = subtotal - discountAmount + shippingAmount;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      let razorpayOrderId = null;
      if (paymentMethod === "RAZORPAY") {
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: orderNumber,
          notes: { userId, orderNumber },
        });
        razorpayOrderId = razorpayOrder.id;
      }

      const address = await Address.findById(addressId).session(mongoSession).lean();
      const addressSnapshot = address || {};

      const [order] = await Order.create(
        [
          {
            orderNumber,
            userId,
            addressId,
            addressSnapshot,
            items: orderItems,
            subtotal,
            discountAmount,
            gstAmount,
            shippingAmount,
            totalAmount,
            couponCode: couponCode?.toUpperCase(),
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "PENDING_COD" : "PENDING",
            orderStatus: "PENDING",
            razorpayOrderId,
          },
        ],
        { session: mongoSession }
      );

      await CartItem.deleteMany({ userId }).session(mongoSession);

      await mongoSession.commitTransaction();

      const user = await User.findById(userId);
      if (user) {
        const items = order.items.map((item) => ({
          name: (item.productSnapshot as any)?.name || "Product",
          quantity: item.quantity,
          price: item.totalPrice,
          imageUrl: (item.productSnapshot as any)?.imageUrl,
        }));

        const shippingAddress =
          typeof addressSnapshot === "object" && addressSnapshot !== null
            ? `${(addressSnapshot as any).fullName}, ${(addressSnapshot as any).addressLine1}, ${(addressSnapshot as any).city} ${(addressSnapshot as any).pincode}`
            : "Delivery Address";

        try {
          // Dynamically import backend email queue at runtime - won't be bundled with frontend
          const { enqueueOrderConfirmEmail } = await import("@stylemart/shared/lib/email-queue").then(m => m.getEmailQueueFunctions());
          await enqueueOrderConfirmEmail({
            to: user.email,
            customerName: user.name,
            orderNumber: order.orderNumber,
            items,
            total: order.totalAmount,
            shippingAddress,
          });
        } catch (emailErr) {
          console.error("Failed to queue confirmation email:", emailErr);
          // Don't fail the order if email fails to queue
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          razorpayOrderId,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: order.totalAmount,
          currency: "INR",
        },
        error: null,
      });
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    console.error("Payment create-order error:", error);
    return NextResponse.json(
      { success: false, data: null, error: message, error_code: "ORDER_CREATION_FAILED" },
      { status: 400 }
    );
  }
}
