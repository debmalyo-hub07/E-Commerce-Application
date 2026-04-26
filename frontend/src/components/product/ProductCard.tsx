"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { computeFinalPrice } from "@/lib/utils";
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  imageUrl?: string;
  sellingPrice: number;
  gstPercent: number;
  discountPercent: number;
  stockQuantity: number;
  categoryName?: string;
  averageRating?: number;
  reviewsCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  variants?: Array<{ id: string; name: string; value: string; price_modifier: number; stock: number }>;
  index?: number; // for stagger animation
}

export function ProductCard({
  id,
  name,
  slug,
  brand,
  imageUrl,
  sellingPrice,
  gstPercent,
  discountPercent,
  stockQuantity,
  categoryName,
  averageRating = 0,
  reviewsCount = 0,
  isNew,
  isFeatured,
  variants = [],
  index = 0,
}: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => { setMounted(true); }, []);

  const finalPrice = computeFinalPrice(sellingPrice, gstPercent, discountPercent);
  const savings = sellingPrice - finalPrice / (1 + gstPercent / 100);
  const savingsPercent = Math.round((savings / sellingPrice) * 100);
  const isOutOfStock = stockQuantity === 0;
  const inWishlist = mounted ? isInWishlist(id) : false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAddingToCart) return;

    setIsAddingToCart(true);
    addToCart({
      product: { id, name, slug, imageUrl, brand: brand ?? undefined },
      quantity: 1,
      unitPrice: sellingPrice,
      gstPercent,
      discountPercent,
      finalPrice,
    });

    setIsAddedToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      setIsAddedToCart(false);
    }, 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id, name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <Link href={`/products/${slug}`} className="block h-full">
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(124,58,237,0.15)] hover:border-primary/40 transition-all duration-500 h-full flex flex-col relative z-10 group-hover:z-20 bg-gradient-to-b from-card to-card/50">
          
          {/* Subtle Glow Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Image Container */}
          <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
            {imageUrl ? (
              <OptimizedProductImage
                src={imageUrl}
                alt={name}
                productName={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/20">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/20" />
              </div>
            )}
            
            {/* Gradient Overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {isNew && (
                <span className="px-2.5 py-1 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-lg shadow-emerald-500/30">
                  NEW
                </span>
              )}
              {savingsPercent > 0 && (
                <span className="px-2.5 py-1 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-lg shadow-rose-500/30">
                  {savingsPercent}% OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="px-2.5 py-1 bg-slate-800/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-lg shadow-black/30">
                  SOLD OUT
                </span>
              )}
              {isFeatured && !isNew && (
                <span className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-white" /> HOT
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <motion.button
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-20 overflow-hidden ${
                inWishlist
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : "bg-white/80 dark:bg-black/60 backdrop-blur-md text-foreground hover:text-rose-500 border border-white/20 dark:border-white/10"
              }`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-4 h-4 transition-all duration-300 ${inWishlist ? "fill-white" : ""}`}
              />
            </motion.button>

            {/* Quick View Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20 w-3/4">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground border border-white/20 dark:border-white/10 shadow-xl transition-colors">
                <Eye className="w-4 h-4" /> Quick View
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-5 flex flex-col flex-1 relative z-10">
            <div className="mb-2">
              {(brand || categoryName) && (
                <p className="text-[10px] text-muted-foreground/80 uppercase tracking-widest font-bold mb-1.5 line-clamp-1">
                  {brand ?? categoryName}
                </p>
              )}
              <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
                {name}
              </h3>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Rating */}
            {reviewsCount > 0 ? (
              <div className="flex items-center gap-1.5 mb-3 mt-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(averageRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/20 fill-muted-foreground/10"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                  {averageRating.toFixed(1)} ({reviewsCount})
                </span>
              </div>
            ) : (
              <div className="h-6 mb-3 mt-1" /> // Spacer if no rating
            )}

            {/* Price & Action */}
            <div className="flex items-end justify-between gap-2 mt-auto pt-4 border-t border-border/40">
              <div className="flex flex-col">
                {savingsPercent > 0 && (
                  <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50 mb-0.5 font-medium">
                    ₹{sellingPrice.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-lg font-black text-foreground tracking-tight">
                  ₹{finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md flex-shrink-0 relative overflow-hidden ${
                  isOutOfStock
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : isAddedToCart
                    ? "bg-emerald-500 text-white shadow-emerald-500/30"
                    : "bg-primary text-primary-foreground hover:shadow-primary/40 group-hover:scale-110"
                }`}
              >
                {isAddedToCart ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-emerald-500 flex items-center justify-center">
                    <span className="text-xl font-bold">✓</span>
                  </motion.div>
                ) : (
                  <ShoppingCart className="w-4 h-4 relative z-10" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
