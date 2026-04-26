import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
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
import { slugify } from "@stylemart/shared/utils";
import { rateLimiters, applyRateLimit } from "@stylemart/shared/lib/ratelimit";

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
  basePrice: z.number().min(0, "Base price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  gstPercent: z.number().min(0).max(100).default(18),
  discountPercent: z.number().min(0).max(100).default(0),
  stockQuantity: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string(),
      isPrimary: z.boolean().default(false),
      displayOrder: z.number().default(0),
    })
  ).optional().default([]),
});

export async function GET(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
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
  const session = await auth();
  const token = session?.user;
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
  const session = await auth();
  const token = session?.user;
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
