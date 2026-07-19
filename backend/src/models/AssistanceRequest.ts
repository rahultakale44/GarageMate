import mongoose, { Schema, Document } from 'mongoose';
import { RequestStatus, IssueCategory, StatusHistory } from '../types';

export interface IAssistanceRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  garageId?: mongoose.Types.ObjectId;
  mechanicId?: mongoose.Types.ObjectId;
  issueCategory: IssueCategory;
  issueDescription: string;
  issueImages: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: RequestStatus;
  statusHistory: StatusHistory[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  bookingFee: number;
  estimatedCost?: number;
  finalCost?: number;
  completionOTP?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assistanceRequestSchema = new Schema<IAssistanceRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    garageId: {
      type: Schema.Types.ObjectId,
      ref: 'Garage',
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: 'Mechanic',
    },
    issueCategory: {
      type: String,
      enum: Object.values(IssueCategory),
      required: true,
    },
    issueDescription: {
      type: String,
      required: true,
    },
    issueImages: [String],
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
    address: {
      type: String,
      required: true,
    },
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.DRAFT,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(RequestStatus),
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    bookingFee: {
      type: Number,
      required: true,
    },
    estimatedCost: Number,
    finalCost: Number,
    completionOTP: String,
    otpExpiresAt: Date,
  },
  {
    timestamps: true,
  }
);

assistanceRequestSchema.index({ userId: 1 });
assistanceRequestSchema.index({ garageId: 1 });
assistanceRequestSchema.index({ status: 1 });
assistanceRequestSchema.index({ location: '2dsphere' });
assistanceRequestSchema.index({ createdAt: -1 });

export const AssistanceRequest = mongoose.model<IAssistanceRequestDocument>(
  'AssistanceRequest',
  assistanceRequestSchema
);
