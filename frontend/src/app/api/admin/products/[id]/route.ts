import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import AuditLog from "@/models/AuditLog";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { z } from "zod";
import { slugify } from "@shared/utils";
import { rateLimiters } from "@backend/lib/ratelimit";
import { applyRateLimit } from "@backend/middleware/ratelimit.middleware";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string(),
  basePrice: z.number().positive("Base price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  gstPercent: z.number().min(0).max(100).default(18),
  discountPercent: z.number().min(0).max(100).default(0),
  stockQuantity: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export async function GET(request: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.adminEndpoint,
    token.id as string
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const { id } = await ctx.params;

    const product = await Product.findById(id)
      .populate("categoryId", "name slug")
      .populate("createdBy", "name email")
      .lean();

    if (!product) return notFoundResponse("Product");

    return successResponse(product);
  } catch (err) {
    console.error("[GET /api/admin/products/[id]] Error:", err);
    return errorResponse("Failed to fetch product", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.adminEndpoint,
    token.id as string
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();

    const validatedData = createProductSchema.partial().parse(body);

    if (validatedData.categoryId) {
      const category = await Category.findById(validatedData.categoryId);
      if (!category) {
        return errorResponse("Category not found", "NOT_FOUND", 404);
      }
    }

    let slug = validatedData.slug;
    if (!slug && validatedData.name) {
      slug = slugify(validatedData.name);
    }

    const updateData: Record<string, unknown> = { ...validatedData };
    if (slug) updateData.slug = slug;

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true })
      .populate("categoryId", "name slug")
      .lean();

    if (!updated) return notFoundResponse("Product");

    await AuditLog.create({
      userId: token.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: id,
      metadata: { name: updated.name },
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/admin/products/[id]] Error:", err);
    if (err instanceof z.ZodError) {
      return errorResponse(
        err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }
    return errorResponse(
      err instanceof Error ? err.message : "Failed to update product",
      "INTERNAL_ERROR",
      500
    );
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();
  if (!isAdmin(token.role as string)) return forbiddenResponse();

  const rateLimitResponse = await applyRateLimit(
    request,
    rateLimiters.adminEndpoint,
    token.id as string
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();
    const { id } = await ctx.params;

    const product = await Product.findById(id);
    if (!product) return notFoundResponse("Product");

    await Product.findByIdAndDelete(id);

    await AuditLog.create({
      userId: token.id,
      action: "PRODUCT_DELETED",
      entityType: "Product",
      entityId: id,
      metadata: { name: product.name },
    });

    return successResponse({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/admin/products/[id]] Error:", err);
    return errorResponse("Failed to delete product", "INTERNAL_ERROR", 500);
  }
}
