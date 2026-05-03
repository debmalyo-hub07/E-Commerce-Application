import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";
import { rateLimiters, applyRateLimit } from "@nexmart/shared/lib/ratelimit";

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
    const passwordHash = await bcrypt.hash(password, 12);

    let user;

    if (existingUser) {
      if (!existingUser.passwordHash) {
        // User created via Google login; allow them to set a password
        existingUser.passwordHash = passwordHash;
        await existingUser.save();
        user = existingUser;
      } else {
        return errorResponse("User with this email already exists", "EMAIL_ALREADY_EXISTS", 409);
      }
    } else {
      user = await User.create({
        name,
        email,
        passwordHash,
        role: "CUSTOMER",
        emailVerified: false,
      });
    }

    // If the user's email is already verified (e.g., via Google OAuth), skip OTP
    if (existingUser?.emailVerified) {
      return successResponse(
        {
          requiresOtp: false,
          email: user.email,
          message: "Password set successfully. You can now sign in.",
        },
        201
      );
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    const OTP = (await import("@/models/OTP")).default;
    await OTP.deleteMany({ email }); // Clear existing OTPs for this email
    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
    });

    // Send OTP via email
    const { sendOTP } = await import("@/lib/mailer");
    const emailSent = await sendOTP(email, otp);

    if (!emailSent) {
      return errorResponse("Failed to send OTP email", "EMAIL_SEND_FAILED", 500);
    }

    return successResponse(
      {
        requiresOtp: true,
        email: user.email,
        message: "OTP sent to your email",
      },
      201
    );
  } catch (error) {
    console.error("[Register API Error]:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
