import { Response } from 'express';
import { AuthRequest, UserRole } from '../types';
import { Subscription, SubscriptionPlan, SubscriptionStatus, BillingInterval } from '../models/Subscription';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// Get my subscription
export const getMySubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const subscription = await Subscription.findOne({ 
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.PENDING] }
  }).sort({ createdAt: -1 });

  // If no active subscription, return free plan
  if (!subscription) {
    const freePlan = userRole === UserRole.USER ? SubscriptionPlan.DRIVER_FREE : SubscriptionPlan.PARTNER_FREE;
    
    res.json({
      success: true,
      data: {
        subscription: null,
        plan: freePlan,
        status: SubscriptionStatus.ACTIVE,
        isFree: true,
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      subscription,
      plan: subscription.plan,
      status: subscription.status,
      isFree: false,
    },
  });
});

// Get subscription by ID (admin/self)
export const getSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id)
    .populate('userId', 'name email')
    .populate('garageId', 'name');

  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }

  // Check authorization (admin or owner)
  if (req.user!.role !== UserRole.ADMIN && subscription.userId.toString() !== req.user!.userId) {
    throw new ApiError(403, 'Unauthorized to view this subscription');
  }

  res.json({
    success: true,
    data: subscription,
  });
});

// Create subscription (placeholder for Razorpay integration)
export const createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plan, billingInterval, garageId } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Validate plan based on role
  if (userRole === UserRole.USER && ![SubscriptionPlan.DRIVER_PRO].includes(plan)) {
    throw new ApiError(400, 'Invalid plan for user role');
  }

  if (userRole === UserRole.GARAGE_OWNER && 
      ![SubscriptionPlan.PARTNER_PRO, SubscriptionPlan.PARTNER_BUSINESS].includes(plan)) {
    throw new ApiError(400, 'Invalid plan for garage owner role');
  }

  // Check if user already has an active subscription
  const existing = await Subscription.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] }
  });

  if (existing) {
    throw new ApiError(400, 'You already have an active subscription. Please cancel or upgrade your current plan.');
  }

  // Validate garage for garage owners
  if (userRole === UserRole.GARAGE_OWNER) {
    if (!garageId) {
      throw new ApiError(400, 'Garage ID is required for garage owner subscriptions');
    }

    const garage = await Garage.findOne({ _id: garageId, owner: userId });
    if (!garage) {
      throw new ApiError(404, 'Garage not found or unauthorized');
    }
  }

  // Calculate amount based on plan and interval
  const planPricing: Record<string, { monthly: number; annual: number }> = {
    [SubscriptionPlan.DRIVER_PRO]: { monthly: 199, annual: 1999 }, // ~17% discount
    [SubscriptionPlan.PARTNER_PRO]: { monthly: 499, annual: 4999 },
    [SubscriptionPlan.PARTNER_BUSINESS]: { monthly: 1499, annual: 14999 },
  };

  const pricing = planPricing[plan];
  if (!pricing) {
    throw new ApiError(400, 'Invalid subscription plan');
  }

  const amount = billingInterval === BillingInterval.ANNUAL ? pricing.annual : pricing.monthly;

  // Calculate period dates
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingInterval === BillingInterval.MONTHLY) {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Create subscription (PENDING until payment is verified)
  const subscription = await Subscription.create({
    userId,
    garageId: userRole === UserRole.GARAGE_OWNER ? garageId : undefined,
    userRole,
    plan,
    status: SubscriptionStatus.PENDING,
    billingInterval,
    amount,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });

  res.status(201).json({
    success: true,
    message: 'Subscription created. Please complete payment to activate.',
    data: {
      subscription,
      amount,
      // Note: In production, create Razorpay order here
      paymentRequired: true,
    },
  });
});

// Cancel subscription
export const cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const subscription = await Subscription.findById(id);

  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }

  // Check authorization
  if (subscription.userId.toString() !== userId && req.user!.role !== UserRole.ADMIN) {
    throw new ApiError(403, 'Unauthorized to cancel this subscription');
  }

  if (subscription.status === SubscriptionStatus.CANCELLED) {
    throw new ApiError(400, 'Subscription is already cancelled');
  }

  // Mark for cancellation at period end (don't cancel immediately)
  subscription.cancelAtPeriodEnd = true;
  subscription.cancelledAt = new Date();
  await subscription.save();

  res.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the current billing period',
    data: subscription,
  });
});

// Admin: Get all subscriptions
export const getAllSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, plan, role, page = 1, limit = 20 } = req.query;

  const query: any = {};

  if (status) {
    query.status = status;
  }

  if (plan) {
    query.plan = plan;
  }

  if (role) {
    query.userRole = role;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const subscriptions = await Subscription.find(query)
    .populate('userId', 'name email mobile')
    .populate('garageId', 'name city')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip);

  const total = await Subscription.countDocuments(query);

  // Get statistics
  const stats = await Subscription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
      },
    },
  ]);

  const planBreakdown = await Subscription.aggregate([
    {
      $match: { status: SubscriptionStatus.ACTIVE },
    },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
      statistics: {
        statusBreakdown: stats,
        planBreakdown,
      },
    },
  });
});

// Admin: Update subscription status
export const updateSubscriptionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const subscription = await Subscription.findById(id);

  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }

  subscription.status = status;
  await subscription.save();

  res.json({
    success: true,
    message: 'Subscription status updated',
    data: subscription,
  });
});
