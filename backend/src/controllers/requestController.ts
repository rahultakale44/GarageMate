import { Response } from 'express';
import { AuthRequest, RequestStatus, UserRole, NotificationType, MechanicStatus } from '../types';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { Vehicle } from '../models/Vehicle';
import { Garage } from '../models/Garage';
import { Mechanic } from '../models/Mechanic';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { createRequestSchema, assignMechanicSchema, verifyCompletionOTPSchema } from '../validations/request';
import { DEFAULT_BOOKING_FEE } from '../constants';
import { generateOTP } from '../utils/helpers';
import { createNotification } from '../services/notificationService';

const isValidTransition = (currentStatus: RequestStatus, nextStatus: RequestStatus) => {
  const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
    [RequestStatus.DRAFT]: [RequestStatus.PAYMENT_PENDING, RequestStatus.CANCELLED],
    [RequestStatus.PAYMENT_PENDING]: [RequestStatus.SEARCHING_GARAGE, RequestStatus.CANCELLED],
    [RequestStatus.SEARCHING_GARAGE]: [RequestStatus.REQUEST_SENT, RequestStatus.CANCELLED],
    [RequestStatus.REQUEST_SENT]: [RequestStatus.GARAGE_ACCEPTED, RequestStatus.CANCELLED],
    [RequestStatus.GARAGE_ACCEPTED]: [RequestStatus.MECHANIC_ASSIGNED, RequestStatus.CANCELLED],
    [RequestStatus.MECHANIC_ASSIGNED]: [RequestStatus.MECHANIC_ON_THE_WAY, RequestStatus.CANCELLED],
    [RequestStatus.MECHANIC_ON_THE_WAY]: [RequestStatus.MECHANIC_ARRIVED, RequestStatus.CANCELLED],
    [RequestStatus.MECHANIC_ARRIVED]: [RequestStatus.INSPECTION_STARTED, RequestStatus.CANCELLED],
    [RequestStatus.INSPECTION_STARTED]: [RequestStatus.QUOTATION_SENT, RequestStatus.CANCELLED],
    [RequestStatus.QUOTATION_SENT]: [RequestStatus.QUOTATION_APPROVED, RequestStatus.CANCELLED],
    [RequestStatus.QUOTATION_APPROVED]: [RequestStatus.SERVICE_IN_PROGRESS, RequestStatus.CANCELLED],
    [RequestStatus.SERVICE_IN_PROGRESS]: [RequestStatus.SERVICE_COMPLETED, RequestStatus.CANCELLED],
    [RequestStatus.SERVICE_COMPLETED]: [RequestStatus.FINAL_PAYMENT_PENDING, RequestStatus.CLOSED, RequestStatus.DISPUTED],
    [RequestStatus.FINAL_PAYMENT_PENDING]: [RequestStatus.PAID, RequestStatus.CANCELLED, RequestStatus.DISPUTED],
    [RequestStatus.PAID]: [RequestStatus.CLOSED, RequestStatus.DISPUTED],
    [RequestStatus.CLOSED]: [],
    [RequestStatus.CANCELLED]: [],
    [RequestStatus.DISPUTED]: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) || false;
};

// Create Assistance Request
export const createRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = createRequestSchema.parse(req.body);

  // Verify vehicle ownership
  const vehicle = await Vehicle.findOne({
    _id: validatedData.vehicleId,
    userId: req.user!.userId,
  });

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  const request = await AssistanceRequest.create({
    userId: req.user!.userId,
    vehicleId: validatedData.vehicleId,
    garageId: validatedData.garageId,
    issueCategory: validatedData.issueCategory,
    issueDescription: validatedData.issueDescription,
    issueImages: validatedData.issueImages || [],
    location: {
      type: 'Point',
      coordinates: [validatedData.longitude, validatedData.latitude],
    },
    address: validatedData.address,
    landmark: validatedData.landmark,
    city: validatedData.city,
    state: validatedData.state,
    pincode: validatedData.pincode,
    urgency: validatedData.urgency || 'MEDIUM',
    bookingFee: DEFAULT_BOOKING_FEE,
    status: RequestStatus.PAYMENT_PENDING,
    statusHistory: [
      {
        status: RequestStatus.DRAFT,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      },
      {
        status: RequestStatus.PAYMENT_PENDING,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: 'Request created successfully. Please complete payment.',
    data: request,
  });
});

// Get My Requests (for users)
export const getMyRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filters: any = { userId: req.user!.userId };

  if (status) {
    filters.status = status;
  }

  const requests = await AssistanceRequest.find(filters)
    .populate('vehicleId')
    .populate('garageId', 'name phone address rating')
    .populate('mechanicId', 'name phone avatar')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests,
  });
});

// Get Garage Requests (for garage owners)
export const getGarageRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const { status } = req.query;
  const filters: any = {};

  if (status) {
    filters.status = status;
  } else {
    // Default: show pending and active requests
    filters.status = {
      $in: [
        RequestStatus.PAYMENT_PENDING,
        RequestStatus.SEARCHING_GARAGE,
        RequestStatus.REQUEST_SENT,
        RequestStatus.GARAGE_ACCEPTED,
        RequestStatus.MECHANIC_ASSIGNED,
        RequestStatus.MECHANIC_ON_THE_WAY,
        RequestStatus.MECHANIC_ARRIVED,
        RequestStatus.INSPECTION_STARTED,
        RequestStatus.QUOTATION_SENT,
        RequestStatus.QUOTATION_APPROVED,
        RequestStatus.SERVICE_IN_PROGRESS,
      ],
    };
  }

  // Find requests within service radius
  filters.location = {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: garage.location.coordinates,
      },
      $maxDistance: garage.serviceRadius * 1000,
    },
  };

  const requests = await AssistanceRequest.find(filters)
    .populate('userId', 'name phone avatar')
    .populate('vehicleId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests,
  });
});

// Get Single Request
export const getRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const request = await AssistanceRequest.findById(req.params.id)
    .populate('userId', 'name phone avatar email')
    .populate('vehicleId')
    .populate('garageId')
    .populate('mechanicId');

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  // Authorization check
  const isOwner = request.userId._id.toString() === req.user!.userId;
  const isGarageOwner = request.garageId && (await Garage.findOne({ _id: request.garageId, owner: req.user!.userId }));
  const isAdmin = req.user!.role === UserRole.ADMIN;

  if (!isOwner && !isGarageOwner && !isAdmin) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: request,
  });
});

// Accept Request (for garage owners)
export const acceptRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const request = await AssistanceRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!isValidTransition(request.status as RequestStatus, RequestStatus.GARAGE_ACCEPTED)) {
    throw new ApiError(400, 'Request is not available');
  }

  request.garageId = garage._id as any;
  request.status = RequestStatus.GARAGE_ACCEPTED;
  request.statusHistory.push({
    status: RequestStatus.GARAGE_ACCEPTED,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
  });

  await request.save();

  // Notify user
  await createNotification({
    recipient: request.userId,
    recipientRole: UserRole.USER,
    title: 'Garage Accepted Your Request',
    message: `${garage.name} has accepted your assistance request`,
    type: NotificationType.GARAGE_ACCEPTED,
    redirectUrl: `/user/requests/${request._id}`,
  });

  res.json({
    success: true,
    message: 'Request accepted successfully',
    data: request,
  });
});

// Reject Request (for garage owners)
export const rejectRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const request = await AssistanceRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!isValidTransition(request.status as RequestStatus, RequestStatus.REQUEST_SENT)) {
    throw new ApiError(400, 'Cannot reject this request');
  }

  request.status = RequestStatus.REQUEST_SENT;
  request.statusHistory.push({
    status: RequestStatus.REQUEST_SENT,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
    notes: 'Garage rejected the request',
  });
  await request.save();

  // Notify user
  await createNotification({
    recipient: request.userId,
    recipientRole: UserRole.USER,
    title: 'Garage Declined Request',
    message: `${garage.name} is unable to accept your request`,
    type: NotificationType.GARAGE_REJECTED,
  });

  res.json({
    success: true,
    message: 'Request rejected',
  });
});

// Assign Mechanic
export const assignMechanic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = assignMechanicSchema.parse(req.body);
  
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const request = await AssistanceRequest.findOne({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  const mechanic = await Mechanic.findOne({
    _id: validatedData.mechanicId,
    garageId: garage._id,
  });

  if (!mechanic) {
    throw new ApiError(404, 'Mechanic not found');
  }

  if (mechanic.status !== MechanicStatus.AVAILABLE) {
    throw new ApiError(400, 'Mechanic is not available');
  }

  if (!isValidTransition(request.status as RequestStatus, RequestStatus.MECHANIC_ASSIGNED)) {
    throw new ApiError(400, 'Mechanic cannot be assigned in the current status');
  }

  request.mechanicId = mechanic._id as any;
  request.status = RequestStatus.MECHANIC_ASSIGNED;
  request.statusHistory.push({
    status: RequestStatus.MECHANIC_ASSIGNED,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
  });

  await request.save();

  mechanic.status = 'ASSIGNED' as any;
  mechanic.currentRequestId = request._id as any;
  await mechanic.save();

  // Notify user
  await createNotification({
    recipient: request.userId,
    recipientRole: UserRole.USER,
    title: 'Mechanic Assigned',
    message: `${mechanic.name} has been assigned to your request`,
    type: NotificationType.MECHANIC_ASSIGNED,
    redirectUrl: `/user/requests/${request._id}`,
  });

  res.json({
    success: true,
    message: 'Mechanic assigned successfully',
    data: request,
  });
});

// Update Request Status
export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, notes } = req.body;

  const request = await AssistanceRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  // Authorization
  const garage = await Garage.findOne({ _id: request.garageId, owner: req.user!.userId });
  const isOwner = request.userId.toString() === req.user!.userId;
  
  if (!garage && !isOwner && req.user!.role !== UserRole.ADMIN) {
    throw new ApiError(403, 'Access denied');
  }

  const nextStatus = status as RequestStatus;
  if (!Object.values(RequestStatus).includes(nextStatus)) {
    throw new ApiError(400, 'Invalid status');
  }

  if (!isValidTransition(request.status as RequestStatus, nextStatus)) {
    throw new ApiError(400, 'Invalid status transition');
  }

  request.status = nextStatus;
  request.statusHistory.push({
    status: nextStatus,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
    notes,
  });

  await request.save();

  res.json({
    success: true,
    message: 'Status updated successfully',
    data: request,
  });
});

// Generate Completion OTP
export const generateCompletionOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const request = await AssistanceRequest.findOne({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.status !== RequestStatus.SERVICE_IN_PROGRESS && request.status !== RequestStatus.SERVICE_COMPLETED) {
    throw new ApiError(400, 'Service must be in progress or completed');
  }

  const otp = generateOTP();
  request.completionOTP = otp;
  request.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await request.save();

  res.json({
    success: true,
    message: 'OTP generated and sent to customer',
    data: { otp }, // In production, send via SMS
  });
});

// Verify Completion OTP (by user)
export const verifyCompletionOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = verifyCompletionOTPSchema.parse(req.body);

  const request = await AssistanceRequest.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!request.completionOTP || !request.otpExpiresAt) {
    throw new ApiError(400, 'OTP not generated');
  }

  if (request.otpExpiresAt < new Date()) {
    throw new ApiError(400, 'OTP expired');
  }

  if (request.completionOTP !== validatedData.otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  request.status = RequestStatus.SERVICE_COMPLETED;
  request.statusHistory.push({
    status: RequestStatus.SERVICE_COMPLETED,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
    notes: 'Verified by user with OTP',
  });

  request.completionOTP = undefined;
  request.otpExpiresAt = undefined;

  await request.save();

  res.json({
    success: true,
    message: 'Service completion verified',
    data: request,
  });
});

// Cancel Request
export const cancelRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  const request = await AssistanceRequest.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!isValidTransition(request.status as RequestStatus, RequestStatus.CANCELLED)) {
    throw new ApiError(400, 'Cannot cancel this request');
  }

  request.status = RequestStatus.CANCELLED;
  request.statusHistory.push({
    status: RequestStatus.CANCELLED,
    updatedBy: req.user!.userId as any,
    updatedAt: new Date(),
    notes: reason,
  });

  await request.save();

  res.json({
    success: true,
    message: 'Request cancelled successfully',
  });
});
