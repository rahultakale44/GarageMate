import { z } from 'zod';
import { IssueCategory } from '../types';

export const createRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  issueCategory: z.nativeEnum(IssueCategory),
  issueDescription: z.string().min(10, 'Please describe the issue in detail'),
  issueImages: z.array(z.string()).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5, 'Address is required'),
  landmark: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  garageId: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const assignMechanicSchema = z.object({
  mechanicId: z.string().min(1, 'Mechanic ID is required'),
});

export const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

export const verifyCompletionOTPSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
