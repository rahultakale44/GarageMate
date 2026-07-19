import { Router } from 'express';
import {
  createQuotation,
  sendQuotation,
  getQuotation,
  getQuotationByRequest,
  approveQuotation,
  rejectQuotation,
  updateQuotation,
} from '../controllers/quotationController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

// Garage owner routes
router.post('/', authorize(UserRole.GARAGE_OWNER), createQuotation);
router.post('/:id/send', authorize(UserRole.GARAGE_OWNER), sendQuotation);
router.patch('/:id', authorize(UserRole.GARAGE_OWNER), updateQuotation);

// User routes
router.post('/:id/approve', authorize(UserRole.USER), approveQuotation);
router.post('/:id/reject', authorize(UserRole.USER), rejectQuotation);

// Common routes
router.get('/:id', getQuotation);
router.get('/request/:requestId', getQuotationByRequest);

export default router;
