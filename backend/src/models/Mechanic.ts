import mongoose, { Schema, Document } from 'mongoose';
import { MechanicStatus, VehicleType } from '../types';

export interface IMechanicDocument extends Document {
  garageId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  avatar?: string;
  skills: string[];
  vehicleExpertise: VehicleType[];
  experience: number;
  status: MechanicStatus;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  currentRequestId?: mongoose.Types.ObjectId;
}

const mechanicSchema = new Schema<IMechanicDocument>(
  {
    garageId: {
      type: Schema.Types.ObjectId,
      ref: 'Garage',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    avatar: String,
    skills: [String],
    vehicleExpertise: [
      {
        type: String,
        enum: Object.values(VehicleType),
      },
    ],
    experience: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(MechanicStatus),
      default: MechanicStatus.AVAILABLE,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    currentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'AssistanceRequest',
    },
  },
  {
    timestamps: true,
  }
);

mechanicSchema.index({ garageId: 1 });
mechanicSchema.index({ status: 1 });
mechanicSchema.index({ currentLocation: '2dsphere' });

export const Mechanic = mongoose.model<IMechanicDocument>('Mechanic', mechanicSchema);
