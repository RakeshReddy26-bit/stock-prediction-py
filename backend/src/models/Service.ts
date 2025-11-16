import { Schema, model, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'WASH_AND_FOLD' | 'DRY_CLEANING' | 'IRONING' | 'STARCHING';
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      minlength: [3, 'Service name must be at least 3 characters long']
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },
    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [15, 'Duration must be at least 15 minutes']
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      enum: {
        values: ['WASH_AND_FOLD', 'DRY_CLEANING', 'IRONING', 'STARCHING'],
        message: 'Invalid service category'
      }
    },
    image: {
      type: String,
      required: [true, 'Service image is required']
    }
  },
  {
    timestamps: true
  }
);

export const Service = model<IService>('Service', serviceSchema); 