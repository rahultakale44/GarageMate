import { z } from 'zod';
import { VehicleType } from '../types';

export const registerGarageSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.string().email('Invalid email address'),
  ownerPhone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  garageName: z.string().min(2, 'Garage name must be at least 2 characters'),
  garagePhone: z.string().regex(/^\d{10}$/, 'Garage phone must be exactly 10 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  serviceRadius: z.number().min(1, 'Service radius must be at least 1 km').max(100, 'Service radius cannot exceed 100 km').optional(),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  weeklyOff: z.string().optional(),
  is24x7: z.boolean().optional(),
  numberOfMechanics: z.number().min(1, 'At least one mechanic is required').optional(),
  supportedVehicleTypes: z.array(z.nativeEnum(VehicleType)).min(1, 'Select at least one vehicle type'),
}).refine((data) => {
  // If not 24/7, opening and closing times are required
  if (!data.is24x7 && (!data.openingTime || !data.closingTime)) {
    return false;
  }
  return true;
}, {
  message: 'Working hours are required unless 24/7 is enabled',
  path: ['openingTime'],
});

export const updateGarageSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(10).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pincode: z.string().min(6).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  serviceRadius: z.number().min(1).max(100).optional(),
  services: z.array(z.string()).optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  weeklyOff: z.string().optional(),
  is24x7: z.boolean().optional(),
  numberOfMechanics: z.number().min(1).optional(),
  supportedVehicleTypes: z.array(z.nativeEnum(VehicleType)).optional(),
  visitingCharge: z.number().min(0).optional(),
  servicePricing: z.record(z.string(), z.number().min(0)).optional(),
});

export const searchGaragesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(100).optional(),
  services: z.string().optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  minRating: z.number().min(0).max(5).optional(),
  openNow: z.boolean().optional(),
  is24x7: z.boolean().optional(),
});
