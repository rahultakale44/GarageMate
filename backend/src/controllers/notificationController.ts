import { Response } from 'express';
import { AuthRequest } from '../types';
import { Notification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { markAsRead, markAllAsRead, getUnreadCount } from '../services/notificationService';

// Get My Notifications
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user!.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user!.userId }),
    getUnreadCount(req.user!.userId),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Mark as Read
export const markNotificationAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await markAsRead(req.params.id, req.user!.userId);

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

// Mark All as Read
export const markAllNotificationsAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await markAllAsRead(req.user!.userId);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// Get Unread Count
export const getUnreadNotificationCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await getUnreadCount(req.user!.userId);

  res.json({
    success: true,
    data: { count },
  });
});
