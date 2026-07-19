import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType, UserRole } from '../types';

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  recipientRole: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  redirectUrl?: string;
  metadata?: any;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientRole: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    redirectUrl: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
