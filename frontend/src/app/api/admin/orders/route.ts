import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
  buildPaginationMeta,
} from "@/lib/api-response";
import { rateLimiters, applyRateLimit } from "@nexmart/shared/lib/ratelimit";

function isAdmin(role: string) {
  return role === "ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.adminEndpoint,
    token.id as string
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email")
        .populate("addressId", "city state")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return successResponse(orders, 200, buildPaginationMeta(page, limit, total));
  } catch {
    return errorResponse("Failed to fetch orders", "INTERNAL_ERROR", 500);
  }
}

