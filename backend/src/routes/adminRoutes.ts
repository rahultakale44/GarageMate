import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  getGarageOwners,
  getVerificationQueue,
  getGarageVerificationDetails,
  approveGarage,
  rejectGarage,
  requestGarageChanges,
  suspendGarage,
  reactivateGarage,
  blockUser,
  getAllComplaints,
  resolveComplaint,
  getAllRequests,
  getAllPayments,
  hideReview,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/garage-owners', getGarageOwners);
router.patch('/users/:id/block', blockUser);

// Garage Verification
router.get('/verifications', getVerificationQueue);
router.get('/garages/:id', getGarageVerificationDetails);
router.patch('/garages/:id/approve', approveGarage);
router.patch('/garages/:id/reject', rejectGarage);
router.patch('/garages/:id/request-changes', requestGarageChanges);
router.patch('/garages/:id/suspend', suspendGarage);
router.patch('/garages/:id/reactivate', reactivateGarage);

// Requests
router.get('/requests', getAllRequests);

// Payments
router.get('/payments', getAllPayments);

// Complaints
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/resolve', resolveComplaint);

// Reviews
router.patch('/reviews/:id/hide', hideReview);

export default router;
