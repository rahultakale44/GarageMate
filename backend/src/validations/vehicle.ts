import { z } from 'zod';
import { VehicleType } from '../types';

export const createVehicleSchema = z.object({
  vehicleType: z.nativeEnum(VehicleType),
  brand: z.string().min(2, 'Brand is required'),
  vehicleModel: z.string().min(1, 'Model is required'),
  registrationNumber: z.string().min(4, 'Registration number is required'),
  fuelType: z.string().min(1, 'Fuel type is required'),
  manufacturingYear: z.number().min(1900).max(new Date().getFullYear() + 1),
  image: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();
