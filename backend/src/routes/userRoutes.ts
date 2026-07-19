import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.USER, UserRole.GARAGE_OWNER, UserRole.ADMIN));

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/password', changePassword);

export default router;
