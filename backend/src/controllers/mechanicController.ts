import { Response } from 'express';
import { AuthRequest, MechanicStatus } from '../types';
import { Mechanic } from '../models/Mechanic';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// Get All Mechanics (for garage owner)
export const getMechanics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const mechanics = await Mechanic.find({ garageId: garage._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: mechanics,
  });
});

// Get Single Mechanic
export const getMechanic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const mechanic = await Mechanic.findOne({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!mechanic) {
    throw new ApiError(404, 'Mechanic not found');
  }

  res.json({
    success: true,
    data: mechanic,
  });
});

// Create Mechanic
export const createMechanic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const { name, phone, avatar, skills, vehicleExpertise, experience } = req.body;

  const mechanic = await Mechanic.create({
    garageId: garage._id,
    name,
    phone,
    avatar,
    skills: skills || [],
    vehicleExpertise: vehicleExpertise || [],
    experience: experience || 0,
    status: MechanicStatus.AVAILABLE,
  });

  res.status(201).json({
    success: true,
    message: 'Mechanic added successfully',
    data: mechanic,
  });
});

// Update Mechanic
export const updateMechanic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const { name, phone, avatar, skills, vehicleExpertise, experience, status } = req.body;

  const mechanic = await Mechanic.findOneAndUpdate(
    { _id: req.params.id, garageId: garage._id },
    {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(avatar && { avatar }),
      ...(skills && { skills }),
      ...(vehicleExpertise && { vehicleExpertise }),
      ...(experience !== undefined && { experience }),
      ...(status && { status }),
    },
    { new: true, runValidators: true }
  );

  if (!mechanic) {
    throw new ApiError(404, 'Mechanic not found');
  }

  res.json({
    success: true,
    message: 'Mechanic updated successfully',
    data: mechanic,
  });
});

// Delete Mechanic
export const deleteMechanic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const mechanic = await Mechanic.findOneAndDelete({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!mechanic) {
    throw new ApiError(404, 'Mechanic not found');
  }

  res.json({
    success: true,
    message: 'Mechanic deleted successfully',
  });
});

// Update Mechanic Location (for real-time tracking)
export const updateMechanicLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    throw new ApiError(400, 'Latitude and longitude are required');
  }

  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const mechanic = await Mechanic.findOneAndUpdate(
    { _id: req.params.id, garageId: garage._id },
    {
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    },
    { new: true }
  );

  if (!mechanic) {
    throw new ApiError(404, 'Mechanic not found');
  }

  // Emit socket event for real-time tracking
  // This will be handled by Socket.IO service

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location: mechanic.currentLocation,
    },
  });
});
