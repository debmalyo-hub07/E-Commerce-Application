import { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Review from "@/models/Review";
import { HeroSection } from "@/components/layout/Hero";
import { TrustBadgesSection } from "@/components/layout/TrustBadgesSection";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { MotionDiv, MotionSpan, MotionH2, MotionP } from "@/components/common/Motion";

export const metadata: Metadata = {
  title: "StyleMart — Premium Fashion, Electronics & Lifestyle",
  description: "Discover millions of products at the best prices. Free delivery on orders above ₹1,000. Secure payments. Easy returns.",
};

export const dynamic = "force-dynamic";


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

        {/* Trust Badges Section with improved design */}
        <TrustBadgesSection />

        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <MotionSpan 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-primary font-bold tracking-widest text-sm uppercase mb-2 block"
                >
                  Collections
                </MotionSpan>
                <h2 className="text-3xl font-black tracking-tight">Shop by Category</h2>
              </div>
              <Link
                href="/products"
                className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl"
              >
                All categories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={cat._id.toString()}
                >
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="group flex flex-col items-center gap-3 p-6 bg-card border border-border/50 rounded-3xl hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                      {cat.name === "Electronics" ? "💻" :
                       cat.name === "Fashion" ? "👗" :
                       cat.name === "Home & Kitchen" ? "🛋️" :
                       cat.name === "Beauty & Health" ? "✨" :
                       cat.name === "Sports" ? "🎾" :
                       cat.name === "Books & Media" ? "📚" :
                       cat.name === "Toys & Baby" ? "🧸" : "🛒"}
                    </div>
                    <span className="text-sm font-bold text-center leading-tight group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                </MotionDiv>
              ))}
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <MotionSpan 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-primary font-bold tracking-widest text-sm uppercase mb-2 block"
                >
                  Editor's Pick
                </MotionSpan>
                <h2 className="text-3xl font-black tracking-tight">Featured Products</h2>
              </div>
              <Link
                href="/products?featured=true"
                className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl"
              >
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-violet-600 via-indigo-600 to-primary p-10 md:p-14 text-white shadow-2xl shadow-indigo-500/20 group transform-gpu"
          >
            {/* Animated Background Elements */}
            <MotionDiv 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl pointer-events-none" 
            />
            <MotionDiv 
              animate={{ rotate: -360, scale: [1, 1.2, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-gradient-to-tr from-purple-400/30 to-transparent blur-2xl pointer-events-none" 
            />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <MotionDiv 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <div className="p-2 bg-yellow-400/20 rounded-xl backdrop-blur-md">
                    <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  </div>
                  <span className="text-sm font-black text-yellow-300 uppercase tracking-widest">
                    Flash Sale Ends Soon
                  </span>
                </MotionDiv>
                <MotionH2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight"
                >
                  Up to 60% Off <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">Premium Tech & Style</span>
                </MotionH2>
                <MotionP 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 mb-8 text-lg font-medium leading-relaxed"
                >
                  Limited time offer on premium products across all categories. Use code{" "}
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg font-black text-white shadow-inner mx-1 border border-white/30">WELCOME20</span> for an extra 20% off!
                </MotionP>
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link
                    href="/products?sale=true"
                    className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-yellow-300 hover:text-indigo-900 hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10"
                  >
                    Shop Flash Sale 
                    <MotionSpan 
                      group-hover={{ x: 5 }}
                      className="bg-indigo-50 p-1.5 rounded-full"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </MotionSpan>
                  </Link>
                </MotionDiv>
              </div>
              
              {/* Optional 3D Element/Image could go here */}
              <div className="hidden md:block w-64 h-64 relative perspective-1000">
                <MotionDiv 
                  animate={{ rotateY: [0, 10, -10, 0], rotateX: [0, 5, -5, 0], y: [-10, 10, -10] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full bg-gradient-to-tr from-white/10 to-white/30 backdrop-blur-xl rounded-[3rem] border border-white/40 shadow-2xl flex items-center justify-center transform-style-3d"
                >
                  <span className="text-8xl shadow-sm drop-shadow-2xl">🛍️</span>
                </MotionDiv>
              </div>
            </div>
          </MotionDiv>
        </section>

        {newArrivals.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <MotionSpan 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-primary font-bold tracking-widest text-sm uppercase mb-2 block"
                >
                  Fresh Additions
                </MotionSpan>
                <h2 className="text-3xl font-black tracking-tight">New Arrivals</h2>
              </div>
              <Link
                href="/products?sort=newest"
                className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl"
              >
                See all new <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
