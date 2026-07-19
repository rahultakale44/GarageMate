import mongoose, { Schema, Document } from 'mongoose';
import { ComplaintStatus } from '../types';

export interface IComplaintDocument extends Document {
  userId: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  garageId?: mongoose.Types.ObjectId;
  category: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  resolution?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
}

const complaintSchema = new Schema<IComplaintDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'AssistanceRequest',
      required: true,
    },
    garageId: {
      type: Schema.Types.ObjectId,
      ref: 'Garage',
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
    },
    adminNotes: String,
    resolution: String,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ userId: 1 });
complaintSchema.index({ requestId: 1 });
complaintSchema.index({ garageId: 1 });
complaintSchema.index({ status: 1 });

export const Complaint = mongoose.model<IComplaintDocument>('Complaint', complaintSchema);
