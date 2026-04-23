import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourierVerification extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  courierId: mongoose.Types.ObjectId;
  codAmount: number;
  verifiedAt?: Date | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourierVerificationSchema = new Schema<ICourierVerification>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    courierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    codAmount: { type: Number, required: true },
    verifiedAt: { type: Date },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    notes: { type: String },
  },
  { timestamps: true }
);

const CourierVerification: Model<ICourierVerification> =
  (mongoose.models.CourierVerification as Model<ICourierVerification>) ||
  mongoose.model<ICourierVerification>('CourierVerification', CourierVerificationSchema);

export default CourierVerification;
