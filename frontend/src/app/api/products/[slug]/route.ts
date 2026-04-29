import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Review from "@/models/Review";
import { redis } from "@/lib/redis";
import {
  successResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-response";
import { computeFinalPrice } from "@/lib/utils";
import { CACHE_TTL } from "@nexmart/shared/constants";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    const { slug } = await context.params;
    const cacheKey = `product:${slug}`;

    const cached = await redis.get(cacheKey);
    if (cached) return successResponse(cached);

    const product = await Product.findOne({ slug, isActive: true })
      .populate("categoryId", "name slug")
      .populate("createdBy", "name")
      .lean();

    if (!product) {
      return notFoundResponse("Product");
    }

    const reviews = await Review.find({ productId: product._id, isApproved: true })
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const ratings = reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    const enriched = {
      ...product,
      reviews,
      category: product.categoryId,
      final_price: computeFinalPrice(product.sellingPrice, product.gstPercent, product.discountPercent),
      average_rating: Number(avgRating.toFixed(1)),
      reviews_count: ratings.length,
    };

    await redis.setex(cacheKey, CACHE_TTL.PRODUCT_DETAIL, JSON.stringify(enriched));

    return successResponse(enriched);
  } catch (err) {
    console.error("[GET /api/products/[slug]] Error:", err);
    return errorResponse("Failed to fetch product", "INTERNAL_ERROR", 500);
  }
}
