import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const brands = await Product.distinct("brand", { isActive: true, brand: { $ne: null } });

    const sortedBrands = brands.sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    });

    return successResponse(sortedBrands);
  } catch {
    return errorResponse("Failed to fetch brands", "INTERNAL_ERROR", 500);
  }
}
