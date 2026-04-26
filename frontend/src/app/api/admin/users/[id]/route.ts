import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
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
  return role === "ADMIN";
}
const updateUserSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
  name: z.string().min(2).optional(),
});

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const user = await User.findById(id).select("-passwordHash").lean();
    if (!user) return notFoundResponse("User");

    return successResponse(user);
  } catch {
    return errorResponse("Failed to fetch user", "INTERNAL_ERROR", 500);
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

    const validated = updateUserSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Invalid request data", "VALIDATION_ERROR", 400);
    }

    const user = await User.findById(id);
    if (!user) return notFoundResponse("User");

    if (user._id.toString() === token.id) {
      return errorResponse(
        "Cannot modify your own account",
        "FORBIDDEN",
        403
      );
    }



    const updateData: Record<string, unknown> = { ...validated.data };

    const updated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .select("-passwordHash")
      .lean();

    const changes: Record<string, unknown> = {};
    if (validated.data.role) changes.role = `${user.role} → ${validated.data.role}`;
    if (validated.data.status) changes.status = `${user.status} → ${validated.data.status}`;
    if (validated.data.name) changes.name = validated.data.name;

    await AuditLog.create({
      userId: token.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      metadata: changes,
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]] Error:", err);
    return errorResponse("Failed to update user", "INTERNAL_ERROR", 500);
  }
}
