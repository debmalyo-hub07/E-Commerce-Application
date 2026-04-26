import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  phone?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  dob?: Date | null;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  emailVerified: boolean;
  googleId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, minlength: 2, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['ADMIN', 'CUSTOMER'], default: 'CUSTOMER' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'DELETED'], default: 'ACTIVE' },
    phone: { type: String },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
    dob: { type: Date },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    emailVerified: { type: Boolean, default: false },
    googleId: { type: String, sparse: true },
  },
  { timestamps: true }
);

// Delete the model if it exists to prevent schema caching issues during hot-reloads
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
