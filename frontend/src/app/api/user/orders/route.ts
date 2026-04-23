import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  buildPaginationMeta,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = { userId: token.id };
    if (status) filter.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("addressId", "city state pincode")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return successResponse(orders, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    console.error("[GET /api/user/orders] Error:", err);
    return errorResponse("Failed to fetch orders", "INTERNAL_ERROR", 500);
  }
}
