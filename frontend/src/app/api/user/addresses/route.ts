import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Address from "@/models/Address";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const addresses = await Address.find({ userId: token.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return successResponse(addresses);
  } catch {
    return errorResponse("Failed to fetch addresses", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const body = await request.json();
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country = "India", isDefault = false } = body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return errorResponse("Missing required address fields", "VALIDATION_ERROR", 400);
    }

    if (isDefault) {
      await Address.updateMany({ userId: token.id }, { isDefault: false });
    }

    await Address.create({
      userId: token.id,
      label: label ?? "Home",
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode: String(pincode),
      country,
      isDefault,
    });

    const addresses = await Address.find({ userId: token.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return successResponse(addresses, 201);
  } catch {
    return errorResponse("Failed to create address", "INTERNAL_ERROR", 500);
  }
}
