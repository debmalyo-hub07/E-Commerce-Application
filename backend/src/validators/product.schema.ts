import { z } from "zod";

const GST_SLABS = [0, 5, 12, 18, 28] as const;

export const createProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters").max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only").optional(),
  description: z.string().optional(),
  brand: z.string().max(100).optional(),
  category_id: z.string().uuid("Invalid category ID"),
  base_price: z.number().positive("Base price must be positive"),
  selling_price: z.number().positive("Selling price must be positive"),
  gst_percent: z.number().refine((v) => (GST_SLABS as readonly number[]).includes(v), {
    message: `GST must be one of: ${GST_SLABS.join(", ")}`,
  }),
  discount_percent: z.number().min(0).max(100),
  stock_quantity: z.number().int().min(0),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "popular", "rating"]).default("newest"),
  search: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
});

export const variantSchema = z.object({
  name: z.string().min(1).max(50),
  value: z.string().min(1).max(100),
  price_modifier: z.number().default(0),
  stock: z.number().int().min(0),
});

export const bulkUpdatePriceSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(50),
  discount_percent: z.number().min(0).max(100).optional(),
  selling_price: z.number().positive().optional(),
}).refine((d) => d.discount_percent !== undefined || d.selling_price !== undefined, {
  message: "Provide at least one of discount_percent or selling_price",
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type VariantInput = z.infer<typeof variantSchema>;
