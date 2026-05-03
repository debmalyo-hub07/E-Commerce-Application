import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isAdmin(role: string) {
  return role === "ADMIN";
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const user = await User.findById(id).select("_id").lean();
    if (!user) return notFoundResponse("User");

    const history = await AuditLog.find({
      entityType: "User",
      entityId: id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedHistory = history.map((entry) => ({
      _id: entry._id.toString(),
      action: entry.action,
      metadata: entry.metadata,
      userId: entry.userId?.toString(),
      createdAt: entry.createdAt,
    }));

    return successResponse(formattedHistory);
  } catch {
    return errorResponse("Failed to fetch user history", "INTERNAL_ERROR", 500);
  }
}