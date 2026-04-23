import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";
import AuditLog from "@/models/AuditLog";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const updateCouponSchema = z.object({
  type: z.enum(["PERCENTAGE", "FLAT"]).optional(),
  value: z.number().positive().optional(),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: _req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const coupon = await Coupon.findById(id).lean();
    if (!coupon) return notFoundResponse("Coupon");

    return successResponse(coupon);
  } catch {
    return errorResponse("Failed to fetch coupon", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();

    const validated = updateCouponSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        "Invalid request data",
        "VALIDATION_ERROR",
        400
      );
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) return notFoundResponse("Coupon");

    const updateData: Record<string, unknown> = { ...validated.data };
    if (validated.data.expiresAt) {
      updateData.expiresAt = new Date(validated.data.expiresAt);
    }

    const updated = await Coupon.findByIdAndUpdate(id, updateData, { new: true }).lean();

    await AuditLog.create({
      userId: token.id,
      action: "COUPON_UPDATED",
      entityType: "Coupon",
      entityId: id,
      metadata: { code: coupon.code, changes: validated.data },
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/admin/coupons/[id]] Error:", err);
    return errorResponse("Failed to update coupon", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: _req, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) return notFoundResponse("Coupon");

    await Coupon.findByIdAndDelete(id);

    await AuditLog.create({
      userId: token.id,
      action: "COUPON_DELETED",
      entityType: "Coupon",
      entityId: id,
      metadata: { code: coupon.code },
    });

    return successResponse({ message: "Coupon deleted successfully" });
  } catch {
    return errorResponse("Failed to delete coupon", "INTERNAL_ERROR", 500);
  }
}
