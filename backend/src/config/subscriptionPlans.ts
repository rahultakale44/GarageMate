/**
 * Subscription Plans Configuration
 * 
 * This is the single source of truth for all subscription pricing and features.
 * Backend determines prices - never trust client-supplied amounts.
 */

import { SubscriptionPlan, BillingInterval } from '../models/Subscription';
import { UserRole } from '../types';

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  role: UserRole;
  pricing: {
    monthly: number; // in INR
    annual: number; // in INR
  };
  features: string[];
  isPurchasable: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.DRIVER_FREE]: {
    id: SubscriptionPlan.DRIVER_FREE,
    name: 'Free',
    role: UserRole.USER,
    pricing: {
      monthly: 0,
      annual: 0,
    },
    features: [
      'Emergency assistance requests',
      'Find nearby garages',
      'Basic vehicle management',
    ],
    isPurchasable: false, // Free plan is default
  },

  [SubscriptionPlan.DRIVER_PRO]: {
    id: SubscriptionPlan.DRIVER_PRO,
    name: 'Driver Pro',
    role: UserRole.USER,
    pricing: {
      monthly: 199,
      annual: 1999, // ~17% discount
    },
    features: [
      'All Free features',
      'Complete service history',
      'Maintenance reminders',
      'Family vehicle management',
      'Member discounts',
      'Priority support',
    ],
    isPurchasable: true,
  },

  [SubscriptionPlan.PARTNER_FREE]: {
    id: SubscriptionPlan.PARTNER_FREE,
    name: 'Free Partner',
    role: UserRole.GARAGE_OWNER,
    pricing: {
      monthly: 0,
      annual: 0,
    },
    features: [
      'Basic garage profile',
      'Garage discovery listing',
      'Receive service requests',
    ],
    isPurchasable: false, // Free plan is default
  },

  [SubscriptionPlan.PARTNER_PRO]: {
    id: SubscriptionPlan.PARTNER_PRO,
    name: 'Partner Pro',
    role: UserRole.GARAGE_OWNER,
    pricing: {
      monthly: 499,
      annual: 4999, // ~17% discount
    },
    features: [
      'All Free features',
      'Enhanced garage profile',
      'Business analytics',
      'Promotional tools',
      'Priority support',
    ],
    isPurchasable: true,
  },

  [SubscriptionPlan.PARTNER_BUSINESS]: {
    id: SubscriptionPlan.PARTNER_BUSINESS,
    name: 'Partner Business',
    role: UserRole.GARAGE_OWNER,
    pricing: {
      monthly: 1499,
      annual: 14999, // ~17% discount
    },
    features: [
      'All Pro features',
      'Advanced analytics',
      'Multi-location management',
      'Unlimited staff accounts',
      'Dedicated account manager',
    ],
    isPurchasable: true,
  },
};

/**
 * Get plan configuration by ID
 */
export const getPlanConfig = (planId: SubscriptionPlan): PlanConfig | null => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

/**
 * Get amount for a plan and billing interval
 * Returns amount in paise (multiply by 100 for Razorpay)
 */
export const getPlanAmount = (planId: SubscriptionPlan, interval: BillingInterval): number => {
  const plan = getPlanConfig(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  return interval === BillingInterval.MONTHLY ? plan.pricing.monthly : plan.pricing.annual;
};

/**
 * Validate if a plan can be purchased by a user role
 */
export const canPurchasePlan = (planId: SubscriptionPlan, userRole: UserRole): boolean => {
  const plan = getPlanConfig(planId);
  if (!plan) return false;
  
  return plan.isPurchasable && plan.role === userRole;
};

/**
 * Get all purchasable plans for a specific role
 */
export const getPlansForRole = (role: UserRole): PlanConfig[] => {
  return Object.values(SUBSCRIPTION_PLANS).filter(
    (plan) => plan.role === role && plan.isPurchasable
  );
};

/**
 * Calculate period end date based on billing interval
 */
export const calculatePeriodEnd = (startDate: Date, interval: BillingInterval): Date => {
  const endDate = new Date(startDate);
  
  if (interval === BillingInterval.MONTHLY) {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  return endDate;
};
