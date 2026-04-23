import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWishlist extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { timestamps: true }
);

WishlistSchema.index({ userId: 1 });

const Wishlist: Model<IWishlist> =
  (mongoose.models.Wishlist as Model<IWishlist>) || mongoose.model<IWishlist>('Wishlist', WishlistSchema);

export default Wishlist;
