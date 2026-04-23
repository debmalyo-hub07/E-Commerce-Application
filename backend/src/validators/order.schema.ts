import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  paymentMethod: z.enum(["RAZORPAY", "COD", "CARD", "UPI", "NETBANKING"]),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  order_status: z.enum([
    "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
  ]),
  tracking_number: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(10, "Please provide a reason with at least 10 characters").max(500),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED",
    "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
  ]).optional(),
  paymentStatus: z.enum([
    "PENDING", "PENDING_COD", "PAYMENT_VERIFIED", "SUCCESS",
    "FAILED", "REFUND_INITIATED", "REFUNDED", "COD_COLLECTED",
  ]).optional(),
  search: z.string().max(100).optional(), // order number or customer email
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
