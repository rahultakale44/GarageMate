import { Router } from 'express';
import {
  createReview,
  getGarageReviews,
  getMyReviews,
  respondToReview,
  deleteReview,
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

// Public route
router.get('/garage/:garageId', getGarageReviews);

// Protected routes
router.use(authenticate);

router.post('/', authorize(UserRole.USER), createReview);
router.get('/my', authorize(UserRole.USER), getMyReviews);
router.delete('/:id', authorize(UserRole.USER), deleteReview);
router.post('/:id/respond', authorize(UserRole.GARAGE_OWNER), respondToReview);

export default router;
