import { Router } from 'express';
import {
  searchNearbyGarages,
  reverseGeocodeAddress,
  searchGeocodeAddress,
  getGarages,
  getGarage,
  getMyGarage,
  updateGarage,
  toggleAvailability,
  addGarageImages,
} from '../controllers/garageController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

// Public routes
router.get('/nearby', searchNearbyGarages);
router.get('/reverse-geocode', reverseGeocodeAddress);
router.get('/geocode', searchGeocodeAddress);
router.get('/', getGarages);
router.get('/:id', getGarage);

// Protected routes
router.use(authenticate);

// Garage owner routes
router.get('/my/profile', authorize(UserRole.GARAGE_OWNER), getMyGarage);
router.patch('/my/profile', authorize(UserRole.GARAGE_OWNER), updateGarage);
router.patch('/my/availability', authorize(UserRole.GARAGE_OWNER), toggleAvailability);
router.post('/my/images', authorize(UserRole.GARAGE_OWNER), addGarageImages);

export default router;
