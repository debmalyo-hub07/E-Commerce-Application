import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";
import AuditLog from "@/models/AuditLog";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
  buildPaginationMeta,
} from "@/lib/api-response";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const createCouponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.number().positive("Value must be positive"),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

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
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.code = { $regex: search, $options: "i" };
    }
    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    return successResponse(coupons, 200, buildPaginationMeta(page, limit, total));
  } catch {
    return errorResponse("Failed to fetch coupons", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const body = await request.json();

    const validated = createCouponSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const existingCoupon = await Coupon.findOne({ code: validated.data.code });
    if (existingCoupon) {
      return errorResponse("Coupon code already exists", "VALIDATION_ERROR", 400);
    }

    const coupon = await Coupon.create({
      ...validated.data,
      expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : undefined,
    });

    await AuditLog.create({
      userId: token.id,
      action: "COUPON_CREATED",
      entityType: "Coupon",
      entityId: coupon._id,
      metadata: { code: coupon.code, type: coupon.type, value: coupon.value },
    });

    return successResponse(coupon, 201);
  } catch (err) {
    console.error("[POST /api/admin/coupons] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Failed to create coupon",
      "INTERNAL_ERROR",
      500
    );
  }
}

