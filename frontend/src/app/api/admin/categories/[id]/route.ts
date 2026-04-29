import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { auth } from "@/lib/auth/config";
import Category from "@/models/Category";
import { z } from "zod";
import mongoose from "mongoose";

const categoryUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).toLowerCase().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const category = await Category.findById(id)
      .populate("parentId", "name slug")
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, data: null, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
      error: null,
    });
  } catch (error) {
    console.error("GET /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = categoryUpdateSchema.safeParse(body);

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

    // Check if new slug conflicts with other categories
    if (validated.data.slug) {
      const existing = await Category.findOne({
        slug: validated.data.slug,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, data: null, error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { ...validated.data, updatedAt: new Date() },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        { success: false, data: null, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    console.error("PUT /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category has subcategories or products
    const hasChildren = await Category.findOne({ parentId: id });
    if (hasChildren) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Cannot delete category with subcategories",
        },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, data: null, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
