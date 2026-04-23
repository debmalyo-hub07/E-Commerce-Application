import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongoose";
import Review from "@/models/Review";
import Order from "@/models/Order";
import AuditLog from "@/models/AuditLog";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  body: z.string().min(20, "Review must be at least 20 characters").max(2000),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");

  try {
    await connectDB();

    if (!productId) {
      return errorResponse("Product ID is required", "VALIDATION_ERROR", 400);
    }

    const reviews = await Review.find({
      productId,
      isApproved: true,
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(reviews);
  } catch {
    return errorResponse("Failed to fetch reviews", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET! });
  if (!token) return unauthorizedResponse();

  try {
    await connectDB();
    const body = await request.json();

    const validated = createReviewSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.errors.map((e) => `${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const existingReview = await Review.findOne({
      productId: validated.data.productId,
      userId: token.id,
    });

    if (existingReview) {
      return errorResponse(
        "You have already submitted a review for this product",
        "DUPLICATE_REVIEW",
        400
      );
    }

    const order = await Order.findOne({
      userId: token.id,
      "items.productId": validated.data.productId,
      orderStatus: "DELIVERED",
    });

    const isVerifiedPurchase = !!order;

    const review = await Review.create({
      productId: validated.data.productId,
      userId: token.id,
      rating: validated.data.rating,
      title: validated.data.title,
      body: validated.data.body,
      isVerifiedPurchase,
      isApproved: false,
    });

    await AuditLog.create({
      userId: token.id,
      action: "REVIEW_SUBMITTED",
      entityType: "Review",
      entityId: review._id,
      metadata: {
        productId: validated.data.productId,
        rating: validated.data.rating,
        isVerifiedPurchase,
      },
    });

    return successResponse(
      { message: "Review submitted and awaiting approval", review },
      201
    );
  } catch (err) {
    console.error("[POST /api/reviews] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Failed to submit review",
      "INTERNAL_ERROR",
      500
    );
  }
}
