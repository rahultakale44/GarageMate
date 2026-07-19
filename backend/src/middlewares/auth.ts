import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const authenticate = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};
