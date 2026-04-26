import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be a 10-digit number").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")), // ISO date string or empty
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const user = await User.findById(token.id).select("-passwordHash").lean();
    if (!user) return errorResponse("User not found", "NOT_FOUND", 404);
    
    return successResponse(user);
  } catch {
    return errorResponse("Failed to fetch profile", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);
    
    if (!validated.success) {
      return errorResponse(
        validated.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    await connectDB();
    const updateData: any = {};
    if (validated.data.name !== undefined) updateData.name = validated.data.name;
    if (validated.data.phone !== undefined) updateData.phone = validated.data.phone === "" ? null : validated.data.phone;
    if (validated.data.gender !== undefined) updateData.gender = validated.data.gender === "" ? null : validated.data.gender;
    if (validated.data.dob !== undefined) updateData.dob = validated.data.dob ? new Date(validated.data.dob) : null;
    if (validated.data.avatarUrl !== undefined) updateData.avatarUrl = validated.data.avatarUrl === "" ? null : validated.data.avatarUrl;

    const user = await User.findByIdAndUpdate(token.id, updateData, { new: true }).select("-passwordHash").lean();
    if (!user) return errorResponse("User not found", "NOT_FOUND", 404);

    return successResponse(user);
  } catch (err) {
    return errorResponse("Failed to update profile", "INTERNAL_ERROR", 500);
  }
}
