import { connectDB } from "../lib/mongoose";
import Product from "../../frontend/src/models/Product";
import AuditLog from "../../frontend/src/models/AuditLog";
import { upstashRedis } from "../lib/redis";
import { computeFinalPrice, productCacheKey, slugify } from "../../shared/utils";
import { CACHE_TTL } from "../../shared/constants";

export const productService = {
  computeFinalPrice(
    sellingPrice: number,
    gstPercent: number,
    discountPercent: number
  ): number {
    return computeFinalPrice(sellingPrice, gstPercent, discountPercent);
  },

  enrichWithFinalPrice<T extends {
    sellingPrice: number;
    gstPercent: number;
    discountPercent: number;
  }>(product: T): T & { finalPrice: number } {
    return {
      ...product,
      finalPrice: computeFinalPrice(
        product.sellingPrice,
        product.gstPercent,
        product.discountPercent
      ),
    };
  },

  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    await connectDB();
    const base = slugify(name);
    let slug = base;
    let suffix = 1;

    while (true) {
      const existing = await Product.findOne({ slug }).select("_id").lean();

      if (!existing || existing._id.toString() === excludeId) break;

      slug = `${base}-${suffix}`;
      suffix++;
    }

    return slug;
  },

  async invalidateProductCache(productId: string, slug: string): Promise<void> {
    try {
      const keys = [
        productCacheKey(slug),
        `product:id:${productId}`,
      ];
      for (const key of keys) {
        await upstashRedis.del(key);
      }
      await productService.invalidateListingCaches();
    } catch (err) {
      console.error("[ProductService] Cache invalidation failed:", err);
    }
  },

  async invalidateListingCaches(): Promise<void> {
    try {
      const keys = ["products:featured", "products:homepage"];
      for (const key of keys) {
        await upstashRedis.del(key);
      }
    } catch (err) {
      console.error("[ProductService] Listing cache invalidation failed:", err);
    }
  },

  async invalidateCategoryCache(): Promise<void> {
    try {
      await upstashRedis.del("categories:tree");
    } catch (err) {
      console.error("[ProductService] Category cache invalidation failed:", err);
    }
  },

  async getCachedOrFetch<T>(
    cacheKey: string,
    ttl: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await upstashRedis.get<T>(cacheKey);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await upstashRedis.setex(cacheKey, ttl, JSON.stringify(fresh));
    return fresh;
  },

  async getFeaturedProducts(limit = 8) {
    await connectDB();
    return productService.getCachedOrFetch(
      "products:homepage",
      CACHE_TTL.HOMEPAGE_FEATURED,
      () =>
        Product.find({ isActive: true, isFeatured: true })
          .populate("categoryId", "name slug")
          .sort({ updatedAt: -1 })
          .limit(limit)
          .lean()
    );
  },

  async logPriceChange(
    productId: string,
    changedBy: string,
    oldPrice: number,
    newPrice: number
  ): Promise<void> {
    await connectDB();
    await AuditLog.create({
      userId: changedBy,
      action: "PRODUCT_PRICE_CHANGE",
      entityType: "Product",
      entityId: productId,
      metadata: { oldPrice, newPrice },
    });
  },
};
