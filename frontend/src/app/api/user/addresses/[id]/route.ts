import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Address from "@/models/Address";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const address = await Address.findOne({ _id: id, userId: token.id }).lean();
    if (!address) return notFoundResponse("Address");

    return successResponse(address);
  } catch {
    return errorResponse("Failed to fetch address", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await request.json();
    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = body;

    const address = await Address.findOne({ _id: id, userId: token.id });
    if (!address) return notFoundResponse("Address");

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ userId: token.id }, { isDefault: false });
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      {
        ...(label !== undefined && { label }),
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(addressLine1 !== undefined && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode: String(pincode) }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
      { new: true }
    ).lean();

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/user/addresses/[id]] Error:", err);
    return errorResponse("Failed to update address", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const { id } = await ctx.params;

    const address = await Address.findOne({ _id: id, userId: token.id });
    if (!address) return notFoundResponse("Address");

    if (address.isDefault) {
      const nextDefault = await Address.findOne({ userId: token.id, _id: { $ne: id } }).sort({ createdAt: -1 });
      if (nextDefault) {
        await Address.findByIdAndUpdate(nextDefault._id, { isDefault: true });
      }
    }

    await Address.findByIdAndDelete(id);
    return successResponse({ message: "Address deleted successfully" });
  } catch {
    return errorResponse("Failed to delete address", "INTERNAL_ERROR", 500);
  }
}
