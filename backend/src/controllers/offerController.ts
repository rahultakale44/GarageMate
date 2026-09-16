import { Response } from 'express';
import { AuthRequest, UserRole, RequestStatus, NotificationType } from '../types';
import { GarageOffer, OfferStatus } from '../models/GarageOffer';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { createNotification } from '../services/notificationService';
import { z } from 'zod';

// Validation schemas
const createOfferSchema = z.object({
  estimatedArrivalMinutes: z.number().min(5, 'ETA must be at least 5 minutes').max(180, 'ETA cannot exceed 180 minutes'),
  visitFee: z.number().min(0, 'Visit fee cannot be negative'),
  message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
});

// Submit Offer (Garage Owner)
export const submitOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const validatedData = createOfferSchema.parse(req.body);

  // Get garage
  const garage = await Garage.findOne({ owner: req.user!.userId });
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  // Check garage is approved and active
  if (garage.verificationStatus !== 'APPROVED') {
    throw new ApiError(403, 'Garage must be approved to submit offers');
  }

  if (!garage.isAvailable) {
    throw new ApiError(403, 'Garage is currently unavailable');
  }

  // Get request
  const request = await AssistanceRequest.findById(requestId).populate('userId');
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  // Check request status allows offers
  if (![RequestStatus.BROADCASTED, RequestStatus.OFFERS_RECEIVED].includes(request.status as any)) {
    throw new ApiError(400, 'This request is not accepting offers');
  }

  // Check if offer already exists
  const existingOffer = await GarageOffer.findOne({
    requestId,
    garageId: garage._id,
  });

  if (existingOffer) {
    throw new ApiError(400, 'You have already submitted an offer for this request');
  }

  // Calculate expiry (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create offer
  const offer = await GarageOffer.create({
    requestId,
    garageId: garage._id,
    estimatedArrivalMinutes: validatedData.estimatedArrivalMinutes,
    visitFee: validatedData.visitFee,
    message: validatedData.message,
    status: OfferStatus.PENDING,
    expiresAt,
  });

  // Update request status to OFFERS_RECEIVED if it was BROADCASTED
  if (request.status === RequestStatus.BROADCASTED) {
    request.status = RequestStatus.OFFERS_RECEIVED;
    request.statusHistory.push({
      status: RequestStatus.OFFERS_RECEIVED,
      updatedBy: req.user!.userId as any,
      updatedAt: new Date(),
      notes: 'First offer received',
    });
    await request.save();
  }

  // Notify user
  await createNotification({
    recipient: request.userId._id || request.userId,
    recipientRole: UserRole.USER,
    title: 'New Offer Received',
    message: `${garage.name} has submitted an offer for your request`,
    type: NotificationType.OFFER_RECEIVED,
    redirectUrl: `/user/requests/${request._id}`,
  });

  res.status(201).json({
    success: true,
    message: 'Offer submitted successfully',
    data: offer,
  });
});

// Get Offers for Request (User)
export const getOffersForRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;

  // Verify request ownership
  const request = await AssistanceRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.userId.toString() !== req.user!.userId && req.user!.role !== UserRole.ADMIN) {
    throw new ApiError(403, 'Access denied');
  }

  // Get all offers for this request
  const offers = await GarageOffer.find({ requestId })
    .populate('garageId', 'name phone address rating reviewCount visitingCharge location services')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: offers,
  });
});

// Accept Offer (User)
export const acceptOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { offerId } = req.params;

  // Get offer
  const offer = await GarageOffer.findById(offerId).populate('garageId');
  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  // Check if offer is still pending
  if (offer.status !== OfferStatus.PENDING) {
    throw new ApiError(400, 'This offer is no longer available');
  }

  // Check if expired
  if (new Date() > offer.expiresAt) {
    offer.status = OfferStatus.EXPIRED;
    await offer.save();
    throw new ApiError(400, 'This offer has expired');
  }

  // Get request and verify ownership
  const request = await AssistanceRequest.findById(offer.requestId);
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.userId.toString() !== req.user!.userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Check request status
  if (![RequestStatus.BROADCASTED, RequestStatus.OFFERS_RECEIVED].includes(request.status as any)) {
    throw new ApiError(400, 'This request is no longer accepting offers');
  }

  // Accept this offer
  offer.status = OfferStatus.ACCEPTED;
  offer.acceptedAt = new Date();
  await offer.save();

  // Reject all other offers for this request
  await GarageOffer.updateMany(
    {
      requestId: offer.requestId,
      _id: { $ne: offer._id },
      status: OfferStatus.PENDING,
    },
    {
      $set: {
        status: OfferStatus.REJECTED,
        rejectedAt: new Date(),
      },
    }
  );

  // Update request with selected garage
  request.garageId = offer.garageId._id as any;
  request.status = RequestStatus.GARAGE_SELECTED;
  request.statusHistory.push({
    status: RequestStatus.GARAGE_SELECTED,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
    notes: `User selected offer from ${(offer.garageId as any).name}`,
  });
  await request.save();

  // Notify selected garage
  const garage = await Garage.findById(offer.garageId).populate('owner');
  if (garage && garage.owner) {
    await createNotification({
      recipient: (garage.owner as any)._id || garage.owner,
      recipientRole: UserRole.GARAGE_OWNER,
      title: 'Your Offer Was Accepted',
      message: `User has accepted your offer. Please assign a mechanic.`,
      type: NotificationType.OFFER_ACCEPTED,
      redirectUrl: `/garage/requests/${request._id}`,
    });
  }

  res.json({
    success: true,
    message: 'Offer accepted successfully',
    data: { offer, request },
  });
});

// Withdraw Offer (Garage Owner)
export const withdrawOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { offerId } = req.params;

  // Get garage
  const garage = await Garage.findOne({ owner: req.user!.userId });
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  // Get offer
  const offer = await GarageOffer.findOne({
    _id: offerId,
    garageId: garage._id,
  });

  if (!offer) {
    throw new ApiError(404, 'Offer not found');
  }

  // Check if can be withdrawn
  if (offer.status !== OfferStatus.PENDING) {
    throw new ApiError(400, 'Only pending offers can be withdrawn');
  }

  offer.status = OfferStatus.WITHDRAWN;
  offer.withdrawnAt = new Date();
  await offer.save();

  res.json({
    success: true,
    message: 'Offer withdrawn successfully',
    data: offer,
  });
});

// Get My Offers (Garage Owner)
export const getMyOffers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const { status } = req.query;
  const filters: any = { garageId: garage._id };

  if (status) {
    filters.status = status;
  }

  const offers = await GarageOffer.find(filters)
    .populate('requestId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: offers,
  });
});
