# CLAUDE.md — E-Commerce Platform: Architecture, Rules & Developer Guide

> This file is the single source of truth for Claude (AI assistant) when working on this codebase.
> Read this entire file before making any change, generating any code, or answering any question about this project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Database: MongoDB with Mongoose](#4-database-mongodb-with-mongoose)
5. [Authentication & RBAC](#5-authentication--rbac)
6. [Payment System (Razorpay)](#6-payment-system-razorpay)
7. [API Conventions](#7-api-conventions)
8. [Background Jobs (BullMQ)](#8-background-jobs-bullmq)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Customer Account Area](#11-customer-account-area)
12. [Security Hardening](#12-security-hardening)
13. [Performance & SEO](#13-performance--seo)
14. [Environment Variables](#14-environment-variables)
15. [Known Error Fixes & Gotchas](#15-known-error-fixes--gotchas)
16. [Coding Rules & Constraints](#16-coding-rules--constraints)
17. [Deployment](#17-deployment)

---

## 1. Project Overview

This is a **production-grade, globally competitive e-commerce platform** comparable to Flipkart and Amazon. It is built as a **Turborepo monorepo** with a Next.js 15 frontend, a standalone Node.js backend service layer, a shared TypeScript package, and a single MongoDB database accessed through Mongoose ODM.

**Root directory:** `ecommerce-platform/`

**Key design decisions:**
- MongoDB (Atlas) replaces PostgreSQL/Supabase — all schemas are Mongoose models, not Prisma models.
- Mongoose replaces Prisma ORM entirely. There is no `prisma/` directory.
- All business logic lives in `backend/src/services/` — never in frontend components or API route files directly.
- Frontend and backend share types only through `shared/` — never cross-import.
- All secrets live in root `.env.local` — never hardcoded anywhere.

---

## 2. Monorepo Structure

```
ecommerce-platform/
├── frontend/              ← Next.js 15 App (UI + API routes)
├── backend/               ← Standalone service layer (jobs, services, validators)
├── shared/                ← Shared TypeScript types, constants, utility functions
├── .env.example           ← Documented template (safe placeholder values)
├── .env.local             ← Local secrets — GITIGNORED
├── docker-compose.yml     ← Local dev: MongoDB, Redis
├── turbo.json             ← Turborepo pipeline config
├── package.json           ← Monorepo root with workspaces
└── README.md              ← Full setup and architecture docs
```

### Frontend workspace (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                  ← Homepage
│   │   │   ├── products/                 ← Listing + [slug] detail
│   │   │   ├── search/
│   │   │   ├── cart/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── privacy-policy/
│   │   │   └── terms/
│   │   ├── (auth)/
│   │   │   ├── checkout/
│   │   │   └── account/
│   │   │       ├── profile/
│   │   │       ├── orders/
│   │   │       ├── addresses/
│   │   │       ├── wishlist/
│   │   │       └── notifications/
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── users/
│   │   │   ├── coupons/
│   │   │   ├── refunds/
│   │   │   └── cod-verification/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── payment/
│   │   │   │   ├── create-order/
│   │   │   │   └── verify/
│   │   │   ├── webhooks/razorpay/
│   │   │   ├── admin/
│   │   │   ├── user/
│   │   │   ├── products/
│   │   │   └── courier/
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   ├── components/
│   │   ├── ui/                           ← Shadcn/UI primitives
│   │   ├── layout/                       ← Navbar, Footer, Sidebar, Breadcrumb
│   │   ├── product/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── admin/
│   │   ├── account/
│   │   └── common/
│   ├── lib/
│   │   ├── auth.ts                       ← NextAuth v5 config
│   │   ├── mongoose.ts                   ← Mongoose connection singleton
│   │   ├── redis.ts                      ← Upstash Redis client
│   │   ├── cloudinary.ts
│   │   ├── razorpay.ts
│   │   └── api-response.ts
│   ├── hooks/
│   ├── store/
│   ├── styles/globals.css
│   └── middleware.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Backend workspace (`backend/`)

```
backend/
├── src/
│   ├── services/
│   │   ├── payment.service.ts
│   │   ├── order.service.ts
│   │   ├── product.service.ts
│   │   ├── email.service.ts
│   │   ├── notification.service.ts
│   │   └── cloudinary.service.ts
│   ├── jobs/
│   │   ├── email.queue.ts
│   │   ├── notification.queue.ts
│   │   ├── stock-alert.queue.ts
│   │   └── cleanup.queue.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── ratelimit.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── error.middleware.ts
│   ├── validators/
│   │   ├── auth.schema.ts
│   │   ├── product.schema.ts
│   │   ├── order.schema.ts
│   │   └── payment.schema.ts
│   ├── emails/
│   │   ├── order-confirm.tsx
│   │   ├── shipping-update.tsx
│   │   ├── refund-confirm.tsx
│   │   └── account-suspended.tsx
│   └── lib/
│       ├── mongoose.ts
│       ├── redis.ts
│       ├── razorpay.ts
│       └── cloudinary.ts
└── package.json
```

### Shared workspace (`shared/`)

```
shared/
├── types/index.ts         ← All TypeScript interfaces and enums
├── constants/index.ts     ← App-wide constants
└── utils/index.ts         ← Pure utility functions
```

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode, no `any`) |
| Styling | Tailwind CSS v4, Shadcn/UI v2, Radix UI |
| Animations | Framer Motion 11 |
| State | Zustand (global), React Query v5 (server state) |
| Forms | React Hook Form + Zod |
| Database | **MongoDB Atlas** via **Mongoose ODM** |
| Cache / Sessions | Upstash Redis |
| Queue | BullMQ (backed by Redis) |
| Auth | NextAuth.js v5 (Auth.js) |
| Payments | Razorpay Node.js SDK |
| Media | Cloudinary SDK + next/image Cloudinary loader |
| Email | Nodemailer + React Email |
| Deployment | Vercel (frontend) + Vercel Serverless (API) |

---

## 4. Database: MongoDB with Mongoose

> **CRITICAL:** This project uses **MongoDB Atlas** with **Mongoose ODM**. There is NO Prisma, NO PostgreSQL, NO Supabase. Any AI suggestion involving Prisma or PostgreSQL is wrong for this project.

### 4.1 Mongoose Connection Singleton

**File:** `frontend/src/lib/mongoose.ts` AND `backend/src/lib/mongoose.ts`

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Prevent multiple connections in Next.js hot-reload dev environment
const globalWithMongoose = global as typeof globalThis & { mongoose: MongooseCache };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Rule:** Call `await connectDB()` at the top of every API route handler and every service function that touches the DB. Never assume the connection is already open.

---

### 4.2 Mongoose Models

All models live in `frontend/src/models/` (used by API routes) and are imported by reference in `backend/src/lib/` for service functions. Use the `model || models` pattern to avoid "Cannot overwrite model once compiled" errors in Next.js hot reload.

**Pattern for every model:**

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  // ...
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // ...
  },
  { timestamps: true } // auto-manages createdAt + updatedAt
);

// Indexes
UserSchema.index({ email: 1 });

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
```

---

### 4.3 Complete Schema Definitions

#### User

```typescript
const UserSchema = new Schema({
  name:            { type: String, required: true, minlength: 2, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:    { type: String },               // null for OAuth users
  role:            { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'], default: 'CUSTOMER' },
  status:          { type: String, enum: ['ACTIVE', 'SUSPENDED', 'DELETED'], default: 'ACTIVE' },
  phone:           { type: String },
  avatarUrl:       { type: String },
  avatarPublicId:  { type: String },               // Cloudinary public_id
  emailVerified:   { type: Boolean, default: false },
  googleId:        { type: String, sparse: true }, // for Google OAuth
}, { timestamps: true });
```

#### Address

```typescript
const AddressSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label:        { type: String, default: 'Home' }, // Home / Work / Other
  fullName:     { type: String, required: true },
  phone:        { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  pincode:      { type: String, required: true },
  country:      { type: String, default: 'India' },
  isDefault:    { type: Boolean, default: false },
}, { timestamps: true });
AddressSchema.index({ userId: 1 });
```

#### Category

```typescript
const CategorySchema = new Schema({
  name:     { type: String, required: true, trim: true },
  slug:     { type: String, required: true, unique: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
CategorySchema.index({ slug: 1 });
```

#### Product

```typescript
const ProductImageSchema = new Schema({
  url:          { type: String, required: true },
  publicId:     { type: String, required: true }, // Cloudinary public_id
  isPrimary:    { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
}, { _id: true });

const ProductVariantSchema = new Schema({
  name:          { type: String, required: true }, // e.g. "Size"
  value:         { type: String, required: true }, // e.g. "XL"
  priceModifier: { type: Number, default: 0 },
  stock:         { type: Number, default: 0, min: 0 },
}, { _id: true });

const ProductSchema = new Schema({
  name:            { type: String, required: true, trim: true },
  slug:            { type: String, required: true, unique: true },
  description:     { type: String },               // sanitized HTML from Tiptap
  brand:           { type: String },
  categoryId:      { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  basePrice:       { type: Number, required: true, min: 0 },
  sellingPrice:    { type: Number, required: true, min: 0 },
  gstPercent:      { type: Number, default: 18, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  stockQuantity:   { type: Number, default: 0, min: 0 },
  isActive:        { type: Boolean, default: true },
  isFeatured:      { type: Boolean, default: false },
  images:          [ProductImageSchema],
  variants:        [ProductVariantSchema],
  createdBy:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

ProductSchema.index({ slug: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' }); // full-text search
```

#### Order

```typescript
const OrderItemSchema = new Schema({
  productId:       { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId:       { type: Schema.Types.ObjectId },
  quantity:        { type: Number, required: true, min: 1 },
  unitPrice:       { type: Number, required: true },
  gstPercent:      { type: Number, required: true },
  totalPrice:      { type: Number, required: true },
  productSnapshot: { type: Schema.Types.Mixed, required: true }, // BSON equivalent of JSONB
}, { _id: true });

const OrderSchema = new Schema({
  orderNumber:         { type: String, required: true, unique: true },
  userId:              { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addressId:           { type: Schema.Types.ObjectId, ref: 'Address', required: true },
  addressSnapshot:     { type: Schema.Types.Mixed, required: true }, // capture address at order time
  items:               [OrderItemSchema],
  subtotal:            { type: Number, required: true },
  discountAmount:      { type: Number, default: 0 },
  gstAmount:           { type: Number, required: true },
  shippingAmount:      { type: Number, default: 0 },
  totalAmount:         { type: Number, required: true },
  couponCode:          { type: String },
  paymentMethod:       { type: String, enum: ['RAZORPAY', 'COD'], required: true },
  paymentStatus:       { type: String, enum: ['PENDING', 'PAYMENT_VERIFIED', 'FAILED', 'REFUND_INITIATED', 'REFUNDED', 'PENDING_COD', 'COD_COLLECTED'], default: 'PENDING' },
  orderStatus:         { type: String, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'], default: 'PENDING' },
  razorpayOrderId:     { type: String },
  razorpayPaymentId:   { type: String },
  razorpaySignature:   { type: String },
  trackingNumber:      { type: String },
  notes:               { type: String },
  cancelRequestedAt:   { type: Date },
}, { timestamps: true });

OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
```

#### Payment

```typescript
const PaymentSchema = new Schema({
  orderId:            { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount:             { type: Number, required: true },
  currency:           { type: String, default: 'INR' },
  method:             { type: String, enum: ['RAZORPAY', 'COD'] },
  status:             { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  providerPaymentId:  { type: String },
  providerOrderId:    { type: String },
  refundId:           { type: String },
  refundAmount:       { type: Number },
  refundStatus:       { type: String },
  refundInitiatedAt:  { type: Date },
  metadata:           { type: Schema.Types.Mixed },
}, { timestamps: true });

PaymentSchema.index({ orderId: 1, userId: 1 });
```

#### Review

```typescript
const ReviewSchema = new Schema({
  productId:          { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating:             { type: Number, required: true, min: 1, max: 5 },
  title:              { type: String, required: true, maxlength: 100 },
  body:               { type: String, required: true, maxlength: 2000 },
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved:         { type: Boolean, default: false },
}, { timestamps: true });

ReviewSchema.index({ productId: 1, isApproved: 1 });
ReviewSchema.index({ userId: 1 });
```

#### Coupon

```typescript
const CouponSchema = new Schema({
  code:          { type: String, required: true, unique: true, uppercase: true },
  type:          { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
  value:         { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount:   { type: Number },
  usageLimit:    { type: Number },
  usedCount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     { type: Date },
}, { timestamps: true });

CouponSchema.index({ code: 1 });
```

#### CartItem

```typescript
const CartItemSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId },
  quantity:  { type: Number, required: true, min: 1 },
}, { timestamps: true });

CartItemSchema.index({ userId: 1 });
```

#### Wishlist

```typescript
const WishlistSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });

WishlistSchema.index({ userId: 1 });
```

#### Notification

```typescript
const NotificationSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, required: true }, // e.g. 'ORDER_UPDATE', 'REFUND_STATUS'
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  isRead:   { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1 });
```

#### AuditLog

```typescript
const AuditLogSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User' },
  action:     { type: String, required: true }, // 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', etc.
  entityType: { type: String },                 // 'Order', 'Product', 'User'
  entityId:   { type: Schema.Types.ObjectId },
  metadata:   { type: Schema.Types.Mixed },
  ipAddress:  { type: String },
  userAgent:  { type: String },
}, { timestamps: true });

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: 1 });
```

#### CourierVerification

```typescript
const CourierVerificationSchema = new Schema({
  orderId:    { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  courierId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  codAmount:  { type: Number, required: true },
  verifiedAt: { type: Date },
  status:     { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  notes:      { type: String },
}, { timestamps: true });
```

#### ProcessedWebhookEvent (idempotency)

```typescript
const ProcessedWebhookEventSchema = new Schema({
  eventId:   { type: String, required: true, unique: true }, // Razorpay event ID
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

ProcessedWebhookEventSchema.index({ eventId: 1 }, { unique: true });
```

---

### 4.4 MongoDB Transactions (Replacing Prisma `$transaction`)

MongoDB Atlas supports multi-document ACID transactions with replica sets. Use `mongoose.startSession()` for all operations that require atomicity.

```typescript
// Example: Atomic order creation with stock deduction
import mongoose from 'mongoose';

export async function createOrderAtomic(data: CreateOrderInput) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate stock
    const product = await Product.findById(data.productId).session(session);
    if (!product || product.stockQuantity < data.quantity) {
      throw new AppError('INSUFFICIENT_STOCK', 400);
    }

    // 2. Deduct stock
    await Product.findByIdAndUpdate(
      data.productId,
      { $inc: { stockQuantity: -data.quantity } },
      { session, new: true }
    );

    // 3. Create order
    const order = await Order.create([{ ...data, status: 'PENDING' }], { session });

    // 4. Commit
    await session.commitTransaction();
    return order[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
```

> **Rule:** Every payment, stock deduction, and refund operation MUST use a MongoDB session with `startTransaction()` / `commitTransaction()` / `abortTransaction()`. Never mutate order + stock in separate independent queries.

---

### 4.5 Seeding (`seed.ts` at root)

```typescript
// seed.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './frontend/src/models/User';
import Category from './frontend/src/models/Category';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);

  // SUPER_ADMIN
  const hash = await bcrypt.hash('SuperAdmin@123', 12);
  await User.findOneAndUpdate(
    { email: 'superadmin@store.com' },
    { name: 'Super Admin', email: 'superadmin@store.com', passwordHash: hash, role: 'SUPER_ADMIN', emailVerified: true, status: 'ACTIVE' },
    { upsert: true, new: true }
  );

  // Sample categories
  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports', 'Books'];
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
    await Category.findOneAndUpdate({ slug }, { name, slug, isActive: true }, { upsert: true });
  }

  console.log('Seed complete');
  process.exit(0);
}

seed();
```

---

## 5. Authentication & RBAC

### 5.1 NextAuth v5 Config (`frontend/src/lib/auth.ts`)

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from './mongoose';
import User from '../models/User';
import { loginSchema } from '../../backend/src/validators/auth.schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email });
        if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash ?? '');
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role;
      (session.user as any).status = token.status;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB();
        await User.findOneAndUpdate(
          { email: user.email! },
          { $setOnInsert: { name: user.name, email: user.email, role: 'CUSTOMER', status: 'ACTIVE', emailVerified: true } },
          { upsert: true }
        );
      }
      return true;
    },
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
});
```

### 5.2 Middleware (`frontend/src/middleware.ts`)

```typescript
import { auth } from './lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role;

  // Redirect logged-in users away from auth pages
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Require authentication
  const authRequired = pathname.startsWith('/account') || pathname.startsWith('/checkout') || pathname.startsWith('/api/user');
  if (authRequired && !session) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
  }

  // Require ADMIN or SUPER_ADMIN
  const adminRequired = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (adminRequired && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

### 5.3 Brute-Force Protection (Redis)

```typescript
// backend/src/middleware/ratelimit.middleware.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({ url: process.env.REDIS_URL!, token: process.env.REDIS_TOKEN! });

export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min per IP
  prefix: 'rl:auth',
});

// Usage in /api/auth/login route:
const { success } = await authRatelimit.limit(ip);
if (!success) return apiError('TOO_MANY_REQUESTS', 429, 'Too many login attempts. Try again in 15 minutes.');
```

---

## 6. Payment System (Razorpay)

### 6.1 Create Order (`POST /api/payment/create-order`)

```typescript
// All business logic delegated to backend service
import { createRazorpayOrder } from '@/backend/services/payment.service';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return apiError('UNAUTHORIZED', 401);

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const result = await createRazorpayOrder(session.user.id, parsed.data);
  return apiSuccess(result);
}
```

**`payment.service.ts` — atomic order creation:**

```typescript
export async function createRazorpayOrder(userId: string, input: CreateOrderInput) {
  await connectDB();
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // 1. Validate all cart items and stock
    for (const item of input.items) {
      const product = await Product.findById(item.productId).session(mongoSession);
      if (!product?.isActive) throw new AppError('PRODUCT_NOT_FOUND', 404);
      if (product.stockQuantity < item.quantity) throw new AppError('INSUFFICIENT_STOCK', 400);
    }

    // 2. Compute totals
    const { subtotal, gstAmount, totalAmount } = computeOrderTotals(input.items);

    // 3. Deduct stock
    for (const item of input.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: -item.quantity } },
        { session: mongoSession }
      );
    }

    // 4. Create Razorpay order
    const rzOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt: generateOrderNumber(),
    });

    // 5. Create Order document
    const [order] = await Order.create([{
      orderNumber: rzOrder.receipt,
      userId,
      addressId: input.addressId,
      addressSnapshot: input.addressSnapshot,
      items: input.items.map(mapToOrderItem),
      subtotal,
      gstAmount,
      totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      razorpayOrderId: rzOrder.id,
    }], { session: mongoSession });

    await mongoSession.commitTransaction();

    return {
      orderId: order._id.toString(),
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
}
```

### 6.2 Verify Payment (`POST /api/payment/verify`)

```typescript
import crypto from 'crypto';

export async function verifyPayment(orderId: string, razorpayPaymentId: string, razorpaySignature: string, razorpayOrderId: string) {
  // HMAC-SHA256 verification
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(body).digest('hex');

  if (expectedSig !== razorpaySignature) {
    // Reverse stock on invalid signature
    await reverseStockDeductions(orderId);
    throw new AppError('PAYMENT_VERIFICATION_FAILED', 400);
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'PAYMENT_VERIFIED',
      orderStatus: 'CONFIRMED',
      razorpayPaymentId,
      razorpaySignature,
    }, { session: mongoSession });

    await Payment.create([{
      orderId,
      amount: /* from order */,
      status: 'SUCCESS',
      providerPaymentId: razorpayPaymentId,
      providerOrderId: razorpayOrderId,
    }], { session: mongoSession });

    await mongoSession.commitTransaction();
    // Queue confirmation email
    await emailQueue.add('order-confirm', { orderId });
  } catch (err) {
    await mongoSession.abortTransaction();
    throw err;
  } finally {
    mongoSession.endSession();
  }
}
```

### 6.3 Webhook Handler (`POST /api/webhooks/razorpay`)

```typescript
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature')!;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest('hex');

  if (expectedSig !== signature) return new Response('Unauthorized', { status: 401 });

  const event = JSON.parse(body);

  // Idempotency check
  const alreadyProcessed = await ProcessedWebhookEvent.findOne({ eventId: event.id });
  if (alreadyProcessed) return new Response('OK', { status: 200 });

  await ProcessedWebhookEvent.create({ eventId: event.id, eventType: event.event });

  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity);
      break;
    case 'refund.created':
      await handleRefundCreated(event.payload.refund.entity);
      break;
    case 'refund.processed':
      await handleRefundProcessed(event.payload.refund.entity);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

### 6.4 Pricing Engine

```typescript
// shared/utils/index.ts
export function computeFinalPrice(sellingPrice: number, gstPercent: number, discountPercent: number): number {
  return sellingPrice * (1 + gstPercent / 100) * (1 - discountPercent / 100);
}
```

---

## 7. API Conventions

### 7.1 Response Envelope

```typescript
// frontend/src/lib/api-response.ts
export function apiSuccess<T>(data: T, meta?: PaginationMeta, status = 200): Response {
  return Response.json({ success: true, data, error: null, meta }, { status });
}

export function apiError(errorCode: string, status: number, message?: string): Response {
  return Response.json({ success: false, data: null, error: message ?? errorCode, error_code: errorCode }, { status });
}

export function validationError(zodError: ZodError): Response {
  return Response.json({
    success: false,
    data: null,
    error: 'Validation failed',
    error_code: 'VALIDATION_ERROR',
    fields: zodError.flatten().fieldErrors,
  }, { status: 400 });
}
```

### 7.2 Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Zod validation failure |
| `INSUFFICIENT_STOCK` | 400 | Product out of stock |
| `INVALID_COUPON` | 400 | Coupon invalid or expired |
| `PAYMENT_VERIFICATION_FAILED` | 400 | HMAC mismatch |
| `TOO_MANY_REQUESTS` | 429 | Rate limit hit |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

### 7.3 Rate Limits (Upstash)

| Route | Limit |
|---|---|
| `/api/auth/*` | 10 req/min per IP |
| `/api/payment/*` | 20 req/min per user |
| `/api/products` (GET) | 200 req/min per IP |
| `/api/admin/*` | 60 req/min per user |

### 7.4 Caching (Redis TTLs)

| Data | TTL | Invalidated on |
|---|---|---|
| Product listings | 5 min | product create/update/delete |
| Product detail | 10 min | product update |
| Category tree | 30 min | category create/update |
| Homepage featured | 5 min | product update/feature toggle |

**Never cache:** user-specific data, cart, payment responses, session tokens.

---

## 8. Background Jobs (BullMQ)

All queues use the same Upstash Redis connection. Every job has `attempts: 3` with exponential backoff. Failed jobs after all retries go to a dead-letter log in MongoDB.

### Queue Definitions

```typescript
// backend/src/jobs/email.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from '../lib/redis';

export const emailQueue = new Queue('email', { connection });

new Worker('email', async (job) => {
  switch (job.name) {
    case 'order-confirm':    await sendOrderConfirmEmail(job.data); break;
    case 'shipping-update':  await sendShippingUpdateEmail(job.data); break;
    case 'refund-confirm':   await sendRefundConfirmEmail(job.data); break;
    case 'account-suspended': await sendSuspensionEmail(job.data); break;
  }
}, {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
});
```

| Queue | Jobs |
|---|---|
| `email` | order-confirm, shipping-update, refund-confirm, account-suspended |
| `notification` | create-notification (fan-out) |
| `stock-alert` | low-stock-check (triggered after any stock deduction) |
| `cleanup` | expire-pending-orders (daily), purge-deleted-users (daily) |

---

## 9. Frontend Architecture

### 9.1 Design Tokens (`frontend/src/styles/globals.css`)

```css
@import "tailwindcss";

:root {
  --color-primary: 221 83% 53%;
  --color-primary-foreground: 0 0% 100%;
  --color-secondary: 210 40% 96%;
  --color-accent: 262 83% 58%;
  --color-destructive: 0 84% 60%;
  --color-muted: 210 40% 96%;
  --radius: 0.5rem;
  --font-sans: 'Inter', system-ui, sans-serif;
}

.dark {
  --color-primary: 217 91% 60%;
  --color-secondary: 217 32% 17%;
  --color-muted: 217 32% 17%;
}
```

### 9.2 Zustand Stores

```typescript
// store/cartStore.ts
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
}
```

### 9.3 Framer Motion Patterns

```typescript
// Staggered product cards
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// Add-to-cart button morph
const [added, setAdded] = useState(false);
// Button: AnimatePresence switches between "Add to Cart" and quantity selector
```

### 9.4 Key Pages & Components

| Route | Key Components |
|---|---|
| `/` | HeroBannerCarousel, CategoryGrid, FeaturedProducts, FlashSaleTimer, BrandCarousel |
| `/products` | FilterSidebar, SortBar, ProductGrid (infinite scroll), BreadcrumbNav |
| `/products/[slug]` | ProductGallery, VariantSelector, QuantityPicker, ReviewList, StickyAddToCart |
| `/cart` | CartItemList, CouponInput, OrderSummary |
| `/checkout` | AddressStep → PaymentStep → ConfirmationStep (multi-step with AnimatePresence) |
| `/account/orders/[id]` | OrderTimeline, PDFReceiptButton, CancelOrderButton, RequestRefundButton |

---

## 10. Admin Dashboard

All admin routes at `/admin/*` require `role === 'ADMIN' || role === 'SUPER_ADMIN'` — enforced in both `middleware.ts` and each `/api/admin/*` handler.

### KPI Cards (Dashboard)
Queries run server-side on page load with 60s revalidation:
- Total revenue: `Order.aggregate([{ $match: { paymentStatus: 'PAYMENT_VERIFIED' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])`
- Pending orders: `Order.countDocuments({ orderStatus: 'PENDING' })`
- Low-stock alerts: `Product.find({ stockQuantity: { $lte: 5 }, isActive: true })`

### Product CRUD
- Images uploaded to Cloudinary via `react-dropzone` → `/api/admin/upload`
- Rich text via Tiptap; output sanitized with DOMPurify before save
- Soft delete: set `isActive: false`; hard delete: `Product.findByIdAndDelete()` + Cloudinary asset deletion

### Order Management
Status transitions allowed per role:

| From → To | Allowed by |
|---|---|
| PENDING → CONFIRMED | ADMIN |
| CONFIRMED → PROCESSING | ADMIN |
| PROCESSING → SHIPPED | ADMIN (+ tracking number) |
| SHIPPED → OUT_FOR_DELIVERY | ADMIN |
| OUT_FOR_DELIVERY → DELIVERED | ADMIN |
| Any → CANCELLED | ADMIN or customer (within 1hr) |

Every status change: create AuditLog entry + queue notification email.

---

## 11. Customer Account Area

### Cancel Order Rule
- Visible only if `orderStatus === 'CONFIRMED' || 'PROCESSING'` AND `Date.now() - order.createdAt < 3_600_000`
- Creates a cancellation request (sets `cancelRequestedAt`); Admin must approve

### Refund Request Rule
- Visible only if `orderStatus === 'DELIVERED'` AND within 7 days of delivery
- Admin reviews and initiates via Razorpay Refunds API

### PDF Receipt
- Generated client-side using `@react-pdf/renderer`
- Loaded with `dynamic(() => import(...), { ssr: false })`

---

## 12. Security Hardening

### HTTP Headers (`next.config.ts`)

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      "frame-src https://api.razorpay.com",
      "img-src 'self' data: https://res.cloudinary.com",
      "connect-src 'self' https://api.razorpay.com",
    ].join('; '),
  },
];
```

### Input Validation
- Every API route has a Zod schema validated BEFORE any DB operation
- Rich text fields sanitized with `isomorphic-dompurify` on save
- MongoDB uses Mongoose schema validation as a second defense layer
- No raw MongoDB queries with string interpolation

### Cookie Settings (NextAuth)
```typescript
// In auth.ts NextAuth config
cookies: {
  sessionToken: {
    options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
  },
},
```

---

## 13. Performance & SEO

### Dynamic Imports (must use for these)
```typescript
const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'), { ssr: false });
const PDFReceipt = dynamic(() => import('@/components/account/PDFReceipt'), { ssr: false });
const RevenueChart = dynamic(() => import('@/components/admin/RevenueChart'), { ssr: false });
```

### Metadata Generation
```typescript
// app/(public)/products/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  return {
    title: `${product.name} | Store`,
    description: product.description?.slice(0, 160),
    openGraph: { images: [{ url: product.images[0]?.url }] },
  };
}
```

### JSON-LD (Product Pages)
```typescript
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  offers: { '@type': 'Offer', price: finalPrice, priceCurrency: 'INR', availability: product.stockQuantity > 0 ? 'InStock' : 'OutOfStock' },
}) }} />
```

### Lighthouse Targets
- Performance: 95+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

---

## 14. Environment Variables

All variables defined in root `.env.local` and documented in `.env.example`.

```bash
# ─── MongoDB ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority

# ─── Redis (Upstash) ─────────────────────────────────────────────────────────
REDIS_URL=https://<endpoint>.upstash.io
REDIS_TOKEN=<upstash-rest-token>

# ─── NextAuth ─────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=<separate-random-secret>

# ─── Google OAuth ─────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

# ─── Razorpay ─────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<razorpay-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>

# ─── Cloudinary ───────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# ─── Email (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=<app-password>
SMTP_FROM="Store <noreply@store.com>"

# ─── App ──────────────────────────────────────────────────────────────────────
APP_URL=http://localhost:3000
NODE_ENV=development
ADMIN_INVITE_TOKEN=<secret-token-for-first-admin-setup>
```

---

## 15. Known Error Fixes & Gotchas

### 15.1 "Cannot overwrite model once compiled" (Mongoose + Next.js HMR)

**Error:** `OverwriteModelError: Cannot overwrite 'User' model once compiled.`

**Fix:** Always use the guard pattern in every model file:

```typescript
const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export default User;
```

---

### 15.2 MongoDB Connection Leak in Serverless (Next.js API Routes)

**Error:** Too many open connections to MongoDB Atlas; requests timeout.

**Fix:** Use the global singleton pattern in `mongoose.ts` (shown in Section 4.1). Never call `mongoose.connect()` directly inside a route handler. Always call `await connectDB()`.

---

### 15.3 Mongoose ObjectId vs String Type Mismatch

**Error:** Queries return null even though the document exists because you passed a string where ObjectId is expected (or vice versa).

**Fix:**
```typescript
import mongoose from 'mongoose';

// When querying by ID from URL params (always string):
const doc = await Order.findById(new mongoose.Types.ObjectId(params.id));

// Or just use findById — it auto-casts strings to ObjectId:
const doc = await Order.findById(params.id); // this works too
```

**Do NOT do:**
```typescript
Order.findOne({ _id: params.id }) // may fail in edge cases — use findById instead
```

---

### 15.4 NextAuth v5 Session in API Routes

**Error:** `auth()` returns null in API route handlers even when user is logged in.

**Fix:** Import `auth` from the correct path:
```typescript
// CORRECT — in API route handlers
import { auth } from '@/lib/auth';
const session = await auth(); // server-side session

// NOT this — only for React Server Components
// import { useSession } from 'next-auth/react'; // client-side only
```

---

### 15.5 Razorpay `checkout.js` Hydration Error

**Error:** Hydration mismatch because Razorpay script modifies the DOM.

**Fix:** Load Razorpay script dynamically inside a `useEffect`, never via `<Script>` in layout:

```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  document.body.appendChild(script);
  return () => { document.body.removeChild(script); };
}, []);
```

---

### 15.6 BullMQ Worker Not Connecting to Upstash

**Error:** `ECONNREFUSED` or `ERR_SSL_WRONG_VERSION_NUMBER` when BullMQ connects to Upstash Redis.

**Fix:** Upstash requires TLS for BullMQ. Use `ioredis` with the Upstash URL format:

```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null, // required by BullMQ
});

export const emailQueue = new Queue('email', { connection });
```

---

### 15.7 Tailwind CSS v4 + Shadcn/UI Config Conflict

**Error:** Shadcn components lose styles or CSS variables don't apply in dark mode.

**Fix:** In Tailwind v4, configure CSS variables in `globals.css` using `@theme` block, not `tailwind.config.ts`:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(60% 0.2 264);
  --color-primary-foreground: oklch(98% 0 0);
  --radius-DEFAULT: 0.5rem;
}
```

And ensure `next-themes` `ThemeProvider` wraps the root layout with `attribute="class"`.

---

### 15.8 MongoDB Atlas Transactions Require Replica Set

**Error:** `Transaction numbers are only allowed on a replica set member or mongos` when using `startSession()`.

**Fix:** MongoDB Atlas free tier (M0) does NOT support transactions. Use **M10 or higher** for production, or use a local replica set in development via `docker-compose.yml`:

```yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:7
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  mongo-init:
    image: mongo:7
    depends_on: [mongodb]
    command: >
      bash -c "sleep 3 && mongosh --host mongodb:27017 --eval 'rs.initiate()'"
```

---

### 15.9 `next/image` with Cloudinary Loader — Hostname Not Configured

**Error:** `Error: Invalid src prop ... hostname "res.cloudinary.com" is not configured`.

**Fix:** Add to `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
};
```

---

### 15.10 Turbo Pipeline Not Running Backend Worker

**Error:** Running `turbo dev` only starts Next.js frontend; BullMQ workers never run.

**Fix:** Ensure `turbo.json` and root `package.json` define scripts correctly:

```json
// turbo.json
{
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"] },
    "lint": {},
    "test": {}
  }
}
```

```json
// backend/package.json
{
  "scripts": {
    "dev": "tsx watch src/worker.ts"
  }
}
```

---

### 15.11 Zod + React Hook Form Type Inference

**Error:** TypeScript errors when using `zodResolver` — type mismatch between form values and Zod schema.

**Fix:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type FormValues = z.infer<typeof schema>; // Always derive type from schema

const form = useForm<FormValues>({ resolver: zodResolver(schema) });
```

---

### 15.12 CORS Errors on Razorpay Webhook

**Error:** Razorpay webhook POST fails with CORS error.

**Fix:** Razorpay webhooks are server-to-server — CORS does not apply. The actual issue is usually the **body parser consuming the raw body** before signature verification.

```typescript
// In /api/webhooks/razorpay/route.ts — read raw body FIRST
export async function POST(req: Request) {
  const rawBody = await req.text(); // NOT req.json() — must be raw string for HMAC
  const signature = req.headers.get('x-razorpay-signature')!;
  // ... HMAC verification using rawBody
  const event = JSON.parse(rawBody);
}
```

---

### 15.13 Session Token Missing Role After Login

**Error:** `session.user.role` is undefined on the client even after successful login.

**Fix:** Extend the NextAuth session type in `types/next-auth.d.ts`:

```typescript
// frontend/src/types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
      status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    };
  }
}
```

---

### 15.14 React Query Devtools Bundle in Production

**Error:** Bundle analyzer shows `@tanstack/react-query-devtools` in production bundle.

**Fix:**
```typescript
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
    : () => null;
```

---

### 15.15 Mongoose `lean()` Breaks TypeScript Types

**Error:** Using `.lean()` returns `object` type instead of the document interface.

**Fix:** Use the typed lean helper:
```typescript
import { HydratedDocument } from 'mongoose';

const product = await Product.findById(id).lean<IProduct>();
// product is now typed as IProduct | null (without Mongoose document methods)
```

---

## 16. Coding Rules & Constraints

These rules are **non-negotiable**. Violating them introduces bugs, security holes, or breaks the monorepo architecture.

1. **No raw business logic in frontend route handlers.** All pricing, stock management, Razorpay HMAC verification, and order state transitions live in `backend/src/services/`. API routes are thin orchestrators that call services.

2. **No cross-workspace imports.** `frontend/` and `backend/` NEVER import from each other. Shared code goes in `shared/`.

3. **No `any` types.** TypeScript strict mode is enabled everywhere. Use `unknown` and narrow with Zod or type guards.

4. **No hardcoded secrets.** Every secret reads from `process.env`. Every new env var must be added to `.env.example` with a comment.

5. **No direct MongoDB operations in frontend components.** Even React Server Components must call API routes or server actions — never import models directly into a page component.

6. **Every mutating API route validates input with Zod first.** Return 400 with `VALIDATION_ERROR` and field-level errors before touching the database.

7. **Every payment or stock mutation uses a MongoDB session with transactions.**

8. **Every model file uses the `mongoose.models.X || mongoose.model` guard** to prevent HMR errors.

9. **All images use `next/image` with Cloudinary remote pattern.** Never use plain `<img>` tags.

10. **No `dangerouslySetInnerHTML` without DOMPurify.** Rich text from the database is always sanitized before render.

11. **Rate limiting on all auth and payment endpoints.** Use the Upstash Ratelimit middleware — do not skip it for "admin convenience."

12. **All status transitions create an AuditLog entry.** This includes: login, role change, order status change, payment status change, suspension.

13. **Webhook handlers must be idempotent.** Check `ProcessedWebhookEvent` before processing. Create the record atomically with processing.

14. **BullMQ jobs have `attempts: 3` and exponential backoff.** Failed jobs after all retries are logged to a dead-letter collection in MongoDB.

15. **Never log passwords, payment signatures, or Razorpay secrets.** Scrub these fields in any error logging middleware.

---

## 17. Deployment

### Vercel Configuration

```json
// vercel.json (at frontend/)
{
  "framework": "nextjs",
  "buildCommand": "cd .. && turbo build --filter=frontend",
  "outputDirectory": ".next",
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "REDIS_URL": "@redis-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

🔍 18. Full Codebase Analysis & Continuation Rules
18.1 Mandatory Initial Analysis

Before writing or modifying any code:

Analyze the entire monorepo:
frontend/
backend/
shared/
Trace full system flow:
Authentication → API → Services → Database → Payment → Orders → Admin → UI
Identify:
Broken flows
Missing implementations
Partially completed features
Type inconsistencies
Runtime risks

⚠️ DO NOT start coding before this analysis is complete.

18.2 Continue From Last Working State
Detect the latest implemented features in the codebase
Continue development from that point
DO NOT:
Restart implementation
Rewrite working modules
Change existing architecture

✔ Only extend and fix

🛠️ 19. Error Detection & Fixing Strategy
19.1 Fix All Existing Errors
TypeScript
Remove all any types
Fix strict mode issues
Ensure proper type inference (Zod आधारित types)
Mongoose
Fix model overwrite errors
Ensure correct ObjectId usage
Use singleton DB connection (connectDB())
API Layer
Validate all inputs using Zod
Ensure consistent response format
Fix incorrect route handling
Authentication
Fix session issues (NextAuth v5)
Ensure role & status propagation
Payment System
Fix Razorpay order creation
Fix verification logic (HMAC)
Fix webhook handling (raw body + idempotency)
Redis / BullMQ
Fix connection issues (TLS for Upstash)
Ensure workers are running correctly
Environment
Ensure all required .env variables exist
Remove hardcoded values
🧱 20. Architecture Enforcement (STRICT)

You MUST follow these rules:

❌ No business logic in frontend
✅ All logic in backend/src/services/
❌ No cross-imports between frontend/backend
✅ Shared logic only via shared/
❌ No direct DB access in UI components
✅ Always call connectDB() before DB usage
✅ Use transactions for:
Orders
Payments
Stock updates
🔄 21. Feature Completion Rules

Complete all missing or partial features:

21.1 Payment Flow
Create Order
Verify Payment
Webhook handling
Failure handling
21.2 Order System
Full lifecycle implementation
Status transitions
Stock management
21.3 Admin Panel
Product management
Order management
User control
21.4 Background Jobs
Email queue
Notification queue
Cleanup jobs
21.5 API Consistency
Uniform structure
Proper error handling
🛡️ 22. Stability & Production Safety

Ensure:

No runtime crashes
Proper try/catch in services
API response format consistency
Webhook idempotency
Rate limiting applied where required
🚫 23. Strict DO NOT Rules
DO NOT rewrite working modules
DO NOT change UI unnecessarily
DO NOT modify DB schema unless required
DO NOT introduce new architecture patterns
DO NOT bypass validation or transactions
🎯 24. Final Objective

The system must be:

Fully functional end-to-end
Error-free (TypeScript + Runtime)
Architecturally consistent
Production-ready
✅ Execution Summary
Analyze full codebase
Identify issues
Continue from last state
Fix errors
Complete missing features
Validate full system
Ensure production readiness

### Environment Variable Groups (Vercel Dashboard)
- **Development:** points to local MongoDB + Upstash dev instance
- **Preview:** points to MongoDB Atlas staging cluster
- **Production:** points to MongoDB Atlas production cluster (M10+)

### MongoDB Atlas Checklist
- [ ] Use M10+ cluster (required for transactions)
- [ ] Enable IP access list (add Vercel IP ranges or use 0.0.0.0/0 with auth)
- [ ] Enable database user with `readWrite` role on app database
- [ ] Enable connection string with `?retryWrites=true&w=majority`
- [ ] Enable Atlas Search index on `products` collection for full-text search

### Pre-Deploy Checklist
- [ ] Run `npx ts-node seed.ts` against production DB to create SUPER_ADMIN
- [ ] Verify all env vars are set in Vercel dashboard
- [ ] Run `turbo build` locally to catch TypeScript errors
- [ ] Verify Razorpay webhook URL is set to `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Verify Cloudinary upload presets are configured
- [ ] Run Lighthouse audit on production URL

---

*Last updated: See git log for latest revision.*
*Maintained by: The engineering team. Update this file when any architectural decision changes.*