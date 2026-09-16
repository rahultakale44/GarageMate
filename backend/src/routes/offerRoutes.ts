import { Router } from 'express';
import {
  submitOffer,
  getOffersForRequest,
  acceptOffer,
  withdrawOffer,
  getMyOffers,
} from '../controllers/offerController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/request/:requestId', authorize(UserRole.USER, UserRole.ADMIN), getOffersForRequest);
router.post('/:offerId/accept', authorize(UserRole.USER), acceptOffer);

// Garage owner routes
router.post('/request/:requestId', authorize(UserRole.GARAGE_OWNER), submitOffer);
router.get('/my-offers', authorize(UserRole.GARAGE_OWNER), getMyOffers);
router.post('/:offerId/withdraw', authorize(UserRole.GARAGE_OWNER), withdrawOffer);

export default router;
