import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Review from "@/models/Review";
import { redis } from "@/lib/redis";
import {
  successResponse,
  errorResponse,
  buildPaginationMeta,
} from "@/lib/api-response";
import { computeFinalPrice } from "@/lib/utils";
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from "@stylemart/shared/constants";
import { rateLimiters } from "@backend/lib/ratelimit";
import { applyRateLimit } from "@backend/middleware/ratelimit.middleware";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.publicProducts,
    ip
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? `${DEFAULT_PAGE_SIZE}`), 100);
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sortBy = searchParams.get("sortBy") ?? "newest";
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const inStock = searchParams.get("inStock") === "true" ? true : undefined;

    const cacheKey = `products:list:${JSON.stringify({
      page, limit, category, brand, search, minPrice, maxPrice, sortBy, featured, inStock,
    })}`;

    if (!search && page === 1) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = cached as { data: unknown; meta: NonNullable<Parameters<typeof successResponse>[2]> };
        return successResponse(parsed.data, 200, parsed.meta);
      }
    }

    const filter: Record<string, unknown> = { isActive: true };
    if (featured !== undefined) filter.isFeatured = featured;
    if (inStock) filter.stockQuantity = { $gt: 0 };
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      const cat = await Category.findOne({ slug: category }).select("_id").lean();
      if (cat) filter.categoryId = cat._id;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (minPrice !== undefined) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
      filter.sellingPrice = priceFilter;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { sellingPrice: 1 },
      price_desc: { sellingPrice: -1 },
      popular: { stockQuantity: -1 },
      newest: { createdAt: -1 },
    };
    const sort = sortMap[sortBy] ?? sortMap.newest;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const productIds = products.map((p) => p._id);
    const reviews = await Review.aggregate([
      { $match: { productId: { $in: productIds }, isApproved: true } },
      { $group: { _id: "$productId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const reviewMap = new Map(reviews.map((r) => [r._id.toString(), r]));

    const enrichedProducts = products.map((p) => {
      const reviewData = reviewMap.get(p._id.toString());
      const primaryImage = p.images?.find((img) => img.isPrimary) ?? p.images?.[0];
      return {
        ...p,
        final_price: computeFinalPrice(p.sellingPrice, p.gstPercent, p.discountPercent),
        average_rating: reviewData ? Number(reviewData.avgRating.toFixed(1)) : 0,
        reviews_count: reviewData?.count ?? 0,
        image_url: primaryImage?.url ?? null,
        category: p.categoryId,
      };
    });

    const meta = buildPaginationMeta(page, limit, total);

    if (!search && page === 1) {
      await redis.setex(
        cacheKey,
        CACHE_TTL.PRODUCT_LISTING,
        JSON.stringify({ data: enrichedProducts, meta })
      );
    }

    return successResponse(enrichedProducts, 200, meta);
  } catch (err) {
    console.error("[GET /api/products] Error:", err);
    return errorResponse("Failed to fetch products", "INTERNAL_ERROR", 500);
  }
}
