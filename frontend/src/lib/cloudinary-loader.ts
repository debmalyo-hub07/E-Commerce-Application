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

  // If src is already a full URL (e.g. Unsplash, external CDN), handle sizing
  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const url = new URL(src);
      // specific handling for unsplash to ensure good quality
      if (src.includes("images.unsplash.com")) {
        url.searchParams.set("w", width.toString());
        url.searchParams.set("q", quality.toString());
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "crop");
      } else {
        url.searchParams.set("w", width.toString());
        url.searchParams.set("q", quality.toString());
      }
      return url.toString();
    } catch {
      return src;
    }
  }

  // If src is a local absolute path, use it as is without cloudinary transformations
  if (src.startsWith("/")) {
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
