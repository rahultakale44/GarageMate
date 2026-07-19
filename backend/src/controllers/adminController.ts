import { Response } from 'express';
import { AuthRequest, VerificationStatus, ComplaintStatus, NotificationType, UserRole } from '../types';
import { User } from '../models/User';
import { Garage } from '../models/Garage';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { Payment } from '../models/Payment';
import { Complaint } from '../models/Complaint';
import { Review } from '../models/Review';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '../utils/email';
import { createNotification } from '../services/notificationService';

// Dashboard Stats
export const getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalGarageOwners,
    totalGarages,
    verifiedGarages,
    pendingVerifications,
    activeRequests,
    completedRequests,
    totalPayments,
    pendingComplaints,
  ] = await Promise.all([
    User.countDocuments({ role: UserRole.USER }),
    User.countDocuments({ role: UserRole.GARAGE_OWNER }),
    Garage.countDocuments(),
    Garage.countDocuments({ verificationStatus: VerificationStatus.APPROVED }),
    Garage.countDocuments({ verificationStatus: VerificationStatus.PENDING }),
    AssistanceRequest.countDocuments({
      status: { $nin: ['CLOSED', 'CANCELLED', 'PAID'] },
    }),
    AssistanceRequest.countDocuments({
      status: { $in: ['CLOSED', 'PAID'] },
    }),
    Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Complaint.countDocuments({ status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.UNDER_REVIEW] } }),
  ]);

  const totalRevenue = totalPayments[0]?.total || 0;

  res.json({
    success: true,
    data: {
      totalUsers,
      totalGarageOwners,
      totalGarages,
      verifiedGarages,
      pendingVerifications,
      activeRequests,
      completedRequests,
      totalRevenue,
      pendingComplaints,
    },
  });
});

// Get All Users
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const filters: any = { role: UserRole.USER };
  
  if (req.query.search) {
    filters.$or = [
      { name: new RegExp(req.query.search as string, 'i') },
      { email: new RegExp(req.query.search as string, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Get All Garage Owners
export const getGarageOwners = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const filters: any = { role: UserRole.GARAGE_OWNER };
  
  if (req.query.search) {
    filters.$or = [
      { name: new RegExp(req.query.search as string, 'i') },
      { email: new RegExp(req.query.search as string, 'i') },
    ];
  }

  const [owners, total] = await Promise.all([
    User.find(filters).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: owners,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Get Garages for Verification
export const getVerificationQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = (req.query.status as VerificationStatus) || VerificationStatus.PENDING;

  const garages = await Garage.find({ verificationStatus: status })
    .populate('owner', 'name email phone')
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: garages,
  });
});

const appendVerificationHistory = (garage: any, status: VerificationStatus, notes?: string, changedBy?: string) => {
  const history = Array.isArray(garage.verificationHistory) ? garage.verificationHistory : [];
  history.push({
    status,
    changedAt: new Date(),
    changedBy: changedBy || 'admin',
    notes,
  });
  garage.verificationHistory = history;
};

// Get Garage Verification Details
export const getGarageVerificationDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findById(req.params.id).populate('owner', 'name email phone avatar');

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  res.json({
    success: true,
    data: garage,
  });
});

// Approve Garage
export const approveGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findById(req.params.id).populate('owner');

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  garage.verificationStatus = VerificationStatus.APPROVED;
  garage.verificationNotes = 'Verified and approved by admin';
  appendVerificationHistory(garage, VerificationStatus.APPROVED, 'Verified and approved by admin', req.user!.userId);
  await garage.save();

  await sendVerificationApprovedEmail((garage.owner as any).email, garage.name);

  await createNotification({
    recipient: garage.owner._id,
    recipientRole: UserRole.GARAGE_OWNER,
    title: 'Garage Verified',
    message: 'Your garage has been verified and approved',
    type: NotificationType.VERIFICATION_APPROVED,
    redirectUrl: '/garage/dashboard',
  });

  res.json({
    success: true,
    message: 'Garage approved successfully',
    data: garage,
  });
});

// Reject Garage
export const rejectGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const garage = await Garage.findById(req.params.id).populate('owner');

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  garage.verificationStatus = VerificationStatus.REJECTED;
  garage.verificationNotes = reason;
  appendVerificationHistory(garage, VerificationStatus.REJECTED, reason, req.user!.userId);
  await garage.save();

  await sendVerificationRejectedEmail((garage.owner as any).email, garage.name, reason);

  await createNotification({
    recipient: garage.owner._id,
    recipientRole: UserRole.GARAGE_OWNER,
    title: 'Garage Verification Rejected',
    message: 'Your garage verification was not approved',
    type: NotificationType.VERIFICATION_REJECTED,
    redirectUrl: '/garage/verification',
  });

  res.json({
    success: true,
    message: 'Garage rejected',
  });
});

// Request Changes
export const requestGarageChanges = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { notes } = req.body;

  if (!notes) {
    throw new ApiError(400, 'Change notes are required');
  }

  const garage = await Garage.findById(req.params.id);

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  garage.verificationStatus = VerificationStatus.CHANGES_REQUESTED;
  garage.verificationNotes = notes;
  appendVerificationHistory(garage, VerificationStatus.CHANGES_REQUESTED, notes, req.user!.userId);
  await garage.save();

  await createNotification({
    recipient: garage.owner,
    recipientRole: UserRole.GARAGE_OWNER,
    title: 'Changes Requested',
    message: 'Admin has requested changes to your garage profile',
    type: NotificationType.VERIFICATION_REJECTED,
    redirectUrl: '/garage/verification',
  });

  res.json({
    success: true,
    message: 'Change request sent',
  });
});

// Reactivate Garage
export const reactivateGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { notes } = req.body;

  const garage = await Garage.findById(req.params.id);

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  garage.verificationStatus = VerificationStatus.APPROVED;
  garage.verificationNotes = notes || 'Garage reactivated by admin';
  garage.isAvailable = true;
  appendVerificationHistory(garage, VerificationStatus.APPROVED, notes || 'Garage reactivated by admin', req.user!.userId);
  await garage.save();

  res.json({
    success: true,
    message: 'Garage reactivated',
    data: garage,
  });
});

// Suspend Garage
export const suspendGarage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  const garage = await Garage.findById(req.params.id);

  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  garage.verificationStatus = VerificationStatus.SUSPENDED;
  garage.verificationNotes = reason;
  garage.isAvailable = false;
  appendVerificationHistory(garage, VerificationStatus.SUSPENDED, reason, req.user!.userId);
  await garage.save();

  res.json({
    success: true,
    message: 'Garage suspended',
  });
});

// Block User
export const blockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === UserRole.ADMIN) {
    throw new ApiError(400, 'Cannot block admin users');
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
  });
});

// Get All Complaints
export const getAllComplaints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filters: any = {};

  if (status) {
    filters.status = status;
  }

  const complaints = await Complaint.find(filters)
    .populate('userId', 'name email')
    .populate('garageId', 'name')
    .populate('requestId', 'issueCategory')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: complaints,
  });
});

// Resolve Complaint
export const resolveComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { resolution, adminNotes } = req.body;

  if (!resolution) {
    throw new ApiError(400, 'Resolution is required');
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  complaint.status = ComplaintStatus.RESOLVED;
  complaint.resolution = resolution;
  complaint.adminNotes = adminNotes;
  complaint.resolvedBy = req.user!.userId as any;
  complaint.resolvedAt = new Date();
  await complaint.save();

  // Notify user
  await createNotification({
    recipient: complaint.userId,
    recipientRole: UserRole.USER,
    title: 'Complaint Resolved',
    message: 'Your complaint has been resolved',
    type: NotificationType.COMPLAINT_UPDATED,
    redirectUrl: `/user/complaints/${complaint._id}`,
  });

  res.json({
    success: true,
    message: 'Complaint resolved',
    data: complaint,
  });
});

// Get All Requests
export const getAllRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (status) {
    filters.status = status;
  }

  const [requests, total] = await Promise.all([
    AssistanceRequest.find(filters)
      .populate('userId', 'name email')
      .populate('garageId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    AssistanceRequest.countDocuments(filters),
  ]);

  res.json({
    success: true,
    data: requests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Get All Payments
export const getAllPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find()
      .populate('userId', 'name email')
      .populate('garageId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Payment.countDocuments(),
  ]);

  res.json({
    success: true,
    data: payments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Hide Review
export const hideReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  review.isHidden = !review.isHidden;
  await review.save();

  // Update garage rating
  const garage = await Garage.findById(review.garageId);
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
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
    message: `Review ${review.isHidden ? 'hidden' : 'visible'}`,
  });
});
