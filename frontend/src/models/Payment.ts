import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: 'RAZORPAY' | 'COD';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundStatus?: string | null;
  refundInitiatedAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['RAZORPAY', 'COD'] },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    providerPaymentId: { type: String },
    providerOrderId: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number },
    refundStatus: { type: String },
    refundInitiatedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

PaymentSchema.index({ orderId: 1, userId: 1 });

const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
