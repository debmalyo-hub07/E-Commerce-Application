// ============================================================
// App-Wide Constants
// Import via: import { ... } from "@stylemart/shared/constants"
// ============================================================

// ── Order Policy ─────────────────────────────────────────────
/** Milliseconds within which a customer can cancel an order (1 hour) */
export const ORDER_CANCEL_WINDOW_MS = 3_600_000;

/** Days after delivery within which a customer can request a refund (7 days) */
export const REFUND_WINDOW_DAYS = 7;

/** Days after which a soft-deleted user account is hard-deleted */
export const SOFT_DELETE_PURGE_DAYS = 30;

/** Hours after which a PENDING order expires if payment not received */
export const PENDING_ORDER_EXPIRE_HOURS = 24;

// ── Stock ────────────────────────────────────────────────────
/** Notify admin when product stock falls below this threshold */
export const LOW_STOCK_THRESHOLD = 10;

// ── Shipping ──────────────────────────────────────────────────
/** Free shipping above this order subtotal (in INR) */
export const FREE_SHIPPING_ABOVE = 1000;

/** Standard shipping charge when order is below FREE_SHIPPING_ABOVE */
export const STANDARD_SHIPPING_CHARGE = 50;

// ── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── Rate Limiting (requests per window) ──────────────────────
export const RATE_LIMITS = {
  AUTH: { requests: 10, window: "1 m" },
  PAYMENT: { requests: 20, window: "1 m" },
  PUBLIC_PRODUCTS: { requests: 200, window: "1 m" },
  ADMIN: { requests: 60, window: "1 m" },
  LOGIN_BRUTE_FORCE: { requests: 5, window: "15 m" },
} as const;

// ── Cache TTLs (seconds) ─────────────────────────────────────
export const CACHE_TTL = {
  PRODUCT_LISTING: 300,       // 5 minutes
  PRODUCT_DETAIL: 600,        // 10 minutes
  CATEGORY_TREE: 1800,        // 30 minutes
  HOMEPAGE_FEATURED: 300,     // 5 minutes
} as const;

// ── Roles (mirror of Mongoose enum for client-side use) ─────────
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Order Statuses ────────────────────────────────────────────
export const ORDER_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatusType = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

/** Valid admin-settable order status transitions */
export const ALLOWED_ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

// ── Payment Statuses ──────────────────────────────────────────
export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  PENDING_COD: "PENDING_COD",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUND_INITIATED: "REFUND_INITIATED",
  REFUNDED: "REFUNDED",
  COD_COLLECTED: "COD_COLLECTED",
} as const;

// ── GST Slabs (%) ────────────────────────────────────────────
export const GST_SLABS = [0, 5, 12, 18, 28] as const;

// ── Indian States (for address form) ─────────────────────────
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

// ── BullMQ Queue Names ────────────────────────────────────────
export const QUEUE_NAMES = {
  EMAIL: "email-queue",
  NOTIFICATION: "notification-queue",
  STOCK_ALERT: "stock-alert-queue",
  CLEANUP: "cleanup-queue",
} as const;

// ── Email Job Types ───────────────────────────────────────────
export const EMAIL_JOBS = {
  ORDER_CONFIRM: "ORDER_CONFIRM",
  SHIPPING_UPDATE: "SHIPPING_UPDATE",
  REFUND_CONFIRM: "REFUND_CONFIRM",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

// ── Error Codes ───────────────────────────────────────────────
export const ERROR_CODES = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_COUPON: "INVALID_COUPON",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  COUPON_USAGE_EXCEEDED: "COUPON_USAGE_EXCEEDED",
  PAYMENT_VERIFICATION_FAILED: "PAYMENT_VERIFICATION_FAILED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_CANCEL_WINDOW_EXPIRED: "ORDER_CANCEL_WINDOW_EXPIRED",
  REFUND_WINDOW_EXPIRED: "REFUND_WINDOW_EXPIRED",
  DUPLICATE_WEBHOOK_EVENT: "DUPLICATE_WEBHOOK_EVENT",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
} as const;
