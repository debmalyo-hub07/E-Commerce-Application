import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId | null;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

CartItemSchema.index({ userId: 1 });

const CartItem: Model<ICartItem> =
  (mongoose.models.CartItem as Model<ICartItem>) || mongoose.model<ICartItem>('CartItem', CartItemSchema);

export default CartItem;
