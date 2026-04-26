/**
 * Image Utility Functions
 * Provides fallback images and optimization for product images
 */

import crypto from "crypto";

const PLACEHOLDER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52C9B8",
];

/**
 * Generate a placeholder image URL using placeholder.com service
 * Falls back to a data URI if needed
 */
export function getPlaceholderImageUrl(
  productName: string,
  width: number = 400,
  height: number = 500
): string {
  // Generate a consistent color based on product name
  const hash = crypto.createHash("md5").update(productName).digest("hex");
  const colorIndex = parseInt(hash.substring(0, 2), 16) % PLACEHOLDER_COLORS.length;
  const bgColor = PLACEHOLDER_COLORS[colorIndex].substring(1);
  const textColor = "FFFFFF";

  // Use placehold.co instead of via.placeholder.com for better reliability
  const encodedText = encodeURIComponent(productName.substring(0, 30));
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}.png?text=${encodedText}`;
}

/**
 * Fallback product image URL when no product image is available
 */
export function getFallbackProductImage(productName: string): string {
  // Generate from placeholder service
  return getPlaceholderImageUrl(productName, 400, 500);
}

/**
 * Fallback category image URL
 */
export function getFallbackCategoryImage(categoryName: string): string {
  return getPlaceholderImageUrl(categoryName, 200, 200);
}

/**
 * Check if image URL is valid and accessible
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get optimized image URL for Cloudinary
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    // Find upload index
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return url;

    // Build transformation string
    let transform = `w_${width || "auto"}`;
    if (height) transform += `,h_${height}`;
    transform += `,q_${quality},f_auto`;

    // Insert transformation
    pathParts.splice(uploadIndex + 1, 0, transform);
    urlObj.pathname = pathParts.join("/");

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Get image srcset for responsive images
 */
export function getImageSrcSet(baseUrl: string): string {
  if (!baseUrl) return "";

  return [
    `${getOptimizedCloudinaryUrl(baseUrl, 400, undefined, 85)} 400w`,
    `${getOptimizedCloudinaryUrl(baseUrl, 600, undefined, 85)} 600w`,
    `${getOptimizedCloudinaryUrl(baseUrl, 800, undefined, 85)} 800w`,
    `${getOptimizedCloudinaryUrl(baseUrl, 1200, undefined, 85)} 1200w`,
  ].join(", ");
}

/**
 * Get CSS background image URL (handles gradients and colors)
 */
export function getCategoryBackgroundStyle(categoryName: string): string {
  const hash = crypto.createHash("md5").update(categoryName).digest("hex");
  const colorIndex = parseInt(hash.substring(0, 2), 16) % PLACEHOLDER_COLORS.length;
  const color = PLACEHOLDER_COLORS[colorIndex];

  return `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`;
}
