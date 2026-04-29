import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProductDetailsClient } from "./ProductDetailsClient";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Review from "@/models/Review";
import { computeFinalPrice, formatCurrency, formatDate } from "@/lib/utils";
import { Star, Shield, Truck, RotateCcw } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const product = await Product.findOne({ slug }).lean();

  if (!product) return { title: "Product Not Found" };

  const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
  return {
    title: product.name,
    description: product.description || `Buy ${product.name} at NexMart`,
    openGraph: {
      images: primaryImage?.url ? [primaryImage.url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  await connectDB();
  const { slug } = await params;

  const product = await Product.findOne({ slug, isActive: true })
    .populate("categoryId", "name slug")
    .lean();

  if (!product) {
    notFound();
  }

  const reviews = await Review.find({ productId: product._id, isApproved: true })
    .populate("userId", "name avatarUrl")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const ratings = reviews.map((r) => r.rating);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const finalPrice = computeFinalPrice(
    product.sellingPrice,
    product.gstPercent,
    product.discountPercent
  );

  const category = product.categoryId as unknown as { name: string; slug: string };

  const productData = {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    brand: product.brand ?? null,
    sellingPrice: product.sellingPrice,
    gstPercent: product.gstPercent,
    discountPercent: product.discountPercent,
    finalPrice,
    stockQuantity: product.stockQuantity,
    images: product.images?.map((img) => img.url) ?? [],
    variants: product.variants?.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      value: v.value,
      price_modifier: v.priceModifier,
      stock: v.stock,
    })) ?? [],
    rating: Number(avgRating.toFixed(1)),
    reviewsCount: ratings.length,
    categoryName: category?.name ?? "",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <nav className="flex text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${category?.slug}`} className="hover:text-foreground transition-colors">{category?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <ProductDetailsClient product={productData} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 py-8 border-y border-border">
        <div className="flex items-center gap-3 justify-center text-center sm:text-left sm:justify-start">
          <Truck className="w-8 h-8 text-primary" />
          <div>
            <h4 className="font-semibold text-sm">Free Delivery</h4>
            <p className="text-xs text-muted-foreground">On orders over ₹1,000</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center text-center sm:text-left sm:justify-start">
          <RotateCcw className="w-8 h-8 text-primary" />
          <div>
            <h4 className="font-semibold text-sm">7 Days Return</h4>
            <p className="text-xs text-muted-foreground">Easy returns policy</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center text-center sm:text-left sm:justify-start">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h4 className="font-semibold text-sm">Secure Payment</h4>
            <p className="text-xs text-muted-foreground">100% encrypted transactions</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Product Description</h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            {product.description ? (
               <div dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p>No description available.</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => {
                const user = review.userId as unknown as { name: string; avatarUrl?: string };
                return (
                  <div key={review._id.toString()} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted border-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    {review.title && <h4 className="text-sm font-semibold mb-1">{review.title}</h4>}
                    {review.body && <p className="text-sm text-muted-foreground mb-2">{review.body}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      {user?.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} width={20} height={20} className="rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {user?.name?.[0] ?? "?"}
                        </div>
                      )}
                      <span>{user?.name ?? "Anonymous"}</span>
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
