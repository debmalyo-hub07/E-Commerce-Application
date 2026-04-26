import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  buildPaginationMeta,
} from "@/lib/api-response";

function isAdmin(role: string) {
  return role === "ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = { paymentStatus: "REFUND_INITIATED" };
    if (status && status !== "REFUND_INITIATED") {
      filter.paymentStatus = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [refunds, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return successResponse(refunds, 200, buildPaginationMeta(page, limit, total));
  } catch {
    return errorResponse("Failed to fetch refund requests", "INTERNAL_ERROR", 500);
  }
}

