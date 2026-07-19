import { Response } from 'express';
import { AuthRequest } from '../types';
import { Vehicle } from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { createVehicleSchema, updateVehicleSchema } from '../validations/vehicle';

// Get All Vehicles
export const getVehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vehicles = await Vehicle.find({ userId: req.user!.userId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: vehicles,
  });
});

// Get Single Vehicle
export const getVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  res.json({
    success: true,
    data: vehicle,
  });
});

// Create Vehicle
export const createVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = createVehicleSchema.parse(req.body);

  const vehicle = await Vehicle.create({
    ...validatedData,
    userId: req.user!.userId,
  });

  res.status(201).json({
    success: true,
    message: 'Vehicle added successfully',
    data: vehicle,
  });
});

// Update Vehicle
export const updateVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = updateVehicleSchema.parse(req.body);

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    validatedData,
    { new: true, runValidators: true }
  );

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: vehicle,
  });
});

// Delete Vehicle
export const deleteVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vehicle = await Vehicle.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  res.json({
    success: true,
    message: 'Vehicle deleted successfully',
  });
});
