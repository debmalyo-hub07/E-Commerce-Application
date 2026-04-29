import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import Payment from "@/models/Payment";
import Order from "@/models/Order";
import User from "@/models/User";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  buildPaginationMeta,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return unauthorizedResponse();
    }

    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
    const search = searchParams.get("search") || "";

    // Build filter based on search
    const filter: any = {};
    if (search) {
      const orderIds = await Order.find({ orderNumber: { $regex: search, $options: "i" } }).select('_id').lean();
      const orderIdsArray = orderIds.map(o => o._id);

      const userIds = await User.find({ email: { $regex: search, $options: "i" } }).select('_id').lean();
      const userIdsArray = userIds.map(u => u._id);

      if (orderIdsArray.length > 0 || userIdsArray.length > 0) {
        filter.$or = [];
        if (orderIdsArray.length > 0) filter.$or.push({ orderId: { $in: orderIdsArray } });
        if (userIdsArray.length > 0) filter.$or.push({ userId: { $in: userIdsArray } });
      } else {
        // if no matches, return empty result
        return successResponse([], 200, buildPaginationMeta(page, limit, 0));
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({ path: "orderId", select: "orderNumber orderStatus" })
        .populate({ path: "userId", select: "name email" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return successResponse(payments, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    console.error("[GET /api/admin/transactions] Error:", err);
    return errorResponse("Failed to fetch transactions", "INTERNAL_ERROR", 500);
  }
}
