import jwt from 'jsonwebtoken';
import { TokenPayload, UserRole } from '../types';

export const generateAccessToken = (userId: string, role: UserRole, email: string): string => {
  const payload: TokenPayload = { userId, role, email };
  
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  } as any);
};

export const generateRefreshToken = (userId: string, role: UserRole, email: string): string => {
  const payload: TokenPayload = { userId, role, email };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as any);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
};
