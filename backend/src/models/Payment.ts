import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus, PaymentType } from '../types';

export interface IPaymentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  garageId?: mongoose.Types.ObjectId;
  quotationId?: mongoose.Types.ObjectId;
  type: PaymentType;
  amount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  metadata?: any;
}

const paymentSchema = new Schema<IPaymentDocument>(
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
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation',
    },
    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
    },
    failureReason: String,
    refundId: String,
    refundAmount: Number,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ requestId: 1 });
paymentSchema.index({ garageId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

export const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);
