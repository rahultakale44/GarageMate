import { Response } from 'express';
import { AuthRequest, ComplaintStatus, UserRole } from '../types';
import { Complaint } from '../models/Complaint';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// Create Complaint
export const createComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId, category, description } = req.body;

  if (!requestId || !category || !description) {
    throw new ApiError(400, 'Request ID, category, and description are required');
  }

  const request = await AssistanceRequest.findOne({
    _id: requestId,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  const complaint = await Complaint.create({
    userId: req.user!.userId,
    requestId,
    garageId: request.garageId,
    category,
    description,
    status: ComplaintStatus.OPEN,
  });

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: complaint,
  });
});

// Get My Complaints
export const getMyComplaints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const complaints = await Complaint.find({ userId: req.user!.userId })
    .populate('requestId', 'issueCategory address')
    .populate('garageId', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: complaints,
  });
});

// Get Single Complaint
export const getComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('requestId')
    .populate('garageId')
    .populate('resolvedBy', 'name');

  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  // Authorization
  const isOwner = complaint.userId._id.toString() === req.user!.userId;
  const isAdmin = req.user!.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: complaint,
  });
});
