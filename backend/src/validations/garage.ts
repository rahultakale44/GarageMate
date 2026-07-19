import { z } from 'zod';
import { VehicleType } from '../types';

export const registerGarageSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.string().email('Invalid email address'),
  ownerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  garageName: z.string().min(2, 'Garage name must be at least 2 characters'),
  garagePhone: z.string().min(10, 'Garage phone must be at least 10 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceRadius: z.number().min(1).max(100).optional(),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  weeklyOff: z.string().optional(),
  is24x7: z.boolean().optional(),
  numberOfMechanics: z.number().min(1).optional(),
  supportedVehicleTypes: z.array(z.nativeEnum(VehicleType)).min(1, 'At least one vehicle type is required'),
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
