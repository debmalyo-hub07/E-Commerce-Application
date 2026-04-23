import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";
import { rateLimiters } from "@backend/lib/ratelimit";
import { applyRateLimit } from "@backend/middleware/ratelimit.middleware";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  const rateLimitResponse = await applyRateLimit(request, rateLimiters.authEndpoint, ip);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid input data", "VALIDATION_ERROR", 400);
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse("User with this email already exists", "EMAIL_ALREADY_EXISTS", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
    });

    return successResponse(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      201
    );
  } catch (error) {
    console.error("[Register API Error]:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
