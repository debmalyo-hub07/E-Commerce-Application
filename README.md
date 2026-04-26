# 🛍️ StyleMart - Premium E-Commerce Ecosystem

![StyleMart Banner](./stylemart_banner.png)

## ✨ Overview

**StyleMart** is a state-of-the-art, full-stack e-commerce solution designed for modern businesses. Built with a focus on high performance, premium aesthetics, and robust scalability, StyleMart delivers a seamless shopping experience for customers and a powerful management interface for administrators.

> [!IMPORTANT]
> This project has undergone a massive UI/UX overhaul, featuring glassmorphism design, smooth 3D animations, and a completely restructured administrative backend.

---

## 🚀 Key Features

### 🛒 Storefront
- **Dynamic Product Catalog**: Real-time filtering and sorting with optimized image loading.
- **Premium UI/UX**: Built with Framer Motion for delightful micro-interactions and smooth transitions.
- **Smart Cart & Checkout**: Integrated with Razorpay for secure and frictionless transactions.
- **Wishlist & User Accounts**: Personalized experience with OTP-based secure authentication.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewports.

### 🔐 Administration
- **Advanced Dashboard**: Real-time analytics and business insights.
- **Product Management**: Comprehensive CRUD operations with multi-category support.
- **Order Tracking**: Full lifecycle management of customer orders and refunds.
- **Coupon System**: Flexible discount management to drive sales.
- **User Control**: Granular control over customer accounts and permissions.

### 🛠️ Technical Excellence
- **Hybrid Architecture**: Next.js 15 for the frontend and a robust Node.js/Express backend.
- **Type Safety**: End-to-end TypeScript integration.
- **Real-time Engine**: Redis-backed background jobs for notifications and cleanup.
- **Cloud Integration**: Cloudinary for high-performance asset management.
- **Database**: Scalable MongoDB integration with Mongoose.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15, React 19, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB, Mongoose |
| **Caching/Jobs** | Redis, BullMQ |
| **Payments** | Razorpay |
| **Storage** | Cloudinary |
| **Auth** | NextAuth.js, JWT, OTP (Gmail) |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Redis
- Cloudinary & Razorpay API Keys

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/debmalyo-hub07/E-Commerce-Application.git
   cd E-Commerce-Application
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env # Update your credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local # Update your credentials
   npm run dev
   ```

---

## 📸 Screenshots

*Coming Soon...*

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/debmalyo-hub07">Debmalyo Barman</a>
</p>
