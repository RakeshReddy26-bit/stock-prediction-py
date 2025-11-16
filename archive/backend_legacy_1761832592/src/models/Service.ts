import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
	name: string;
	description?: string;
	price: number;
	duration: number; // minutes
	category: 'WASH_AND_FOLD' | 'DRY_CLEANING' | string;
	image?: string;
	createdAt: Date;
	updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String },
		price: { type: Number, required: true, min: 0 },
		duration: { type: Number, required: true, min: 1 },
		category: { type: String, required: true },
		image: { type: String },
	},
	{ timestamps: true }
);

serviceSchema.index({ name: 1 });

export const Service = mongoose.model<IService>('Service', serviceSchema);
