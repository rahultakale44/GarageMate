import { Response } from 'express';
import { AuthRequest, RequestStatus, NotificationType, UserRole } from '../types';
import { Review } from '../models/Review';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { createNotification } from '../services/notificationService';

// Create Review
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId, rating, reviewMessage, serviceQuality, responseTime, priceFairness } = req.body;

  if (!requestId || !rating || !serviceQuality || !responseTime || !priceFairness) {
    throw new ApiError(400, 'All rating fields are required');
  }

  const request = await AssistanceRequest.findOne({
    _id: requestId,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.status !== RequestStatus.PAID && request.status !== RequestStatus.CLOSED) {
    throw new ApiError(400, 'Can only review completed and paid services');
  }

  if (!request.garageId) {
    throw new ApiError(400, 'No garage assigned to this request');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ requestId });
  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this service');
  }

  const review = await Review.create({
    userId: req.user!.userId,
    garageId: request.garageId,
    requestId,
    rating,
    reviewMessage,
    serviceQuality,
    responseTime,
    priceFairness,
  });

  // Update garage rating
  const garage = await Garage.findById(request.garageId);
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }
  
  const allReviews = await Review.find({ garageId: garage._id, isHidden: false });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  garage.rating = parseFloat(avgRating.toFixed(1));
  garage.reviewCount = allReviews.length;
  await garage.save();

  // Notify garage owner
  await createNotification({
    recipient: garage.owner,
    recipientRole: UserRole.GARAGE_OWNER,
    title: 'New Review Received',
    message: `You received a ${rating}-star review`,
    type: NotificationType.REVIEW_RECEIVED,
    redirectUrl: `/garage/reviews`,
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: review,
  });
});

// Get Garage Reviews
export const getGarageReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { garageId } = req.params;

  const reviews = await Review.find({
    garageId,
    isHidden: false,
  })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

// Get My Reviews (as user)
export const getMyReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reviews = await Review.find({ userId: req.user!.userId })
    .populate('garageId', 'name address')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

// Respond to Review (garage owner)
export const respondToReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { response } = req.body;

  if (!response || response.trim().length === 0) {
    throw new ApiError(400, 'Response cannot be empty');
  }

  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const review = await Review.findOne({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  review.garageResponse = response;
  review.garageResponseAt = new Date();
  await review.save();

  res.json({
    success: true,
    message: 'Response added successfully',
    data: review,
  });
});

// Delete Review (own review only)
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  // Update garage rating
  const garage = await Garage.findById(review.garageId);
  
  if (!garage) {
    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
    return;
  }
  
  const allReviews = await Review.find({ garageId: garage._id, isHidden: false });
  
  if (allReviews.length > 0) {
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    garage.rating = parseFloat(avgRating.toFixed(1));
  } else {
    garage.rating = 0;
  }
  
  garage.reviewCount = allReviews.length;
  await garage.save();

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});
