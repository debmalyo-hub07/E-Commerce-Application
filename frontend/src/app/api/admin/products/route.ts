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
  buildPaginationMeta,
} from "@/lib/api-response";
import { z } from "zod";
import { slugify } from "@stylemart/shared/utils";
import { rateLimiters, applyRateLimit } from "@stylemart/shared/lib/ratelimit";

function isAdmin(role: string) {
  return role === "ADMIN";
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

export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return successResponse(products, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    console.error("[GET /api/admin/products] Error:", err);
    return errorResponse("Failed to fetch products", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const validatedData = createProductSchema.parse(body);

    const category = await Category.findById(validatedData.categoryId);
    if (!category) {
      return errorResponse("Category not found", "NOT_FOUND", 404);
    }

    let slug = validatedData.slug || slugify(validatedData.name);

    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return errorResponse("Product with this slug already exists", "VALIDATION_ERROR", 400);
    }

    const product = await Product.create({
      ...validatedData,
      slug,
      createdBy: token.id,
    });

    await AuditLog.create({
      userId: token.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product._id,
      metadata: { name: product.name },
    });

    const populated = await Product.findById(product._id)
      .populate("categoryId", "name slug")
      .lean();

    return successResponse(populated, 201);
  } catch (err) {
    console.error("[POST /api/admin/products] Error:", err);
    if (err instanceof z.ZodError) {
      return errorResponse(
        err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }
    return errorResponse(
      err instanceof Error ? err.message : "Failed to create product",
      "INTERNAL_ERROR",
      500
    );
  }
}

