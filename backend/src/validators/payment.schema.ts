import { z } from "zod";

export const createPaymentOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().max(50).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
});

export const refundSchema = z.object({
  amount: z.number().positive("Refund amount must be positive").optional(),
  reason: z.string().min(10, "Provide a reason for the refund").max(500),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(50),
  orderSubtotal: z.number().positive(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
