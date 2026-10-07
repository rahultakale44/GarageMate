import jwt from 'jsonwebtoken';
import { TokenPayload, UserRole } from '../types';
import { getJWTConfig } from '../config/jwt';

export const generateAccessToken = (userId: string, role: UserRole, email: string): string => {
  const config = getJWTConfig();
  const payload: TokenPayload = { userId, role, email };
  
  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessExpiresIn,
    algorithm: 'HS256',
  });
};

export const generateRefreshToken = (userId: string, role: UserRole, email: string): string => {
  const config = getJWTConfig();
  const payload: TokenPayload = { userId, role, email };
  
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
    algorithm: 'HS256',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const config = getJWTConfig();
  return jwt.verify(token, config.accessSecret, {
    algorithms: ['HS256'],
  }) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const config = getJWTConfig();
  return jwt.verify(token, config.refreshSecret, {
    algorithms: ['HS256'],
  }) as TokenPayload;
};
