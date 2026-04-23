import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .select("_id name slug")
      .sort({ name: 1 })
      .lean();

    return successResponse(categories);
  } catch {
    return errorResponse("Failed to fetch categories", "INTERNAL_ERROR", 500);
  }
}
