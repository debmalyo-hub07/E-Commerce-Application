# StyleMart - Production-Grade E-Commerce Platform

A modern, full-stack e-commerce platform built with Next.js 15, TypeScript, Tailwind CSS v4, and PostgreSQL. Designed to compete with platforms like Flipkart and Amazon.

## 🚀 Features

### Frontend
- **Next.js 15** with App Router for optimal performance
- **TypeScript 5** for type safety
- **Tailwind CSS v4** with design token system
- **Framer Motion 11** for smooth animations
- **Shadcn/UI v2** component library
- **React Query v5** for server state management
- **Zustand** for global client state
- **React Hook Form + Zod** for form validation
- **next/image** with Cloudinary loader
- **next-themes** for dark/light mode

### Backend
- **Next.js Route Handlers** (API routes)
- **Prisma ORM v6** with PostgreSQL 16 on Supabase
- **Redis (Upstash)** for caching and rate limiting
- **BullMQ** for background job queues
- **Nodemailer** with React Email templates
- **Cloudinary SDK** for media management
- **Razorpay Node.js SDK** for payments

### Core Functionality
- 🔐 **Authentication & Authorization**: NextAuth.js v5 with Email/Password, Google OAuth, RBAC (SUPER_ADMIN, ADMIN, CUSTOMER)
- 💳 **Payment System**: Razorpay integration with webhook handling, refunds, and Cash on Delivery
- 🛒 **Shopping Cart & Checkout**: Full cart management, coupon system, multi-step checkout
- 📦 **Order Management**: Order tracking, status updates, cancellation, refunds
- 👥 **Admin Dashboard**: Real-time analytics, product/order/user management
- 📱 **Responsive Design**: Mobile-first, premium UI/UX
- 🔒 **Security**: HTTP security headers, input validation, CSRF protection, rate limiting
- 📈 **SEO Optimized**: Dynamic metadata, sitemap, JSON-LD structured data

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin routes (protected)
│   │   ├── account/           # Customer account area
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── payment/       # Payment endpoints
│   │   │   └── webhooks/      # Webhook handlers
│   │   ├── privacy-policy/    # Compliance pages
│   │   └── terms/             # Terms & Conditions
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/UI components
│   │   ├── layout/           # Layout components
│   │   └── product/          # Product components
│   ├── lib/                  # Utilities and config
│   │   ├── auth/             # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Helper functions
│   └── store/                # Zustand stores
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

## 📦 Database Schema

The PostgreSQL database includes the following core tables:

- `users` - User accounts with roles and status
- `products` - Product catalog with variants
- `categories` - Product categorization
- `orders` - Order records with status tracking
- `order_items` - Individual order items
- `payments` - Payment transactions
- `addresses` - User address book
- `reviews` - Product reviews
- `coupons` - Discount coupons
- `cart_items` - Shopping cart
- `wishlists` - User wishlists
- `audit_logs` - Security audit trail
- `notifications` - User notifications

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 16+ (or Supabase account)
- Redis (or Upstash account)
- Cloudinary account
- Razorpay account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and fill in your values:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
DIRECT_URL="postgresql://user:password@localhost:5432/ecommerce"

# Redis
REDIS_URL="redis://localhost:6379"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Authentication
NEXTAUTH_SECRET="your-secret-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# SMTP (Email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@stylemart.com"

# Application
APP_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
ADMIN_INVITE_TOKEN="super-secret-invite-token"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with initial data
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🚀 Deployment

### Vercel Deployment
1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Vercel
Add all environment variables from `.env.example` to your Vercel project settings.

### Database Migration on Vercel
```bash
# Add build command to generate Prisma client
npx prisma generate

# Add post-build command to run migrations
npx prisma migrate deploy
```

### Supabase Configuration
- Use connection pooling with PgBouncer
- Set `DIRECT_URL` for migrations and `DATABASE_URL` for runtime
- Enable Row Level Security (RLS) as needed

## 📊 Performance Optimization

- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Cloudinary transformations with next/image
- **Caching Strategy**: Redis for product listings, categories, homepage
- **Bundle Analysis**: `@next/bundle-analyzer` to keep chunks under 200KB
- **Lighthouse Targets**: Performance 95+, Accessibility 95+, SEO 100

## 🔒 Security

- **HTTP Headers**: CSP, X-Frame-Options, HSTS, etc.
- **Input Validation**: Zod schemas for all API endpoints
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: DOMPurify for rich text content
- **Rate Limiting**: Upstash Redis rate limiting on API routes
- **Authentication**: NextAuth.js with bcrypt hashing, JWT tokens

## 📈 SEO

- Dynamic metadata with `generateMetadata`
- Automatic sitemap generation at `/sitemap.xml`
- JSON-LD structured data (Product, BreadcrumbList, Organization)
- OpenGraph and Twitter card tags
- Semantic HTML with proper heading hierarchy

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📁 Project Structure Details

### API Routes
All API routes follow a consistent response format:
```json
{
  "success": boolean,
  "data": T | null,
  "error": string | null,
  "meta": { "page", "limit", "total" }
}
```

### Component Library
Components are built using Shadcn/UI primitives with custom design tokens. Each component is accessible (ARIA labels, keyboard navigation, focus rings).

### State Management
- **Server State**: React Query for data fetching, caching, synchronization
- **Client State**: Zustand for UI state (cart, theme, modals)
- **Form State**: React Hook Form with Zod validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🆘 Support

For support, email support@stylemart.com or join our Slack community.

---

**Built with ❤️ by the StyleMart Team**
