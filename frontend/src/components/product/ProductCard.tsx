"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star, Eye, Zap } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { computeFinalPrice } from "@/lib/utils";

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

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const finalPrice = computeFinalPrice(sellingPrice, gstPercent, discountPercent);
  const savings = sellingPrice - finalPrice / (1 + gstPercent / 100);
  const savingsPercent = Math.round((savings / sellingPrice) * 100);
  const isOutOfStock = stockQuantity === 0;
  const inWishlist = isInWishlist(id);

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link href={`/products/${slug}`} className="block">
        <div className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {isNew && (
                <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full">
                  NEW
                </span>
              )}
              {savingsPercent > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {savingsPercent}% OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="px-2 py-1 bg-gray-500 text-white text-[10px] font-bold rounded-full">
                  OUT OF STOCK
                </span>
              )}
              {isFeatured && !isNew && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> HOT
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                inWishlist
                  ? "bg-red-500 text-white"
                  : "bg-background/90 text-muted-foreground hover:text-red-500 backdrop-blur-sm"
              }`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className="w-4 h-4"
                fill={inWishlist ? "currentColor" : "none"}
              />
            </motion.button>

            {/* Quick View on hover */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium hover:bg-background border border-border shadow-md whitespace-nowrap">
                <Eye className="w-3 h-3" /> Quick View
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            {(brand || categoryName) && (
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
                {brand ?? categoryName}
              </p>
            )}
            <h3 className="text-sm font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {name}
            </h3>

            {/* Rating */}
            {reviewsCount > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(averageRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviewsCount.toLocaleString()})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold text-primary">
                ₹{finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              {savingsPercent > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{sellingPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Add to Cart Button — morphs on click */}
            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : isAddedToCart
                  ? "bg-green-500 text-white"
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock
                ? "Out of Stock"
                : isAddedToCart
                ? "Added to Cart!"
                : "Add to Cart"}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
