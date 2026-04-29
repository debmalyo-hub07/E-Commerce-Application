import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { enqueueShippingUpdateEmail } from "@backend/jobs/email.queue";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate("userId", "name email phone")
      .populate("items.productId", "name sellingPrice images")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, data: null, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check authorization - user can only view their own orders unless admin
    const isAdmin = (session.user as any)?.role === "ADMIN";
    if (!isAdmin && order.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Calculate totals for receipt
    const itemsTotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const gstAmount = order.gstAmount || itemsTotal * 0.18;
    const finalTotal = itemsTotal - (order.discountAmount || 0) + gstAmount + (order.shippingAmount || 0);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        itemsTotal,
        gstAmount,
        finalTotal,
        receiptUrl: `/api/orders/${id}/receipt`,
      },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { orderStatus, trackingNumber, notes } = body;

    // Validate status transition
    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid order status" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    const order = await Order.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate("userId", "email name");

    if (!order) {
      return NextResponse.json(
        { success: false, data: null, error: "Order not found" },
        { status: 404 }
      );
    }

    // Queue notification email if status changed
    if (orderStatus && orderStatus !== "PENDING") {
      try {
        await enqueueShippingUpdateEmail({
          to: (order.userId as any).email,
          customerName: (order.userId as any).name,
          orderNumber: order.orderNumber,
          trackingNumber: trackingNumber || order.trackingNumber,
          estimatedDelivery: orderStatus === "SHIPPED" ? "3-5 business days" : undefined,
        });
      } catch (emailErr) {
        console.error("Failed to queue shipping update email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
