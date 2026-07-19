import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaint,
} from '../controllers/complaintController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', authorize(UserRole.USER), createComplaint);
router.get('/my', authorize(UserRole.USER), getMyComplaints);
router.get('/:id', getComplaint);

export default router;
