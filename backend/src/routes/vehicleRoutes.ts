import { Router } from 'express';
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.USER));

router.get('/', getVehicles);
router.post('/', createVehicle);
router.get('/:id', getVehicle);
router.patch('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
