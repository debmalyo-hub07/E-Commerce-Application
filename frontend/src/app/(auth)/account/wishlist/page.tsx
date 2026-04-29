"use client";

import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFetchWishlist } from "@/hooks/useWishlist";
import ProductGrid from "@/components/product/ProductGrid";

export default function WishlistPage() {
  const { data: session } = useSession();
  const query = useFetchWishlist(!!session?.user);

  const isLoading = query.isLoading;
  const items = query.data?.data || [];
  
  const products = items
    .map((item: any) => item.productId)
    .filter((product: any) => product && typeof product === "object");

  const formattedProducts = products.map((product: any) => {
    const primaryImage = product.images?.find((img: any) => img.isPrimary) ?? product.images?.[0];
    const category = product.categoryId;

    return {
      id: product._id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      sellingPrice: product.sellingPrice,
      discountPercent: product.discountPercent,
      gstPercent: product.gstPercent,
      imageUrl: primaryImage?.url || "",
      categoryName: category?.name ?? "",
      averageRating: product.averageRating || 0,
      reviewsCount: product.reviewsCount || 0,
      stockQuantity: product.stockQuantity,
      hasVariants: (product.variants?.length ?? 0) > 0,
    };
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shadow-inner shadow-rose-500/20">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          </div>
          My Wishlist
        </h1>
        {formattedProducts.length > 0 && (
          <span className="px-4 py-1.5 bg-muted text-muted-foreground text-sm font-bold tracking-widest uppercase rounded-full">
            {formattedProducts.length} ITEM{formattedProducts.length !== 1 ? "S" : ""}
          </span>
        )}
      </div>
      
      {formattedProducts.length === 0 ? (
        <div className="bg-card rounded-3xl shadow-sm border border-border/50 p-16 text-center flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner relative z-10">
            <Heart className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Save items you love to your wishlist. Review them anytime and easily move them to your cart.
          </p>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 relative z-10"
          >
            Start Browsing
          </Link>
        </div>
      ) : (
        <div className="-mx-2">
          <ProductGrid products={formattedProducts} />
        </div>
      )}
    </div>
  );
}
