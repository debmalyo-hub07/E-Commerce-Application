import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { z } from "zod";
import { compare, hash } from "bcryptjs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validated = changePasswordSchema.safeParse(body);
    
    if (!validated.success) {
      return errorResponse(
        validated.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    await connectDB();
    const user = await User.findById(token.id);
    if (!user) return errorResponse("User not found", "NOT_FOUND", 404);

    if (!user.passwordHash) {
      return errorResponse("Social login accounts cannot change password", "BAD_REQUEST", 400);
    }

    const isValid = await compare(validated.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse("Incorrect current password", "BAD_REQUEST", 400);
    }

    const newHash = await hash(validated.data.newPassword, 12);
    user.passwordHash = newHash;
    await user.save();

    return successResponse({ message: "Password updated successfully" });
  } catch (err) {
    return errorResponse("Failed to change password", "INTERNAL_ERROR", 500);
  }
}
