import mongoose, { Document, Schema } from 'mongoose';

export interface ILoyaltyPointsHistory extends Document {
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'REFERRAL' | 'ADJUSTMENT';
  description: string;
  balance: number;
  createdAt: Date;
}

const loyaltyPointsHistorySchema = new Schema<ILoyaltyPointsHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Points history must belong to a user'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    points: {
      type: Number,
      required: [true, 'Points amount is required'],
    },
    type: {
      type: String,
      enum: ['EARNED', 'REDEEMED', 'REFERRAL', 'ADJUSTMENT'],
      required: [true, 'Transaction type is required'],
    },
    description: {
      type: String,
      required: [true, 'Transaction description is required'],
    },
    balance: {
      type: Number,
      required: [true, 'Points balance is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
loyaltyPointsHistorySchema.index({ user: 1, createdAt: -1 });
loyaltyPointsHistorySchema.index({ order: 1 });

// Ensure points balance is always positive
loyaltyPointsHistorySchema.pre('save', function (next) {
  if (this.balance < 0) {
    next(new Error('Points balance cannot be negative'));
  }
  next();
});

export const LoyaltyPointsHistory = mongoose.model<ILoyaltyPointsHistory>(
  'LoyaltyPointsHistory',
  loyaltyPointsHistorySchema
); 