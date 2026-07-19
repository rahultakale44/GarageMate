import { Router } from 'express';
import {
  registerUser,
  registerGarageOwner,
  login,
  googleAuth,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/user/register', authLimiter, registerUser);
router.post('/garage/register', authLimiter, registerGarageOwner);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', authenticate, getMe);

export default router;
