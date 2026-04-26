import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate("userId", "name email phone avatarUrl")
      .populate("items.productId", "name slug sellingPrice images");

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const isAdmin = (session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "SUPER_ADMIN";
    if (!isAdmin && order.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Generate HTML receipt content
    const user = order.userId as any;
    const address = order.addressSnapshot as any;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Receipt - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
          .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-section { }
          .info-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
          .info-value { font-size: 16px; font-weight: bold; color: #333; }
          .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .table th { background: #f0f9ff; padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #e5e7eb; }
          .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .table-right { text-align: right; }
          .summary { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
          .summary-row { display: grid; grid-template-columns: 1fr auto; gap: 20px; padding: 10px 0; }
          .summary-label { font-weight: 500; }
          .summary-value { text-align: right; font-weight: bold; }
          .total-row { background: #f0f9ff; padding: 15px; border-radius: 4px; font-size: 18px; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
          @media print { body { background: none; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">StyleMart</div>
            <p style="margin: 0; color: #666;">Order Receipt</p>
          </div>

          <div class="order-info">
            <div class="info-section">
              <div class="info-label">Order Number</div>
              <div class="info-value">${order.orderNumber}</div>
              <div class="info-label" style="margin-top: 15px;">Order Date</div>
              <div class="info-value">${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="info-section">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span class="badge">${order.orderStatus}</span>
              </div>
              <div class="info-label" style="margin-top: 15px;">Payment Method</div>
              <div class="info-value">${order.paymentMethod === "RAZORPAY" ? "Online Payment" : "Cash on Delivery"}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <div class="info-label">Bill To</div>
              <div style="margin-top: 10px; line-height: 1.8;">
                <div style="font-weight: bold; font-size: 16px;">${user?.name}</div>
                <div>${address?.addressLine1}</div>
                <div>${address?.city}, ${address?.state} ${address?.pincode}</div>
                <div style="margin-top: 10px;">
                  <div><strong>Email:</strong> ${user?.email}</div>
                  <div><strong>Phone:</strong> ${address?.phone}</div>
                </div>
              </div>
            </div>
            <div>
              <div class="info-label">Ship To</div>
              <div style="margin-top: 10px; line-height: 1.8;">
                <div style="font-weight: bold; font-size: 16px;">${address?.fullName}</div>
                <div>${address?.addressLine1}</div>
                <div>${address?.city}, ${address?.state} ${address?.pincode}</div>
              </div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th class="table-right">Qty</th>
                <th class="table-right">Price</th>
                <th class="table-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td>${(item.productSnapshot as any)?.name || "Product"}</td>
                  <td class="table-right">${item.quantity}</td>
                  <td class="table-right">₹${(item.unitPrice).toFixed(2)}</td>
                  <td class="table-right">₹${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <div class="summary-label">Subtotal</div>
              <div class="summary-value">₹${order.subtotal.toFixed(2)}</div>
            </div>
            ${order.discountAmount ? `
              <div class="summary-row" style="color: #16a34a;">
                <div class="summary-label">Discount</div>
                <div class="summary-value">-₹${order.discountAmount.toFixed(2)}</div>
              </div>
            ` : ""}
            <div class="summary-row">
              <div class="summary-label">GST (18%)</div>
              <div class="summary-value">₹${order.gstAmount.toFixed(2)}</div>
            </div>
            ${order.shippingAmount ? `
              <div class="summary-row">
                <div class="summary-label">Shipping</div>
                <div class="summary-value">₹${order.shippingAmount.toFixed(2)}</div>
              </div>
            ` : ""}
            <div class="summary-row total-row">
              <div>Total Amount</div>
              <div>₹${order.totalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your order! For support, email us at support@stylemart.in</p>
            <p style="margin-top: 10px; font-size: 11px;">© 2026 StyleMart. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(receiptHTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="receipt-${order.orderNumber}.html"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate receipt";
    console.error("GET /api/orders/[id]/receipt error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
