import { Response } from 'express';
import { AuthRequest, VerificationStatus } from '../types';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { updateGarageSchema, searchGaragesSchema } from '../validations/garage';
import { DEFAULT_SEARCH_RADIUS_KM, MAX_SEARCH_RADIUS_KM } from '../constants';
import { reverseGeocode, searchGeocode } from '../services/geocodingService';

// Search Nearby Garages
export const searchNearbyGarages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = searchGaragesSchema.parse({
    latitude: parseFloat(req.query.latitude as string),
    longitude: parseFloat(req.query.longitude as string),
    radius: req.query.radius ? parseFloat(req.query.radius as string) : DEFAULT_SEARCH_RADIUS_KM,
    services: req.query.services as string | undefined,
    vehicleType: req.query.vehicleType as any,
    minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
    openNow: req.query.openNow === 'true',
    is24x7: req.query.is24x7 === 'true',
  });

  const availableNow = req.query.availableNow === 'true';
  const minimumRating = req.query.minimumRating ? parseFloat(req.query.minimumRating as string) : query.minRating;
  const serviceType = req.query.serviceType as string | undefined;
  const vehicleType = req.query.vehicleType as string | undefined;

  const radiusInMeters = Math.min(query.radius || DEFAULT_SEARCH_RADIUS_KM, MAX_SEARCH_RADIUS_KM) * 1000;

  const filters: any = {
    verificationStatus: VerificationStatus.APPROVED,
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [query.longitude, query.latitude],
        },
        $maxDistance: radiusInMeters,
      },
    },
  };

  if (serviceType) {
    filters.services = { $in: [serviceType] };
  } else if (query.services) {
    const servicesArray = query.services.split(',').map((s: string) => s.trim());
    filters.services = { $in: servicesArray };
  }

  if (vehicleType) {
    filters.supportedVehicleTypes = vehicleType;
  } else if (query.vehicleType) {
    filters.supportedVehicleTypes = query.vehicleType;
  }

  if (minimumRating || query.minRating) {
    filters.rating = { $gte: minimumRating || query.minRating };
  }

  if (availableNow) {
    filters.isAvailable = true;
  }

  if (query.is24x7 || query.openNow) {
    filters.is24x7 = true;
  }

  const garages = await Garage.find(filters)
    .populate('owner', 'name avatar')
    .limit(50);

  // Calculate distance for each garage
  const garagesWithDistance = garages.map(garage => {
    const [garageLng, garageLat] = garage.location.coordinates;
    const distance = calculateDistance(
      query.latitude,
      query.longitude,
      garageLat,
      garageLng
    );

    const isOpen = isGarageOpen(garage);

    return {
      ...garage.toObject(),
      distance: parseFloat(distance.toFixed(2)),
      distanceInMeters: Math.round(distance * 1000),
      isOpen,
    };
  });

  res.json({
    success: true,
    data: garagesWithDistance,
  });
});

// Get All Garages (with filters)
export const getGarages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { city, search, minRating } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const filters: any = {
    verificationStatus: VerificationStatus.APPROVED,
  };

  if (city) {
    filters.city = new RegExp(city as string, 'i');
  }

  if (search) {
    filters.$or = [
      { name: new RegExp(search as string, 'i') },
      { address: new RegExp(search as string, 'i') },
    ];
  }

  if (minRating) {
    filters.rating = { $gte: parseFloat(minRating as string) };
  }

  const [garages, total] = await Promise.all([
    Garage.find(filters)
      .populate('owner', 'name avatar')
      .skip(skip)
      .limit(limit)
      .sort({ rating: -1, reviewCount: -1 }),
    Garage.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: garages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get Single Garage
export const getGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findById(req.params.id).populate('owner', 'name avatar email phone');

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  res.json({
    success: true,
    data: garage,
  });
});

// Get My Garage (for garage owners)
export const getMyGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  res.json({
    success: true,
    data: garage,
  });
});

// Update Garage
export const updateGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = updateGarageSchema.parse(req.body);

  const updateData: any = { ...validatedData };

  if (validatedData.latitude && validatedData.longitude) {
    updateData.location = {
      type: 'Point',
      coordinates: [validatedData.longitude, validatedData.latitude],
    };
    delete updateData.latitude;
    delete updateData.longitude;
  }

  const garage = await Garage.findOneAndUpdate(
    { owner: req.user!.userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  res.json({
    success: true,
    message: 'Garage updated successfully',
    data: garage,
  });
});

// Toggle Availability
export const toggleAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { isAvailable } = req.body;

  const garage = await Garage.findOneAndUpdate(
    { owner: req.user!.userId },
    { isAvailable },
    { new: true }
  );

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  res.json({
    success: true,
    message: `Garage is now ${isAvailable ? 'available' : 'unavailable'}`,
    data: { isAvailable: garage.isAvailable },
  });
});

// Add Garage Images
export const addGarageImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { images } = req.body; // Array of { url, publicId, type }

  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new ApiError(400, 'Images are required');
  }

  const garage = await Garage.findOne({ owner: req.user!.userId });

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  garage.images.push(...images);
  await garage.save();

  res.json({
    success: true,
    message: 'Images added successfully',
    data: garage.images,
  });
});

// Helper function
export const reverseGeocodeAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const latitude = parseFloat(req.query.latitude as string);
  const longitude = parseFloat(req.query.longitude as string);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError(400, 'Latitude and longitude are required');
  }

  const result = await reverseGeocode({ latitude, longitude });
  res.json({ success: true, data: result });
});

export const searchGeocodeAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query.query as string;

  if (!query) {
    throw new ApiError(400, 'Query is required');
  }

  const result = await searchGeocode(query);
  res.json({ success: true, data: result });
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isGarageOpen(garage: any): boolean {
  if (garage.is24x7) {
    return true;
  }

  const now = new Date();
  const currentDay = now.toLocaleString('en-US', { weekday: 'short' });
  if (garage.weeklyOff && currentDay === garage.weeklyOff) {
    return false;
  }

  const openingTime = garage.openingTime ? Number(garage.openingTime.split(':')[0]) : 0;
  const closingTime = garage.closingTime ? Number(garage.closingTime.split(':')[0]) : 24;
  const currentHour = now.getHours();

  return currentHour >= openingTime && currentHour < closingTime;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
