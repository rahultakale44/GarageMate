import mongoose, { Schema, Document } from 'mongoose';
import { VehicleType } from '../types';

export interface IVehicleDocument extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleType: VehicleType;
  brand: string;
  vehicleModel: string;
  registrationNumber: string;
  fuelType: string;
  manufacturingYear: number;
  image?: string;
  notes?: string;
}

const vehicleSchema = new Schema<IVehicleDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleType: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    vehicleModel: {
      type: String,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    fuelType: {
      type: String,
      required: true,
    },
    manufacturingYear: {
      type: Number,
      required: true,
    },
    image: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ userId: 1 });
vehicleSchema.index({ registrationNumber: 1 });

export const Vehicle = mongoose.model<IVehicleDocument>('Vehicle', vehicleSchema);
