import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/Subscription';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Middleware to check if user has an active Pro subscription
 * Can be used to protect premium features
 */
export const requireProSubscription = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;

    // Fetch user's active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
    }).sort({ createdAt: -1 });

    // Check if user has any pro plan
    const proPlans = [
      SubscriptionPlan.DRIVER_PRO,
      SubscriptionPlan.PARTNER_PRO,
      SubscriptionPlan.PARTNER_BUSINESS,
    ];

    if (!subscription || !proPlans.includes(subscription.plan)) {
      throw new ApiError(
        403,
        'This feature requires a Pro subscription. Please upgrade your account to access premium features.'
      );
    }

    // Check if subscription has expired (additional safety check)
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
      throw new ApiError(
        403,
        'Your subscription has expired. Please renew to continue accessing Pro features.'
      );
    }

    // Attach subscription info to request for downstream use
    req.subscription = subscription;

    next();
  }
);

/**
 * Middleware to check if user has a specific plan
 * @param requiredPlan - The subscription plan required to access the feature
 */
export const requirePlan = (requiredPlan: SubscriptionPlan) => {
  return asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;

    // Fetch user's active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
    }).sort({ createdAt: -1 });

    if (!subscription || subscription.plan !== requiredPlan) {
      throw new ApiError(
        403,
        `This feature requires ${requiredPlan} subscription. Please upgrade to access this feature.`
      );
    }

    // Check if subscription has expired
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
      throw new ApiError(
        403,
        'Your subscription has expired. Please renew to continue accessing features.'
      );
    }

    // Attach subscription info to request
    req.subscription = subscription;

    next();
  });
};

/**
 * Middleware to check if user has any of the specified plans
 * @param allowedPlans - Array of subscription plans that are allowed
 */
export const requireAnyOfPlans = (allowedPlans: SubscriptionPlan[]) => {
  return asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;

    // Fetch user's active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
    }).sort({ createdAt: -1 });

    if (!subscription || !allowedPlans.includes(subscription.plan)) {
      const planNames = allowedPlans.join(', ');
      throw new ApiError(
        403,
        `This feature requires one of the following subscriptions: ${planNames}. Please upgrade to access this feature.`
      );
    }

    // Check if subscription has expired
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
      throw new ApiError(
        403,
        'Your subscription has expired. Please renew to continue accessing features.'
      );
    }

    // Attach subscription info to request
    req.subscription = subscription;

    next();
  });
};

/**
 * Middleware to check if garage owner has an active partner subscription
 * Specifically for garage-related premium features
 */
export const requirePartnerSubscription = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Only for garage owners
    if (userRole !== UserRole.GARAGE_OWNER) {
      throw new ApiError(403, 'This feature is only available for garage owners.');
    }

    // Fetch active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
    }).sort({ createdAt: -1 });

    // Check if has partner pro or business plan
    const partnerPlans = [SubscriptionPlan.PARTNER_PRO, SubscriptionPlan.PARTNER_BUSINESS];

    if (!subscription || !partnerPlans.includes(subscription.plan)) {
      throw new ApiError(
        403,
        'This feature requires a Partner Pro or Business subscription. Please upgrade to access analytics and advanced features.'
      );
    }

    // Check expiration
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
      throw new ApiError(
        403,
        'Your subscription has expired. Please renew to continue accessing Partner features.'
      );
    }

    // Attach subscription
    req.subscription = subscription;

    next();
  }
);

/**
 * Middleware to check if user has Driver Pro subscription
 * Specifically for driver-related premium features
 */
export const requireDriverProSubscription = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Only for users (drivers)
    if (userRole !== UserRole.USER) {
      throw new ApiError(403, 'This feature is only available for drivers.');
    }

    // Fetch active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
      plan: SubscriptionPlan.DRIVER_PRO,
    }).sort({ createdAt: -1 });

    if (!subscription) {
      throw new ApiError(
        403,
        'This feature requires Driver Pro subscription. Please upgrade to access premium features.'
      );
    }

    // Check expiration
    const now = new Date();
    if (subscription.currentPeriodEnd < now) {
      throw new ApiError(
        403,
        'Your Driver Pro subscription has expired. Please renew to continue accessing features.'
      );
    }

    // Attach subscription
    req.subscription = subscription;

    next();
  }
);

/**
 * Soft check middleware - adds subscription info to request but doesn't block
 * Useful for features that should work differently for Pro vs Free users
 */
export const checkSubscription = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;

    try {
      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
      }).sort({ createdAt: -1 });

      // Attach subscription info (or null if none exists)
      req.subscription = subscription || null;
    } catch (error) {
      // Don't block request on error, just set null
      req.subscription = null;
    }

    next();
  }
);
