"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star, Badge } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  onAddToCart?: (id: string) => void;
}

export function EnhancedProductCard({
  id,
  name,
  slug,
  image,
  price,
  originalPrice,
  discount,
  rating,
  reviewCount,
  isNew,
  isFeatured,
  inStock = true,
  onAddToCart,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    onAddToCart?.(id);
    setTimeout(() => setIsAddingToCart(false), 600);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.08, transition: { duration: 0.4 } },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    show: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 500, damping: 25, delay: 0.2 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/products/${slug}`}>
        <div className="relative overflow-hidden rounded-lg bg-muted/30 aspect-square cursor-pointer">
          {/* Image */}
          <motion.div
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            className="relative w-full h-full"
          >
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </motion.div>

          {/* Stock out overlay */}
          {!inStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </motion.div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
            {isNew && (
              <motion.div variants={badgeVariants} initial="hidden" animate="show">
                <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>
              </motion.div>
            )}
            {discount && (
              <motion.div variants={badgeVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <Badge className="bg-red-500 hover:bg-red-600">-{discount}%</Badge>
              </motion.div>
            )}
            {isFeatured && (
              <motion.div variants={badgeVariants} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
                <Badge className="bg-purple-500 hover:bg-purple-600">Featured</Badge>
              </motion.div>
            )}
          </div>

          {/* Wishlist button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors z-10 pointer-events-auto"
          >
            <motion.div
              animate={{ scale: isWishlisted ? [1, 1.2, 1] : 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Heart
                className="w-5 h-5 transition-colors"
                fill={isWishlisted ? "#ef4444" : "none"}
                stroke={isWishlisted ? "#ef4444" : "#666"}
              />
            </motion.div>
          </motion.button>

          {/* Add to cart button - appears on hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto"
          >
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={!inStock || isAddingToCart}
              className="w-full gap-2"
              size="sm"
            >
              <motion.div
                animate={{ rotate: isAddingToCart ? 360 : 0 }}
                transition={{ duration: 0.6 }}
              >
                <ShoppingCart className="w-4 h-4" />
              </motion.div>
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
          </motion.div>
        </div>
      </Link>

      {/* Product info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="pt-3 space-y-2"
      >
        <Link href={`/products/${slug}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.6 }}
              className="flex gap-0.5"
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </motion.div>
            {reviewCount && (
              <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <span className="font-bold text-lg text-primary">₹{price.toLocaleString()}</span>
          {originalPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice.toLocaleString()}
              </span>
              {discount && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded"
                >
                  Save {discount}%
                </motion.span>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
