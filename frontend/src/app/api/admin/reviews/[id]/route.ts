import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Review from "@/models/Review";
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

const approvalSchema = z.object({
  isApproved: z.boolean(),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const review = await Review.findById(id)
      .populate("userId", "name email")
      .populate("productId", "name slug")
      .lean();

    if (!review) return notFoundResponse("Review");

    return successResponse(review);
  } catch {
    return errorResponse("Failed to fetch review", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();

    const validated = approvalSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Invalid request data", "VALIDATION_ERROR", 400);
    }

    const review = await Review.findById(id);
    if (!review) return notFoundResponse("Review");

    const updated = await Review.findByIdAndUpdate(
      id,
      { isApproved: validated.data.isApproved },
      { new: true }
    )
      .populate("userId", "name email")
      .populate("productId", "name slug")
      .lean();

    await AuditLog.create({
      userId: token.id,
      action: "REVIEW_MODERATED",
      entityType: "Review",
      entityId: id,
      metadata: {
        isApproved: validated.data.isApproved,
        note: validated.data.note || null,
        approvedBy: token.email,
      },
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Failed to update review", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const review = await Review.findById(id);
    if (!review) return notFoundResponse("Review");

    await Review.findByIdAndDelete(id);

    await AuditLog.create({
      userId: token.id,
      action: "REVIEW_DELETED",
      entityType: "Review",
      entityId: id,
    });

    return successResponse({ message: "Review deleted successfully" });
  } catch {
    return errorResponse("Failed to delete review", "INTERNAL_ERROR", 500);
  }
}
