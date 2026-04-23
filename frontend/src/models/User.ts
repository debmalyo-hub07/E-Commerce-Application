import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  phone?: string | null;
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
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'], default: 'CUSTOMER' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'DELETED'], default: 'ACTIVE' },
    phone: { type: String },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    emailVerified: { type: Boolean, default: false },
    googleId: { type: String, sparse: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
