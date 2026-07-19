import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
  requestId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: string;
  message: string;
  isRead: boolean;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'AssistanceRequest',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ requestId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
