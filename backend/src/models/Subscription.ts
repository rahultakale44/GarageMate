import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionPlan {
  // Driver Plans
  DRIVER_FREE = 'DRIVER_FREE',
  DRIVER_PRO = 'DRIVER_PRO',
  
  // Partner Plans
  PARTNER_FREE = 'PARTNER_FREE',
  PARTNER_PRO = 'PARTNER_PRO',
  PARTNER_BUSINESS = 'PARTNER_BUSINESS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  garageId?: mongoose.Types.ObjectId;
  userRole: 'USER' | 'GARAGE_OWNER';
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  razorpayCustomerId?: string;
  metadata?: any;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    garageId: {
      type: Schema.Types.ObjectId,
      ref: 'Garage',
    },
    userRole: {
      type: String,
      enum: ['USER', 'GARAGE_OWNER'],
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    billingInterval: {
      type: String,
      enum: Object.values(BillingInterval),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: Date,
    razorpaySubscriptionId: String,
    razorpayPlanId: String,
    razorpayCustomerId: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ garageId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);
