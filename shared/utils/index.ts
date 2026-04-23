// ============================================================
// Shared Pure Utility Functions
// No side effects, no HTTP, no DB — pure transformations only.
// Import via: import { ... } from "@stylemart/shared/utils"
// ============================================================

import { DEFAULT_PAGE_SIZE, FREE_SHIPPING_ABOVE, STANDARD_SHIPPING_CHARGE } from "./constants"; // relative import within shared

// NOTE: re-export constants in utils for convenience
export { formatCurrency, computeFinalPrice, generateOrderNumber, paginate, slugify };

/**
 * Format a number as an Indian Rupee currency string.
 * @example formatCurrency(1234.5) → "₹1,234.50"
 */
function formatCurrency(amount: number, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compute the final customer-facing price from product pricing fields.
 * Formula: selling_price × (1 - discount%/100) × (1 + gst%/100)
 */
function computeFinalPrice(
  sellingPrice: number,
  gstPercent: number,
  discountPercent: number
): number {
  const afterDiscount = sellingPrice * (1 - discountPercent / 100);
  const withGST = afterDiscount * (1 + gstPercent / 100);
  return Math.round(withGST * 100) / 100; // round to 2 decimal places
}

/**
 * Generate a unique, human-readable order number.
 * Format: SM-YYYYMMDD-XXXXXXXX (8 random alphanumeric chars)
 */
function generateOrderNumber(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
  return `SM-${datePart}-${randomPart}`;
}

/**
 * Compute MongoDB skip/limit from page and limit.
 */
function paginate(
  page: number,
  limit: number = DEFAULT_PAGE_SIZE
): { skip: number; take: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

/**
 * Convert a string to a URL-friendly slug.
 * @example slugify("Hello World! 123") → "hello-world-123"
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Calculate shipping amount based on order subtotal.
 */
export function computeShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_ABOVE ? 0 : STANDARD_SHIPPING_CHARGE;
}

/**
 * Calculate total pages for pagination.
 */
export function totalPages(total: number, limit: number): number {
  return Math.ceil(total / Math.max(1, limit));
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Format a date as a human-readable string in Indian locale.
 * @example formatDate(new Date()) → "21 Apr 2026"
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

/**
 * Calculate the number of days remaining until a date.
 * Returns negative if date is in the past.
 */
export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if an order can be cancelled (within 1-hour window).
 */
export function isOrderCancellable(createdAt: Date, orderStatus: string): boolean {
  if (!["PENDING", "CONFIRMED"].includes(orderStatus)) return false;
  const windowMs = 60 * 60 * 1000; // 1 hour
  return Date.now() - new Date(createdAt).getTime() < windowMs;
}

/**
 * Check if a refund request is within the 7-day window.
 */
export function isRefundEligible(deliveredAt: Date, orderStatus: string): boolean {
  if (orderStatus !== "DELIVERED") return false;
  const windowDays = 7;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(deliveredAt).getTime() < windowMs;
}

/**
 * Mask sensitive data for logging (e.g., email, phone).
 * @example maskEmail("john@example.com") → "jo**@example.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.slice(0, 2) + "**";
  return `${masked}@${domain}`;
}

/**
 * Generate a Redis cache key for products.
 */
export function productCacheKey(slug: string): string {
  return `product:${slug}`;
}

/**
 * Generate a Redis cache key for product listings.
 */
export function productListCacheKey(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `products:list:${sorted}`;
}
