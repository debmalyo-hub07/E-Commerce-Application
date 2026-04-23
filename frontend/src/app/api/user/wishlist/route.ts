import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const wishlistItems = await Wishlist.find({ userId: token.id })
      .populate({
        path: "productId",
        populate: { path: "categoryId", select: "name slug" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(wishlistItems);
  } catch {
    return errorResponse("Failed to fetch wishlist", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const { productId } = await request.json();
    if (!productId) return errorResponse("Product ID is required", "VALIDATION_ERROR", 400);

    const existing = await Wishlist.findOne({ userId: token.id, productId });
    if (existing) {
      return successResponse(existing, 200);
    }

    const item = await Wishlist.create({ userId: token.id, productId });
    return successResponse(item, 201);
  } catch {
    return errorResponse("Failed to add to wishlist", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) return errorResponse("Product ID is required", "VALIDATION_ERROR", 400);

    await Wishlist.deleteMany({ userId: token.id, productId });
    return successResponse({ removed: true });
  } catch {
    return errorResponse("Failed to remove from wishlist", "INTERNAL_ERROR", 500);
  }
}
