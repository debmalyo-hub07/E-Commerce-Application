import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Review from "@/models/Review";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
  buildPaginationMeta,
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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const isApproved = searchParams.get("isApproved");

    const filter: Record<string, unknown> = {};
    if (isApproved !== null) {
      filter.isApproved = isApproved === "true";
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("userId", "name email")
        .populate("productId", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return successResponse(reviews, 200, buildPaginationMeta(page, limit, total));
  } catch {
    return errorResponse("Failed to fetch reviews", "INTERNAL_ERROR", 500);
  }
}
