import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  referralCode: string;
  referredBy?: string;
  points: number;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLoyaltyTier(): void;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    points: {
      type: Number,
      default: 0,
    },
    loyaltyTier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Generate referral code and hash password before saving
userSchema.pre('save', async function (next) {
  // Generate a random 6-character referral code for new users
  if (this.isNew && !this.referralCode) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = '';
    for (let i = 0; i < 6; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.referralCode = referralCode;
  }

  // Hash password if it's modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update loyalty tier based on points
userSchema.methods.updateLoyaltyTier = function () {
  if (this.points >= 1000) {
    this.loyaltyTier = 'PLATINUM';
  } else if (this.points >= 500) {
    this.loyaltyTier = 'GOLD';
  } else if (this.points >= 100) {
    this.loyaltyTier = 'SILVER';
  } else {
    this.loyaltyTier = 'BRONZE';
  }
};

export const User = mongoose.model<IUser>('User', userSchema);