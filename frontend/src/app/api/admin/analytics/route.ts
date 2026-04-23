import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const range = searchParams.get("range") || "30"; // 7, 30, 90 days
    const days = parseInt(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      lowStockProducts,
      recentOrders,
      topProducts,
      ordersByStatus,
      ordersByPaymentStatus,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: { $in: ["PAYMENT_VERIFIED", "REFUNDED"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      Order.countDocuments({
        createdAt: { $gte: startDate },
      }),

      User.countDocuments({
        createdAt: { $gte: startDate },
        role: "CUSTOMER",
      }),

      Product.find({
        stockQuantity: { $lte: 5 },
        isActive: true,
      })
        .select("name stockQuantity sellingPrice")
        .sort({ stockQuantity: 1 })
        .limit(10)
        .lean(),

      Order.find({
        createdAt: { $gte: startDate },
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: "PAYMENT_VERIFIED",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.totalPrice" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return successResponse({
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        totalCustomers,
      },
      lowStockProducts,
      recentOrders,
      topProducts,
      ordersByStatus,
      ordersByPaymentStatus,
    });
  } catch (err) {
    console.error("[GET /api/admin/analytics] Error:", err);
    return errorResponse("Failed to fetch analytics", "INTERNAL_ERROR", 500);
  }
}
