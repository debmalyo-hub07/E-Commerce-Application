import { cloudinary } from "../lib/cloudinary";
import type { UploadApiOptions } from "../lib/cloudinary";

export const cloudinaryService = {
  /**
   * Upload an image buffer or base64 string to Cloudinary.
   */
  async uploadImage(
    source: Buffer | string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: UploadApiOptions["transformation"];
    } = {}
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder: options.folder ?? "stylemart/products",
        public_id: options.publicId,
        transformation: options.transformation ?? [
          { quality: "auto:best", fetch_format: "auto" },
        ],
        overwrite: true,
      };

      if (Buffer.isBuffer(source)) {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("Upload failed"));
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        uploadStream.end(source);
      } else {
        cloudinary.uploader.upload(source, uploadOptions, (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        });
      }
    });
  },

  /**
   * Delete an image from Cloudinary by its public_id.
   */
  async deleteImage(publicId: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Failed to delete image ${publicId}: ${result.result}`);
    }
  },

  /**
   * Delete multiple images in a batch.
   */
  async deleteImages(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) return;
    await cloudinary.api.delete_resources(publicIds);
  },

  /**
   * Generate an on-the-fly transformation URL.
   * Uses Cloudinary URL format for next/image Cloudinary loader.
   */
  getTransformUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: "fill" | "fit" | "thumb" | "scale";
      quality?: number | "auto";
      format?: "auto" | "webp" | "jpg" | "png";
    } = {}
  ): string {
    const {
      width = 400,
      height = 400,
      crop = "fill",
      quality = "auto",
      format = "auto",
    } = options;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
      secure: true,
    });
  },

  /**
   * Upload a user avatar with circular crop transformation.
   */
  async uploadAvatar(
    source: Buffer | string,
    userId: string
  ): Promise<{ url: string; publicId: string }> {
    return cloudinaryService.uploadImage(source, {
      folder: "stylemart/avatars",
      publicId: `avatar_${userId}`,
      transformation: [
        { width: 200, height: 200, crop: "fill", gravity: "face" },
        { quality: "auto:best", fetch_format: "auto" },
      ],
    });
  },
};
