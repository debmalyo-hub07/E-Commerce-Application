"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getFallbackProductImage } from "@/lib/image-utils";
import { ImageOff } from "lucide-react";

interface OptimizedProductImageProps {
  src?: string;
  alt: string;
  productName: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  fill?: boolean;
  sizes?: string;
}

export function OptimizedProductImage({
  src,
  alt,
  productName,
  className = "",
  onLoad,
  fill,
  sizes,
}: OptimizedProductImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const displaySrc = hasError || !src ? getFallbackProductImage(productName) : src;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-muted/20 ${className}`}>
      {/* Loading skeleton (stays behind the image) */}
      {!isLoaded && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted z-0"
          animate={{
            backgroundPosition: ["200% 0", "-200% 0"],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Image */}
      <img
        ref={(el) => {
          if (el?.complete && !isLoaded) {
            setIsLoaded(true);
          }
        }}
        src={displaySrc}
        alt={alt}
        className="object-cover w-full h-full z-10 relative"
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          setIsLoaded(true); // Stop skeleton if error
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function ProductImageGallery({
  images,
  productName,
}: {
  images?: Array<{ url: string; isPrimary?: boolean }>;
  productName: string;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Filter valid images and add fallback
  const validImages = images && images.length > 0 ? images : [];
  const displayImages =
    validImages.length > 0
      ? validImages
      : [{ url: getFallbackProductImage(productName), isPrimary: true }];

  const primaryImage = displayImages.find((img) => img.isPrimary) || displayImages[0];
  const primaryIndex = displayImages.indexOf(primaryImage);

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <motion.div
        key={selectedImageIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="aspect-square rounded-xl overflow-hidden bg-muted/20 border border-border/30"
      >
        <OptimizedProductImage
          src={displayImages[selectedImageIndex]?.url}
          alt={`${productName} - Image ${selectedImageIndex + 1}`}
          productName={productName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 500px"
          className="w-full h-full"
        />
      </motion.div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((image, idx) => (
            <motion.button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedImageIndex
                  ? "border-primary shadow-lg shadow-primary/30"
                  : "border-border/30 hover:border-primary/50"
              }`}
            >
              <OptimizedProductImage
                src={image.url}
                alt={`${productName} - Thumbnail ${idx + 1}`}
                productName={productName}
                className="w-full h-full"
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
