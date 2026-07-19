import { Response } from 'express';
import { AuthRequest, QuotationStatus, RequestStatus, NotificationType, UserRole } from '../types';
import { Quotation } from '../models/Quotation';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { createQuotationSchema } from '../validations/quotation';
import { createNotification } from '../services/notificationService';

// Create Quotation
export const createQuotation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = createQuotationSchema.parse(req.body);

  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const request = await AssistanceRequest.findOne({
    _id: validatedData.requestId,
    garageId: garage._id,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.status !== RequestStatus.INSPECTION_STARTED && request.status !== RequestStatus.MECHANIC_ARRIVED) {
    throw new ApiError(400, 'Cannot create quotation at this stage');
  }

  // Calculate total
  const partsTotal = (validatedData.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
  const subtotal = validatedData.labourCharge + validatedData.visitingCharge + partsTotal;
  const tax = validatedData.tax || 0;
  const discount = validatedData.discount || 0;
  const totalAmount = subtotal + tax - discount;

  const quotation = await Quotation.create({
    requestId: request._id,
    garageId: garage._id,
    userId: request.userId,
    inspectionNotes: validatedData.inspectionNotes,
    labourCharge: validatedData.labourCharge,
    visitingCharge: validatedData.visitingCharge,
    parts: validatedData.parts || [],
    tax,
    discount,
    totalAmount,
    estimatedRepairTime: validatedData.estimatedRepairTime,
    terms: validatedData.terms,
    validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: QuotationStatus.DRAFT,
  });

  res.status(201).json({
    success: true,
    message: 'Quotation created successfully',
    data: quotation,
  });
});

// Send Quotation to User
export const sendQuotation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const quotation = await Quotation.findOne({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  quotation.status = QuotationStatus.SENT;
  await quotation.save();

  // Update request status
  await AssistanceRequest.findByIdAndUpdate(quotation.requestId, {
    status: RequestStatus.QUOTATION_SENT,
    estimatedCost: quotation.totalAmount,
    $push: {
      statusHistory: {
        status: RequestStatus.QUOTATION_SENT,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      },
    },
  });

  // Notify user
  await createNotification({
    recipient: quotation.userId,
    recipientRole: UserRole.USER,
    title: 'Quotation Received',
    message: `You have received a quotation for ₹${quotation.totalAmount}`,
    type: NotificationType.QUOTATION_RECEIVED,
    redirectUrl: `/user/requests/${quotation.requestId}`,
  });

  res.json({
    success: true,
    message: 'Quotation sent to customer',
    data: quotation,
  });
});

// Get Quotation
export const getQuotation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('garageId', 'name phone address')
    .populate('requestId');

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  // Authorization
  const isUser = quotation.userId.toString() === req.user!.userId;
  const garage = await Garage.findOne({ _id: quotation.garageId, owner: req.user!.userId });
  const isGarageOwner = !!garage;
  const isAdmin = req.user!.role === UserRole.ADMIN;

  if (!isUser && !isGarageOwner && !isAdmin) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: quotation,
  });
});

// Get Quotation by Request
export const getQuotationByRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quotation = await Quotation.findOne({ requestId: req.params.requestId })
    .populate('garageId', 'name phone address')
    .sort({ createdAt: -1 });

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  // Authorization
  const isUser = quotation.userId.toString() === req.user!.userId;
  const garage = await Garage.findOne({ _id: quotation.garageId, owner: req.user!.userId });
  const isGarageOwner = !!garage;

  if (!isUser && !isGarageOwner) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: quotation,
  });
});

// Approve Quotation (by user)
export const approveQuotation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quotation = await Quotation.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (quotation.status !== QuotationStatus.SENT) {
    throw new ApiError(400, 'Quotation cannot be approved');
  }

  if (quotation.validUntil < new Date()) {
    throw new ApiError(400, 'Quotation has expired');
  }

  quotation.status = QuotationStatus.APPROVED;
  quotation.approvedAt = new Date();
  await quotation.save();

  // Update request
  await AssistanceRequest.findByIdAndUpdate(quotation.requestId, {
    status: RequestStatus.QUOTATION_APPROVED,
    finalCost: quotation.totalAmount,
    $push: {
      statusHistory: {
        status: RequestStatus.QUOTATION_APPROVED,
        updatedBy: req.user!.userId,
        updatedAt: new Date(),
      },
    },
  });

  // Notify garage
  const garageData = await Garage.findById(quotation.garageId).select('owner');
  if (garageData) {
    await createNotification({
      recipient: garageData.owner,
      recipientRole: UserRole.GARAGE_OWNER,
      title: 'Quotation Approved',
      message: 'Customer has approved your quotation',
      type: NotificationType.QUOTATION_APPROVED,
      redirectUrl: `/garage/requests/${quotation.requestId}`,
    });
  }

  res.json({
    success: true,
    message: 'Quotation approved successfully',
    data: quotation,
  });
});

// Reject Quotation (by user)
export const rejectQuotation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  const quotation = await Quotation.findOne({
    _id: req.params.id,
    userId: req.user!.userId,
  });

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (quotation.status !== QuotationStatus.SENT) {
    throw new ApiError(400, 'Quotation cannot be rejected');
  }

  quotation.status = QuotationStatus.REJECTED;
  quotation.rejectedAt = new Date();
  quotation.rejectionReason = reason;
  await quotation.save();

  res.json({
    success: true,
    message: 'Quotation rejected',
    data: quotation,
  });
});

// Update Quotation
export const updateQuotation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const quotation = await Quotation.findOne({
    _id: req.params.id,
    garageId: garage._id,
  });

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (quotation.status !== QuotationStatus.DRAFT) {
    throw new ApiError(400, 'Cannot update sent quotation');
  }

  const validatedData = createQuotationSchema.parse(req.body);

  // Recalculate total
  const partsTotal = (validatedData.parts || []).reduce((sum, part) => sum + (part.quantity * part.price), 0);
  const subtotal = validatedData.labourCharge + validatedData.visitingCharge + partsTotal;
  const tax = validatedData.tax || 0;
  const discount = validatedData.discount || 0;
  const totalAmount = subtotal + tax - discount;

  quotation.inspectionNotes = validatedData.inspectionNotes;
  quotation.labourCharge = validatedData.labourCharge;
  quotation.visitingCharge = validatedData.visitingCharge;
  quotation.parts = validatedData.parts || [];
  quotation.tax = tax;
  quotation.discount = discount;
  quotation.totalAmount = totalAmount;
  quotation.estimatedRepairTime = validatedData.estimatedRepairTime;
  quotation.terms = validatedData.terms;

  await quotation.save();

  res.json({
    success: true,
    message: 'Quotation updated successfully',
    data: quotation,
  });
});
