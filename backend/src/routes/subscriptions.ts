import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getMySubscription,
  getSubscription,
  createSubscription,
  cancelSubscription,
  getAllSubscriptions,
  updateSubscriptionStatus,
  getAvailablePlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
} from '../controllers/subscriptionController';
import { UserRole } from '../types';

const router = Router();

// Public/authenticated routes
router.get('/plans', authenticate, getAvailablePlans);

// User/Garage routes (authenticated)
router.get('/my', authenticate, getMySubscription);
router.post('/create-order', authenticate, createSubscriptionOrder);
router.post('/verify-payment', authenticate, verifySubscriptionPayment);
router.post('/', authenticate, createSubscription);
router.post('/:id/cancel', authenticate, cancelSubscription);
router.get('/:id', authenticate, getSubscription);

// Admin routes
router.get('/', authenticate, authorize(UserRole.ADMIN), getAllSubscriptions);
router.patch('/:id/status', authenticate, authorize(UserRole.ADMIN), updateSubscriptionStatus);

export default router;
