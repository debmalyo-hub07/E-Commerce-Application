// ============================================================
// Shared TypeScript Interfaces & Enums
// Used by both frontend and backend workspaces.
// Import via: import { ... } from "@nexmart/shared/types"
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PENDING_COD = "PENDING_COD",
  PAYMENT_VERIFIED = "PAYMENT_VERIFIED",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUND_INITIATED = "REFUND_INITIATED",
  REFUNDED = "REFUNDED",
  COD_COLLECTED = "COD_COLLECTED",
}

export enum PaymentMethod {
  RAZORPAY = "RAZORPAY",
  COD = "COD",
  CARD = "CARD",
  UPI = "UPI",
  NETBANKING = "NETBANKING",
}

export enum CouponType {
  PERCENTAGE = "PERCENTAGE",
  FLAT = "FLAT",
}

// ── API Response Envelope ────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  error_code?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// ── User ─────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  created_at: Date;
  orders_count?: number;
}

// ── Address ──────────────────────────────────────────────────

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

// ── Category ─────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  image_url?: string | null;
  is_active: boolean;
  children?: Category[];
  products_count?: number;
}

// ── Product ──────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  public_id: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  category_id: string;
  base_price: number;
  selling_price: number;
  gst_percent: number;
  discount_percent: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews_count?: number;
  average_rating?: number;
  final_price?: number; // computed: selling_price × (1 + gst%/100) × (1 - discount%/100)
}

export interface ProductSnapshot {
  name: string;
  selling_price: number;
  gst_percent: number;
  discount_percent: number;
  image_url: string;
  brand?: string;
  variant?: string;
}

// ── Cart ─────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

// ── Order ────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
  gst_percent: number;
  total_price: number;
  product_snapshot: ProductSnapshot;
  product?: Product;
  variant?: ProductVariant;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  address_id: string;
  subtotal: number;
  discount_amount: number;
  gst_amount: number;
  shipping_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  user?: UserPublic;
  address?: Address;
  order_items?: OrderItem[];
  payments?: Payment[];
}

// ── Payment ──────────────────────────────────────────────────

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider_payment_id?: string | null;
  provider_order_id?: string | null;
  refund_id?: string | null;
  refund_amount?: number | null;
  refund_status?: string | null;
  refund_initiated_at?: Date | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

// ── Review ───────────────────────────────────────────────────

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: Date;
  user?: UserPublic;
}

// ── Coupon ───────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value?: number | null;
  max_discount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ── Notification ─────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
}

// ── Audit Log ────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

// ── Wishlist ─────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  added_at: Date;
  product?: Product;
}

// ── Courier Verification ─────────────────────────────────────

export interface CourierVerification {
  id: string;
  order_id: string;
  courier_id: string;
  cod_amount: number;
  verified_at?: Date | null;
  status: "pending" | "approved" | "rejected";
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── Dashboard KPIs ───────────────────────────────────────────

export interface DashboardKPIs {
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
  };
  active_customers: number;
  low_stock_products: number;
}

// ── Search ───────────────────────────────────────────────────

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  category: string;
  image_url?: string;
  price: number;
}

