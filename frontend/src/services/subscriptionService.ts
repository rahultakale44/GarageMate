import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type {
  MySubscriptionResponse,
  AllSubscriptionsResponse,
  Subscription,
  SubscriptionPlan,
  BillingInterval,
  SubscriptionStatus,
} from '@/types/subscription';

/**
 * Subscription Service
 * Handles all subscription-related API calls
 */

// Get available plans for current user
export const getAvailablePlans = async (): Promise<any[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTIONS.PLANS);
  return response.data.data;
};

// Create subscription order (initiate payment)
export const createSubscriptionOrder = async (data: {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  garageId?: string;
}): Promise<{ orderId: string; amount: number; currency: string; subscriptionId: string }> => {
  const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTIONS.CREATE_ORDER, data);
  return response.data.data;
};

// Verify subscription payment
export const verifySubscriptionPayment = async (data: {
  orderId: string;
  paymentId: string;
  signature: string;
  subscriptionId: string;
}): Promise<Subscription> => {
  const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTIONS.VERIFY_PAYMENT, data);
  return response.data.data;
};

// Get current user's subscription
export const getMySubscription = async (): Promise<MySubscriptionResponse> => {
  const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTIONS.MY);
  return response.data.data;
};

// Get subscription by ID
export const getSubscriptionById = async (id: string): Promise<Subscription> => {
  const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTIONS.GET(id));
  return response.data.data;
};

// Create new subscription (initiate payment flow)
export const createSubscription = async (data: {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  garageId?: string;
}): Promise<{ subscription: Subscription; amount: number; paymentRequired: boolean }> => {
  const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTIONS.CREATE, data);
  return response.data.data;
};

// Cancel subscription
export const cancelSubscription = async (id: string): Promise<Subscription> => {
  const response = await axiosInstance.post(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL(id));
  return response.data.data;
};

// Admin: Get all subscriptions with filters
export const getAllSubscriptions = async (params?: {
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  role?: 'USER' | 'GARAGE_OWNER';
  page?: number;
  limit?: number;
}): Promise<AllSubscriptionsResponse> => {
  const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTIONS.ALL, { params });
  return response.data.data;
};

// Admin: Update subscription status
export const updateSubscriptionStatus = async (
  id: string,
  status: SubscriptionStatus
): Promise<Subscription> => {
  const response = await axiosInstance.patch(API_ENDPOINTS.SUBSCRIPTIONS.UPDATE_STATUS(id), { status });
  return response.data.data;
};

export default {
  getAvailablePlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscription,
  getSubscriptionById,
  createSubscription,
  cancelSubscription,
  getAllSubscriptions,
  updateSubscriptionStatus,
};
