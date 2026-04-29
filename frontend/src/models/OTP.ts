import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Expires in 10 minutes
  expiresAt: { type: Date, required: true }
});

const OTP: Model<IOTP> = (mongoose.models.OTP as Model<IOTP>) || mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;
