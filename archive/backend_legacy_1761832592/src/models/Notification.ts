import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
	user: mongoose.Types.ObjectId;
	type: 'POINTS_EARNED' | 'ORDER_STATUS' | 'TEST' | string;
	message: string;
	data?: Record<string, any>;
	read: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		type: { type: String, required: true },
		message: { type: String, required: true },
		data: { type: Schema.Types.Mixed },
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
