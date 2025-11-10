import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: Array<{
    service: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: 'CASH' | 'CARD' | 'POINTS';
  pickupAddress?: string;
  deliveryAddress: string;
  scheduledPickup?: Date;
  scheduledDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    items: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: 'Service',
          required: [true, 'Service is required for each item'],
        },
        quantity: {
          type: Number,
          required: [true, 'Item quantity is required'],
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: [true, 'Item price is required'],
          min: [0, 'Price cannot be negative'],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'POINTS'],
      required: [true, 'Payment method is required'],
    },
    pickupAddress: {
      type: String,
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
    },
    scheduledPickup: {
      type: Date,
    },
    scheduledDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate points earned before saving
orderSchema.pre('save', function (next) {
  if (this.isModified('totalAmount')) {
    // Earn 1 point for every $10 spent
    this.pointsEarned = Math.floor(this.totalAmount / 10);
  }
  next();
});

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);