import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Address from "@/models/Address";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { z } from "zod";

const createAddressSchema = z.object({
  label: z.string().trim().optional().default("Home"),
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be a 10-digit number"),
  addressLine1: z.string().trim().min(5, "Address line 1 is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, "Pincode must be a 6-digit number"),
  country: z.string().trim().default("India"),
  isDefault: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = session?.user;
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
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const body = await request.json();

    const validated = createAddressSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = validated.data;

    if (isDefault) {
      await Address.updateMany({ userId: token.id }, { isDefault: false });
    }

    await Address.create({
      userId: token.id,
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      isDefault,
    });

    const addresses = await Address.find({ userId: token.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return successResponse(addresses, 201);
  } catch (err) {
    console.error("[POST /api/user/addresses] Error:", err);
    return errorResponse("Failed to create address", "INTERNAL_ERROR", 500);
  }
}

