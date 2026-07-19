import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sanitizeUser } from '../utils/helpers';

// Get User Profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: sanitizeUser(user),
  });
});

// Update User Profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, mobile, avatar } = req.body;

  const user = await User.findById(req.user!.userId);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name) user.name = name;
  if (mobile) user.mobile = mobile;
  if (avatar) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: sanitizeUser(user),
  });
});

// Change Password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }

  const user = await User.findById(req.user!.userId).select('+password');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.password) {
    throw new ApiError(400, 'Cannot change password for Google Sign In accounts');
  }

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});
