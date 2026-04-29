import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import OTP from "@/models/OTP";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";
import { rateLimiters, applyRateLimit } from "@nexmart/shared/lib/ratelimit";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
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
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid input data", "VALIDATION_ERROR", 400);
    }

    const { email, otp } = parsed.data;

    // Find the latest OTP for this email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return errorResponse("OTP not found or expired", "OTP_NOT_FOUND", 404);
    }

    if (otpRecord.otp !== otp) {
      return errorResponse("Invalid OTP", "INVALID_OTP", 400);
    }

    if (otpRecord.expiresAt < new Date()) {
      return errorResponse("OTP has expired", "OTP_EXPIRED", 400);
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { emailVerified: true },
      { new: true }
    );

    if (!user) {
      return errorResponse("User not found", "USER_NOT_FOUND", 404);
    }

    // Delete used OTP
    await OTP.deleteMany({ email });

    return successResponse(
      {
        message: "Email verified successfully",
        email: user.email
      },
      200
    );
  } catch (error) {
    console.error("[Verify OTP API Error]:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
