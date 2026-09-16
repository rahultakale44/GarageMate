import mongoose, { Schema, Document } from 'mongoose';
import { VerificationStatus, VehicleType } from '../types';

export interface IGarageDocument extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  serviceRadius: number;
  services: string[];
  openingTime: string;
  closingTime: string;
  weeklyOff?: string;
  is24x7: boolean;
  numberOfMechanics: number;
  supportedVehicleTypes: VehicleType[];
  images: Array<{
    url: string;
    publicId: string;
    type: string;
  }>;
  documents: Array<{
    url: string;
    publicId: string;
    type: string;
  }>;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verificationHistory?: Array<{
    status: VerificationStatus;
    changedAt: Date;
    changedBy?: string;
    notes?: string;
  }>;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  visitingCharge: number;
  servicePricing?: Record<string, number>;
  isDemo: boolean;
  ownerConnected: boolean;
  dispatchEnabled: boolean;
}

const garageSchema = new Schema<IGarageDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    serviceRadius: {
      type: Number,
      default: 10,
    },
    services: [String],
    openingTime: String,
    closingTime: String,
    weeklyOff: String,
    is24x7: {
      type: Boolean,
      default: false,
    },
    numberOfMechanics: {
      type: Number,
      default: 1,
    },
    supportedVehicleTypes: [
      {
        type: String,
        enum: Object.values(VehicleType),
      },
    ],
    images: [
      {
        url: String,
        publicId: String,
        type: String,
      },
    ],
    documents: [
      {
        url: String,
        publicId: String,
        type: String,
      },
    ],
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    verificationNotes: String,
    verificationHistory: [
      {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: String,
        notes: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    visitingCharge: {
      type: Number,
      default: 99,
    },
    servicePricing: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    ownerConnected: {
      type: Boolean,
      default: false,
    },
    dispatchEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
garageSchema.index({ location: '2dsphere' });
garageSchema.index({ owner: 1 });
garageSchema.index({ verificationStatus: 1 });
garageSchema.index({ city: 1 });
garageSchema.index({ isAvailable: 1 });
garageSchema.index({ rating: -1 });

export const Garage = mongoose.model<IGarageDocument>('Garage', garageSchema);
