import mongoose, { Document, Schema } from 'mongoose';

export interface ILoyaltyPointsHistory extends Document {
	user: mongoose.Types.ObjectId;
	change: number; // positive earn, negative redeem
	reason: string;
	balanceAfter: number;
	createdAt: Date;
	updatedAt: Date;
}

const loyaltyPointsHistorySchema = new Schema<ILoyaltyPointsHistory>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		change: { type: Number, required: true },
		reason: { type: String, required: true },
		balanceAfter: { type: Number, required: true },
	},
	{ timestamps: true }
);

loyaltyPointsHistorySchema.index({ user: 1, createdAt: -1 });

export const LoyaltyPointsHistory = mongoose.model<ILoyaltyPointsHistory>('LoyaltyPointsHistory', loyaltyPointsHistorySchema);
