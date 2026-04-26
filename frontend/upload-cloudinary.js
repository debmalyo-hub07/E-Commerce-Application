const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load backend .env which has MONGODB_URI and CLOUDINARY credentials
dotenv.config({ path: path.join(__dirname, "../.env.local") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ProductSchema = new mongoose.Schema({
  name: String,
  images: Array,
});
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const products = await Product.find({});
  console.log(`Found ${products.length} products.`);

  const imageFiles = fs.readdirSync(path.join(__dirname, "public/images")).filter(f => f.match(/\.(jpg|jpeg|png)$/));
  console.log(`Found ${imageFiles.length} local images:`, imageFiles);

  if (imageFiles.length === 0) {
    console.log("No images to upload.");
    process.exit(0);
  }

  // Upload local images to Cloudinary
  const uploadedUrls = [];
  for (const file of imageFiles) {
    console.log(`Uploading ${file}...`);
    try {
      const result = await cloudinary.uploader.upload(path.join(__dirname, "public/images", file), {
        folder: "stylemart/products",
      });
      uploadedUrls.push(result.secure_url);
      console.log(`Uploaded ${file} -> ${result.secure_url}`);
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err);
    }
  }

  if (uploadedUrls.length === 0) {
    console.log("Failed to upload any images.");
    process.exit(1);
  }

  // Update products with new Cloudinary URLs
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    // Assign a random uploaded image to this product if it currently doesn't have a valid cloudinary url
    const hasValidImage = product.images && product.images.length > 0 && product.images[0].url && product.images[0].url.includes("cloudinary.com");
    if (!hasValidImage) {
      const randomUrl = uploadedUrls[i % uploadedUrls.length];
      product.images = [{
        url: randomUrl,
        publicId: `stylemart/products/${randomUrl.split("/").pop()?.split(".")[0]}`,
        isPrimary: true,
        displayOrder: 0
      }];
      await product.save();
      console.log(`Updated product "${product.name}" with image ${randomUrl}`);
    }
  }

  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
