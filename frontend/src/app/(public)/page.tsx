import { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Review from "@/models/Review";
import { HeroSection } from "@/components/layout/Hero";
import { TrustBadgesSection } from "@/components/layout/TrustBadgesSection";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import { ArrowRight, Zap, Monitor, Shirt, Sofa, Sparkles, Dumbbell, BookOpen, Baby, ShoppingBag } from "lucide-react";
import { MotionDiv, MotionSpan, MotionH2, MotionP } from "@/components/common/Motion";

export const metadata: Metadata = {
  title: "NexMart — Premium Fashion, Electronics & Lifestyle",
  description: "Discover millions of products at the best prices. Free delivery on orders above ₹1,000. Secure payments. Easy returns.",
};

export const dynamic = "force-dynamic";


function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NexMart",
    "url": process.env.APP_URL ?? "https://nexmart.in",
    "logo": `${process.env.APP_URL}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "1800-NEX-MART",
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
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <MotionSpan 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block"
                >
                  Collections
                </MotionSpan>
                <h2 className="font-outfit text-3xl sm:text-4xl font-black tracking-[-0.03em]">Shop by Category</h2>
              </div>
              <Link
                href="/products"
                className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-5 py-2.5 rounded-xl"
              >
                All categories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat, i) => {
                const iconMap: Record<string, React.ElementType> = {
                  "Electronics": Monitor,
                  "Fashion": Shirt,
                  "Home & Kitchen": Sofa,
                  "Beauty & Personal Care": Sparkles,
                  "Beauty & Health": Sparkles,
                  "Sports": Dumbbell,
                  "Sports & Fitness": Dumbbell,
                  "Books": BookOpen,
                  "Books & Media": BookOpen,
                  "Toys & Baby": Baby,
                };
                const IconComponent = iconMap[cat.name] || ShoppingBag;
                const colorMap: Record<string, string> = {
                  "Electronics": "from-blue-500/20 to-cyan-500/10",
                  "Fashion": "from-pink-500/20 to-rose-500/10",
                  "Home & Kitchen": "from-amber-500/20 to-orange-500/10",
                  "Beauty & Personal Care": "from-purple-500/20 to-violet-500/10",
                  "Beauty & Health": "from-purple-500/20 to-violet-500/10",
                  "Sports": "from-emerald-500/20 to-green-500/10",
                  "Sports & Fitness": "from-emerald-500/20 to-green-500/10",
                  "Books": "from-indigo-500/20 to-blue-500/10",
                  "Books & Media": "from-indigo-500/20 to-blue-500/10",
                  "Toys & Baby": "from-yellow-500/20 to-amber-500/10",
                };
                const iconColorMap: Record<string, string> = {
                  "Electronics": "text-blue-500",
                  "Fashion": "text-pink-500",
                  "Home & Kitchen": "text-amber-500",
                  "Beauty & Personal Care": "text-purple-500",
                  "Beauty & Health": "text-purple-500",
                  "Sports": "text-emerald-500",
                  "Sports & Fitness": "text-emerald-500",
                  "Books": "text-indigo-500",
                  "Books & Media": "text-indigo-500",
                  "Toys & Baby": "text-yellow-500",
                };
                const gradientBg = colorMap[cat.name] || "from-primary/20 to-primary/10";
                const iconColor = iconColorMap[cat.name] || "text-primary";

                return (
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    key={cat._id.toString()}
                  >
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="group flex flex-col items-center gap-4 p-6 bg-card border border-border/50 rounded-3xl hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientBg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <IconComponent className={`w-7 h-7 ${iconColor} transition-transform duration-300`} />
                      </div>
                      <span className="text-sm font-bold text-center leading-tight group-hover:text-primary transition-colors relative z-10">
                        {cat.name}
                      </span>
                    </Link>
                  </MotionDiv>
                );
              })}
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <MotionSpan 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block"
                >
                  Editor&apos;s Pick
                </MotionSpan>
                <h2 className="font-outfit text-3xl sm:text-4xl font-black tracking-[-0.03em]">Featured Products</h2>
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

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2.5rem] dark-section p-10 md:p-14 shadow-2xl shadow-black/30 group transform-gpu"
          >
            {/* Background layers */}
            <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
            <MotionDiv 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-[100px] pointer-events-none" 
            />
            <MotionDiv 
              animate={{ rotate: -360, scale: [1, 1.2, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" 
            />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <MotionDiv 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-5"
                >
                  <div className="p-2 bg-yellow-400/15 rounded-xl backdrop-blur-md border border-yellow-400/20">
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
                  className="font-outfit text-4xl md:text-5xl font-black mb-5 tracking-[-0.03em] leading-tight text-white"
                >
                  Up to 60% Off <br/><span className="text-gradient-gold">Premium Tech & Style</span>
                </MotionH2>
                <MotionP 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/50 mb-8 text-lg font-medium leading-relaxed"
                >
                  Limited time offer on premium products across all categories. Use code{" "}
                  <span className="inline-block px-3 py-1 glass-card-elevated rounded-lg font-black text-white mx-1 text-sm">WELCOME20</span> for an extra 20% off!
                </MotionP>
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-4"
                >
                  <Link
                    href="/products?sale=true"
                    className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl hover:scale-[1.03] transition-all duration-300 shadow-lg shadow-indigo-500/25"
                  >
                    Shop Flash Sale 
                    <span className="bg-white/20 p-1.5 rounded-lg group-hover/btn:bg-white/30 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </MotionDiv>
              </div>
              
              {/* Stats grid */}
              <div className="hidden md:grid grid-cols-2 gap-4 w-72 flex-shrink-0">
                {[
                  { value: "60%", label: "Max Discount" },
                  { value: "5K+", label: "Products on Sale" },
                  { value: "48h", label: "Time Left" },
                  { value: "Free", label: "Shipping" },
                ].map((stat, i) => (
                  <MotionDiv
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="glass-card rounded-2xl p-5 text-center hover:bg-white/[0.08] transition-colors"
                  >
                    <p className="text-2xl font-black text-gradient-gold">{stat.value}</p>
                    <p className="text-white/40 text-xs font-medium mt-1">{stat.label}</p>
                  </MotionDiv>
                ))}
              </div>
            </div>
          </MotionDiv>
        </section>

        {newArrivals.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <MotionSpan 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block"
                >
                  Fresh Additions
                </MotionSpan>
                <h2 className="font-outfit text-3xl sm:text-4xl font-black tracking-[-0.03em]">New Arrivals</h2>
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
