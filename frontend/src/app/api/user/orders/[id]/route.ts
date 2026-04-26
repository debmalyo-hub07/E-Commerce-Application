import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const token = session?.user;
  if (!token) return unauthorizedResponse();

  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findOne({
      _id: id,
      userId: token.id,
    })
      .populate("userId", "name email phone")
      .populate("addressId")
      .lean();

    if (!order) {
      return errorResponse("Order not found", "NOT_FOUND", 404);
    }

    return successResponse(order, 200);
  } catch (err) {
    console.error(`[GET /api/user/orders/${params}] Error:`, err);
    return errorResponse("Failed to fetch order", "INTERNAL_ERROR", 500);
  }
}
