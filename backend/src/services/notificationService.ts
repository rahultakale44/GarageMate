import { Notification } from '../models/Notification';
import { NotificationType, UserRole } from '../types';
import mongoose from 'mongoose';

interface CreateNotificationParams {
  recipient: mongoose.Types.ObjectId | string;
  recipientRole: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  redirectUrl?: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams): Promise<typeof Notification.prototype | undefined> => {
  try {
    const notification = await Notification.create(params);
    
    // Emit socket event if socket service is available
    // This will be handled by Socket.IO
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return undefined;
  }
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
};

export const markAllAsRead = async (userId: string) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};
