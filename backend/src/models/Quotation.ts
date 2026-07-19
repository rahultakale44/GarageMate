import mongoose, { Schema, Document } from 'mongoose';
import { QuotationStatus, QuotationPart } from '../types';

export interface IQuotationDocument extends Document {
  requestId: mongoose.Types.ObjectId;
  garageId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  inspectionNotes: string;
  labourCharge: number;
  visitingCharge: number;
  parts: QuotationPart[];
  tax: number;
  discount: number;
  totalAmount: number;
  estimatedRepairTime: string;
  terms?: string;
  validUntil: Date;
  status: QuotationStatus;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

const quotationSchema = new Schema<IQuotationDocument>(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inspectionNotes: {
      type: String,
      required: true,
    },
    labourCharge: {
      type: Number,
      required: true,
    },
    visitingCharge: {
      type: Number,
      required: true,
    },
    parts: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    estimatedRepairTime: {
      type: String,
      required: true,
    },
    terms: String,
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(QuotationStatus),
      default: QuotationStatus.DRAFT,
    },
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

quotationSchema.index({ requestId: 1 });
quotationSchema.index({ garageId: 1 });
quotationSchema.index({ userId: 1 });
quotationSchema.index({ status: 1 });

export const Quotation = mongoose.model<IQuotationDocument>('Quotation', quotationSchema);
