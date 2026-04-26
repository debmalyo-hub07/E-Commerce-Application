import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId | null;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  totalPrice: number;
  productSnapshot: Record<string, unknown>;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  addressId: mongoose.Types.ObjectId;
  addressSnapshot: Record<string, unknown>;
  items: IOrderItem[];
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  shippingAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  paymentMethod: 'RAZORPAY' | 'COD';
  paymentStatus: 'PENDING' | 'PAYMENT_VERIFIED' | 'FAILED' | 'REFUND_INITIATED' | 'REFUNDED' | 'PENDING_COD' | 'COD_COLLECTED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  cancelRequestedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    productSnapshot: { type: Schema.Types.Mixed, required: true },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    addressSnapshot: { type: Schema.Types.Mixed, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, required: true },
    shippingAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    couponCode: { type: String },
    paymentMethod: { type: String, enum: ['RAZORPAY', 'COD'], required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAYMENT_VERIFIED', 'FAILED', 'REFUND_INITIATED', 'REFUNDED', 'PENDING_COD', 'COD_COLLECTED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    trackingNumber: { type: String },
    notes: { type: String },
    cancelRequestedAt: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
