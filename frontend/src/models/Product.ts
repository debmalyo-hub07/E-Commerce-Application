import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductImage {
  _id: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface IProductVariant {
  _id: mongoose.Types.ObjectId;
  name: string;
  value: string;
  priceModifier: number;
  stock: number;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  categoryId: mongoose.Types.ObjectId;
  basePrice: number;
  sellingPrice: number;
  gstPercent: number;
  discountPercent: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  images: IProductImage[];
  variants: IProductVariant[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    brand: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    basePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 18, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    images: [ProductImageSchema],
    variants: [ProductVariantSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);


ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });

const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
