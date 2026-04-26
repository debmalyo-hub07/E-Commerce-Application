import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import Category from "@/models/Category";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).toLowerCase(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const isActive = searchParams.get("isActive") !== "false";

    const query: any = {};
    if (isActive) query.isActive = true;
    if (parentId) query.parentId = parentId;

    const categories = await Category.find(query)
      .populate("parentId", "name slug")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
      error: null,
    });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role)) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validated = categorySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Validation failed",
          fields: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await Category.findOne({ slug: validated.data.slug });
    if (existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Slug already exists" },
        { status: 400 }
      );
    }

    const category = await Category.create({
      ...validated.data,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
