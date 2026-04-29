import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import CartItem from "@/models/CartItem";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import Address from "@/models/Address";
import { z } from "zod";
import { rateLimiters, applyRateLimit } from "@nexmart/shared/lib/ratelimit";
import { orderService } from "@backend/services/order.service";
import { paymentService } from "@backend/services/payment.service";

const createOrderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
  })).optional(),
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

    const { addressId, paymentMethod, couponCode, items: bodyItems } = validated.data;
    const userId = session.user.id;

    let itemsToProcess = [];

    if (bodyItems && bodyItems.length > 0) {
      itemsToProcess = bodyItems;
    } else {
      const cartItems = await CartItem.find({ userId }).lean();
      itemsToProcess = cartItems;
    }

    if (itemsToProcess.length === 0) {
      throw new Error("Cart is empty");
    }

    let subtotal = 0;
    let gstAmountTotal = 0;
    const orderItems = [];

    for (const item of itemsToProcess) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) throw new Error("Product not found or inactive");

      // Pre-validate stock before proceeding
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
      }

      const unitPrice = product.sellingPrice;
      const gstPercent = product.gstPercent;
      const discountPercent = product.discountPercent;
      const priceAfterDiscount = unitPrice * (1 - discountPercent / 100);
      const gstAmount = priceAfterDiscount * (gstPercent / 100);
      const finalPrice = priceAfterDiscount + gstAmount;
      const itemTotal = finalPrice * item.quantity;

      subtotal += itemTotal;
      gstAmountTotal += gstAmount * item.quantity;

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
          imageUrl: product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || "",
        },
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (coupon) {
        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
          throw new Error(`Coupon requires minimum order of ₹${coupon.minOrderValue}`);
        }
        if (coupon.type === "PERCENTAGE") {
          discountAmount = subtotal * (coupon.value / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.value;
        }
      }
    }

    const shippingAmount = subtotal > 1000 ? 0 : 50;
    const totalAmount = subtotal - discountAmount + shippingAmount;

    const address = await Address.findById(addressId).lean();
    if (!address) throw new Error("Address not found");

    let razorpayOrderId = undefined;
    if (paymentMethod === "RAZORPAY") {
      const rzpOrder = await paymentService.createRazorpayOrder({
        amount: totalAmount,
        receipt: `receipt_${Date.now()}`,
        notes: { userId, env: process.env.NODE_ENV || "development" }
      });
      razorpayOrderId = rzpOrder.id;
    }

    const order = await orderService.createOrder({
      userId,
      addressId,
      addressSnapshot: address,
      items: orderItems,
      subtotal,
      discountAmount,
      gstAmount: gstAmountTotal,
      shippingAmount,
      totalAmount,
      couponCode: couponCode?.toUpperCase(),
      paymentMethod,
      razorpayOrderId,
    });

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
  } catch (error: any) {
    console.error("Payment create-order error:", error);
    return NextResponse.json(
      { success: false, data: null, error: error.message || "Failed to create order", error_code: "ORDER_CREATION_FAILED" },
      { status: 400 }
    );
  }
}
