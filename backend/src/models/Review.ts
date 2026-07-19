import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  garageId: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  rating: number;
  reviewMessage?: string;
  serviceQuality: number;
  responseTime: number;
  priceFairness: number;
  garageResponse?: string;
  garageResponseAt?: Date;
  isHidden: boolean;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    garageId: {
      type: Schema.Types.ObjectId,
      ref: 'Garage',
      required: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'AssistanceRequest',
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewMessage: String,
    serviceQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    priceFairness: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    garageResponse: String,
    garageResponseAt: Date,
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ userId: 1 });
reviewSchema.index({ garageId: 1 });
reviewSchema.index({ requestId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);
