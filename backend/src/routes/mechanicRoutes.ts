import { Router } from 'express';
import {
  getMechanics,
  getMechanic,
  createMechanic,
  updateMechanic,
  deleteMechanic,
  updateMechanicLocation,
} from '../controllers/mechanicController';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.GARAGE_OWNER));

router.get('/', getMechanics);
router.post('/', createMechanic);
router.get('/:id', getMechanic);
router.patch('/:id', updateMechanic);
router.delete('/:id', deleteMechanic);
router.patch('/:id/location', updateMechanicLocation);

export default router;
