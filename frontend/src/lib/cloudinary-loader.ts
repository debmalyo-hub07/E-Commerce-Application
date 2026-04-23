/**
 * Custom Cloudinary image loader for next/image.
 * Generates optimized Cloudinary URLs with on-the-fly transformations.
 *
 * To use:
 *   <Image src="path/to/cloud-public-id" ... />
 *   or for external images that already have full URLs,
 *   next/image will use this loader and pass the src as-is.
 */

interface CloudinaryLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({
  src,
  width,
  quality = 80,
}: CloudinaryLoaderParams): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // If src is already a full URL (e.g. Unsplash, external CDN), return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // For Cloudinary public IDs, construct the optimization URL
  if (cloudName) {
    const transforms = `f_auto,c_limit,w_${width},q_${quality}`;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${src}`;
  }

  // Fallback: return the src unchanged
  return src;
}
