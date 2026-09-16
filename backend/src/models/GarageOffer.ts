import mongoose, { Schema, Document } from 'mongoose';

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN'
}

export interface IGarageOfferDocument extends Document {
  requestId: mongoose.Types.ObjectId;
  garageId: mongoose.Types.ObjectId;
  estimatedArrivalMinutes: number;
  visitFee: number;
  message?: string;
  status: OfferStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const garageOfferSchema = new Schema<IGarageOfferDocument>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'AssistanceRequest',
      required: true,
    },
    garageId: {
      type: Schema.Types.ObjectId,
      ref: 'Garage',
      required: true,
    },
    estimatedArrivalMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 180,
    },
    visitFee: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(OfferStatus),
      default: OfferStatus.PENDING,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: Date,
    rejectedAt: Date,
    withdrawnAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate offers from same garage for same request
garageOfferSchema.index({ requestId: 1, garageId: 1 }, { unique: true });
garageOfferSchema.index({ requestId: 1, status: 1 });
garageOfferSchema.index({ garageId: 1, status: 1 });
garageOfferSchema.index({ expiresAt: 1 });
garageOfferSchema.index({ createdAt: -1 });

export const GarageOffer = mongoose.model<IGarageOfferDocument>('GarageOffer', garageOfferSchema);
