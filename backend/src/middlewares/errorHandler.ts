import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any[] = [];

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // Handle Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate entry';
    const field = Object.keys(err.keyPattern || {})[0];
    errors = [{ field, message: `${field} already exists` }];
  }
  // Handle Mongoose cast error
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Route not found - ${req.originalUrl}`);
  next(error);
};
