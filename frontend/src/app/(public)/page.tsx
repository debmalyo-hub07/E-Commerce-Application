import { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Review from "@/models/Review";
import { HeroSection } from "@/components/layout/Hero";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Truck, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "StyleMart — Premium Fashion, Electronics & Lifestyle",
  description: "Discover millions of products at the best prices. Free delivery on orders above ₹1,000. Secure payments. Easy returns.",
};

function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StyleMart",
    "url": process.env.APP_URL ?? "https://stylemart.in",
    "logo": `${process.env.APP_URL}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "1800-STYLE-MRT",
      "contactType": "customer service",
    },
  };
}

async function getFeaturedProducts() {
  await connectDB();
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate("categoryId", "name slug")
    .sort({ updatedAt: -1 })
    .limit(8)
    .lean();

  const productIds = products.map((p) => p._id);
  const reviews = await Review.aggregate([
    { $match: { productId: { $in: productIds }, isApproved: true } },
    { $group: { _id: "$productId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const reviewMap = new Map(reviews.map((r) => [r._id.toString(), r]));

  return products.map((p) => ({
    ...p,
    category: p.categoryId as unknown as { name: string; slug: string },
    reviewData: reviewMap.get(p._id.toString()),
  }));
}

async function getCategories() {
  await connectDB();
  return Category.find({ isActive: true, parentId: null })
    .sort({ name: 1 })
    .limit(6)
    .lean();
}

async function getNewArrivals() {
  await connectDB();
  const products = await Product.find({ isActive: true })
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const productIds = products.map((p) => p._id);
  const reviews = await Review.aggregate([
    { $match: { productId: { $in: productIds }, isApproved: true } },
    { $group: { _id: "$productId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const reviewMap = new Map(reviews.map((r) => [r._id.toString(), r]));

  return products.map((p) => ({
    ...p,
    category: p.categoryId as unknown as { name: string; slug: string },
    reviewData: reviewMap.get(p._id.toString()),
  }));
}

const trustBadges = [
  { icon: Truck, title: "Free Delivery", desc: "On orders above ₹1,000" },
  { icon: Shield, title: "Secure Payments", desc: "100% safe & encrypted" },
  { icon: RefreshCw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Zap, title: "Fast Shipping", desc: "1–3 business days" },
];

export default async function HomePage() {
  const [featuredProducts, categories, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getNewArrivals(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationJsonLd()) }}
      />

      <div className="min-h-screen">
        <HeroSection />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Shop by Category</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Discover products across {categories.length}+ categories
                </p>
              </div>
              <Link
                href="/products"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                All categories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat._id.toString()}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors">
                    {cat.name === "Electronics" ? "📱" :
                     cat.name === "Fashion" ? "👗" :
                     cat.name === "Home & Kitchen" ? "🏠" :
                     cat.name === "Sports" ? "⚽" :
                     cat.name === "Books" ? "📚" : "🛒"}
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Featured Products</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Hand-picked by our experts
                </p>
              </div>
              <Link
                href="/products?featured=true"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.map((product, index) => {
                const avgRating = product.reviewData?.avgRating ?? 0;
                const reviewsCount = product.reviewData?.count ?? 0;
                const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
                return (
                  <ProductCard
                    key={product._id.toString()}
                    id={product._id.toString()}
                    name={product.name}
                    slug={product.slug}
                    brand={product.brand}
                    imageUrl={primaryImage?.url}
                    sellingPrice={product.sellingPrice}
                    gstPercent={product.gstPercent}
                    discountPercent={product.discountPercent}
                    stockQuantity={product.stockQuantity}
                    categoryName={product.category?.name}
                    averageRating={Number(avgRating.toFixed(1))}
                    reviewsCount={reviewsCount}
                    isFeatured={product.isFeatured}
                    index={index}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-purple-600 to-accent p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-bold text-yellow-300 uppercase tracking-wide">
                  Flash Sale
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Up to 60% Off</h2>
              <p className="text-white/80 mb-6 max-w-md">
                Limited time offer on premium products across all categories. Use code{" "}
                <span className="font-bold text-yellow-300">WELCOME20</span> for extra 20% off!
              </p>
              <Link
                href="/products?sale=true"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/5" />
          </div>
        </section>

        {newArrivals.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">New Arrivals</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Just in — the freshest additions
                </p>
              </div>
              <Link
                href="/products?sort=newest"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                See all new <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {newArrivals.map((product, index) => {
                const avgRating = product.reviewData?.avgRating ?? 0;
                const reviewsCount = product.reviewData?.count ?? 0;
                const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
                return (
                  <ProductCard
                    key={product._id.toString()}
                    id={product._id.toString()}
                    name={product.name}
                    slug={product.slug}
                    brand={product.brand}
                    imageUrl={primaryImage?.url}
                    sellingPrice={product.sellingPrice}
                    gstPercent={product.gstPercent}
                    discountPercent={product.discountPercent}
                    stockQuantity={product.stockQuantity}
                    categoryName={product.category?.name}
                    averageRating={Number(avgRating.toFixed(1))}
                    reviewsCount={reviewsCount}
                    isNew={true}
                    index={index}
                  />
                );
              })}
            </div>
          </section>
        )}

        {featuredProducts.length === 0 && newArrivals.length === 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
            <p className="text-4xl mb-4">🚀</p>
            <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-muted-foreground">
              Products are being loaded. Run <code className="bg-muted px-2 py-1 rounded text-xs">npm run db:seed</code> to add sample data.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
