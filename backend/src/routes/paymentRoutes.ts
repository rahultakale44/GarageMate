import { Router } from 'express';
import {
  createBookingPaymentOrder,
  createFinalPaymentOrder,
  verifyPayment,
  getMyPayments,
  getPayment,
  handleWebhook,
  getGaragePayments,
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

// Webhook (no auth)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(authenticate);

// User routes
router.post('/create-booking-order', authorize(UserRole.USER), createBookingPaymentOrder);
router.post('/create-final-order', authorize(UserRole.USER), createFinalPaymentOrder);
router.post('/verify', authorize(UserRole.USER), verifyPayment);
router.get('/my', authorize(UserRole.USER), getMyPayments);

// Garage routes
router.get('/garage', authorize(UserRole.GARAGE_OWNER), getGaragePayments);

// Common routes
router.get('/:id', getPayment);

export default router;
