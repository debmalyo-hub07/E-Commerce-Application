import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("No file provided", "BAD_REQUEST", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "NexMart/avatars", transformation: [{ width: 500, height: 500, crop: "fill" }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    await connectDB();
    const user = await User.findByIdAndUpdate(
      token.id,
      { avatarUrl: uploadResult.secure_url, avatarPublicId: uploadResult.public_id },
      { new: true }
    ).select("-passwordHash").lean();

    if (!user) return errorResponse("User not found", "NOT_FOUND", 404);

    return successResponse({ avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return errorResponse("Failed to upload avatar", "INTERNAL_ERROR", 500);
  }
}
