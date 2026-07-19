import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getGarageRequests,
  getRequest,
  acceptRequest,
  rejectRequest,
  assignMechanic,
  updateStatus,
  generateCompletionOTP,
  verifyCompletionOTP,
  cancelRequest,
} from '../controllers/requestController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

// User routes
router.post('/', authorize(UserRole.USER), createRequest);
router.get('/my', authorize(UserRole.USER), getMyRequests);
router.post('/:id/cancel', authorize(UserRole.USER), cancelRequest);
router.post('/:id/verify-otp', authorize(UserRole.USER), verifyCompletionOTP);

// Garage routes
router.get('/garage', authorize(UserRole.GARAGE_OWNER), getGarageRequests);
router.post('/:id/accept', authorize(UserRole.GARAGE_OWNER), acceptRequest);
router.post('/:id/reject', authorize(UserRole.GARAGE_OWNER), rejectRequest);
router.post('/:id/assign-mechanic', authorize(UserRole.GARAGE_OWNER), assignMechanic);
router.post('/:id/generate-otp', authorize(UserRole.GARAGE_OWNER), generateCompletionOTP);
router.patch('/:id/status', authorize(UserRole.GARAGE_OWNER, UserRole.ADMIN), updateStatus);

// Common routes
router.get('/:id', getRequest);

export default router;
