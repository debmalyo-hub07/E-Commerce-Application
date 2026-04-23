"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, Package, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface ProductDetailsClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    brand: string | null;
    sellingPrice: number;
    gstPercent: number;
    discountPercent: number;
    finalPrice: number;
    stockQuantity: number;
    images: string[];
    variants: Array<{
      id: string;
      name: string;
      value: string;
      price_modifier: number;
      stock: number;
    }>;
    rating: number;
    reviewsCount: number;
    categoryName: string;
  };
}

export function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.length > 0 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  // Computed values based on variant
  const currentPrice = selectedVariant 
    ? product.sellingPrice + selectedVariant.price_modifier 
    : product.sellingPrice;
  const currentFinalPrice = selectedVariant
    ? product.finalPrice + selectedVariant.price_modifier * (1 - product.discountPercent/100) * (1 + product.gstPercent/100)
    : product.finalPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stockQuantity;
  const isOutOfStock = currentStock <= 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addToCart({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.images[0],
        brand: product.brand || undefined,
      },
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        value: selectedVariant.value,
        price_modifier: selectedVariant.price_modifier
      } : undefined,
      quantity,
      unitPrice: currentPrice,
      gstPercent: product.gstPercent,
      discountPercent: product.discountPercent,
      finalPrice: currentFinalPrice,
    });
    
    openCart();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Image Gallery */}
      <div className="flex flex-col-reverse sm:flex-row gap-4">
        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all",
                  activeImage === idx ? "border-primary" : "border-border hover:border-primary/50"
                )}
              >
                <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted border border-border">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {product.images[activeImage] ? (
                <Image
                  src={product.images[activeImage]}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          <button
            onClick={() => toggleWishlist(product.id, product.name)}
            className={cn(
              "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
              inWishlist ? "bg-red-500 text-white" : "bg-background/80 backdrop-blur-sm text-foreground hover:text-red-500"
            )}
          >
            <Heart className="w-5 h-5" fill={inWishlist ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col">
        {product.brand && (
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            {product.brand}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{product.name}</h1>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.round(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {product.rating} ({product.reviewsCount} reviews)
          </span>
        </div>

        {/* Pricing */}
        <div className="mb-8">
          <div className="flex items-end gap-3 mb-1">
            <span className="text-4xl font-bold text-primary">
              ₹{currentFinalPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-xl text-muted-foreground line-through mb-1">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full mb-1">
                  {product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
        </div>

        {/* Variants */}
        {product.variants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Options</h3>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={v.stock <= 0}
                  className={cn(
                    "px-4 py-2 border rounded-xl text-sm font-medium transition-all",
                    selectedVariantId === v.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-foreground",
                    v.stock <= 0 && "opacity-50 cursor-not-allowed hidden line-through"
                  )}
                >
                  {v.value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Area */}
        <div className="mt-auto space-y-4 pt-6 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center text-lg hover:bg-muted rounded-l-xl transition-colors"
                disabled={isOutOfStock}
              >
                −
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, currentStock, quantity + 1))}
                className="w-12 h-12 flex items-center justify-center text-lg hover:bg-muted rounded-r-xl transition-colors"
                disabled={isOutOfStock || quantity >= 10 || quantity >= currentStock}
              >
                +
              </button>
            </div>
            
            <p className="text-sm font-medium">
              {isOutOfStock ? (
                <span className="text-red-500">Out of Stock</span>
              ) : currentStock < 10 ? (
                <span className="text-orange-500">Only {currentStock} left!</span>
              ) : (
                <span className="text-green-500">In Stock</span>
              )}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
              isOutOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            )}
          >
            <ShoppingCart className="w-5 h-5" />
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
