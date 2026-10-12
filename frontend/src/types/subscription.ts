// Subscription Types - Frontend mirror of backend enums and interfaces

export enum SubscriptionPlan {
  // Driver Plans
  DRIVER_FREE = 'DRIVER_FREE',
  DRIVER_PRO = 'DRIVER_PRO',
  
  // Partner Plans
  PARTNER_FREE = 'PARTNER_FREE',
  PARTNER_PRO = 'PARTNER_PRO',
  PARTNER_BUSINESS = 'PARTNER_BUSINESS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export interface Subscription {
  _id: string;
  userId: string;
  garageId?: string;
  userRole: 'USER' | 'GARAGE_OWNER';
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  razorpayCustomerId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface MySubscriptionResponse {
  subscription: Subscription | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isFree: boolean;
}

export interface SubscriptionStatsBreakdown {
  _id: string;
  count: number;
  totalRevenue?: number;
}

export interface AllSubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  statistics: {
    statusBreakdown: SubscriptionStatsBreakdown[];
    planBreakdown: SubscriptionStatsBreakdown[];
  };
}

// Plan display information
export interface PlanInfo {
  name: string;
  displayName: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  color: string;
}

export const PLAN_DETAILS: Record<SubscriptionPlan, PlanInfo> = {
  [SubscriptionPlan.DRIVER_FREE]: {
    name: SubscriptionPlan.DRIVER_FREE,
    displayName: 'Free',
    price: { monthly: 0, annual: 0 },
    features: [
      'Emergency assistance requests',
      'Find nearby garages',
      'Basic vehicle management',
    ],
    color: 'gray',
  },
  [SubscriptionPlan.DRIVER_PRO]: {
    name: SubscriptionPlan.DRIVER_PRO,
    displayName: 'Pro',
    price: { monthly: 199, annual: 1999 },
    features: [
      'All Free features',
      'Complete service history',
      'Maintenance reminders',
      'Family vehicle management',
      'Member discounts',
      'Priority support',
    ],
    color: 'orange',
  },
  [SubscriptionPlan.PARTNER_FREE]: {
    name: SubscriptionPlan.PARTNER_FREE,
    displayName: 'Free Partner',
    price: { monthly: 0, annual: 0 },
    features: [
      'Basic garage profile',
      'Garage discovery listing',
      'Receive service requests',
    ],
    color: 'gray',
  },
  [SubscriptionPlan.PARTNER_PRO]: {
    name: SubscriptionPlan.PARTNER_PRO,
    displayName: 'Partner Pro',
    price: { monthly: 499, annual: 4999 },
    features: [
      'All Free features',
      'Enhanced garage profile',
      'Business analytics',
      'Promotional tools',
      'Priority support',
    ],
    color: 'orange',
  },
  [SubscriptionPlan.PARTNER_BUSINESS]: {
    name: SubscriptionPlan.PARTNER_BUSINESS,
    displayName: 'Partner Business',
    price: { monthly: 1499, annual: 14999 },
    features: [
      'All Pro features',
      'Advanced analytics',
      'Multi-location management',
      'Unlimited staff accounts',
      'Dedicated account manager',
    ],
    color: 'blue',
  },
};

// Helper functions
export const isPro = (plan: SubscriptionPlan): boolean => {
  return plan === SubscriptionPlan.DRIVER_PRO || 
         plan === SubscriptionPlan.PARTNER_PRO || 
         plan === SubscriptionPlan.PARTNER_BUSINESS;
};

export const isFree = (plan: SubscriptionPlan): boolean => {
  return plan === SubscriptionPlan.DRIVER_FREE || plan === SubscriptionPlan.PARTNER_FREE;
};

export const getPlanDisplayName = (plan: SubscriptionPlan): string => {
  return PLAN_DETAILS[plan]?.displayName || plan;
};

export const formatBillingInterval = (interval: BillingInterval): string => {
  return interval === BillingInterval.MONTHLY ? 'month' : 'year';
};

export const getStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return 'green';
    case SubscriptionStatus.PENDING:
      return 'yellow';
    case SubscriptionStatus.PAST_DUE:
      return 'orange';
    case SubscriptionStatus.CANCELLED:
    case SubscriptionStatus.EXPIRED:
      return 'red';
    default:
      return 'gray';
  }
};

export const getStatusLabel = (status: SubscriptionStatus): string => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return 'Active';
    case SubscriptionStatus.PENDING:
      return 'Pending Payment';
    case SubscriptionStatus.PAST_DUE:
      return 'Payment Due';
    case SubscriptionStatus.CANCELLED:
      return 'Cancelled';
    case SubscriptionStatus.EXPIRED:
      return 'Expired';
    default:
      return status;
  }
};

export const isActiveSubscription = (status: SubscriptionStatus): boolean => {
  return status === SubscriptionStatus.ACTIVE;
};

export const hasAccess = (subscription: MySubscriptionResponse | null): boolean => {
  if (!subscription) return false;
  return subscription.isFree === false && subscription.status === SubscriptionStatus.ACTIVE;
};
