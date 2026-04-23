import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") || "";

    if (!q || q.length < 2) {
      return successResponse([]);
    }

    const results = await Product.find(
      {
        isActive: true,
        $or: [
          { name: { $regex: q, $options: "i" } },
          { brand: { $regex: q, $options: "i" } },
        ],
      },
      { name: 1, brand: 1, slug: 1 }
    )
      .limit(10)
      .lean();

    const suggestions = results.map((p) => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      slug: p.slug,
    }));

    return successResponse(suggestions);
  } catch {
    return errorResponse("Failed to fetch suggestions", "INTERNAL_ERROR", 500);
  }
}
