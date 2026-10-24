import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCleanupPlans,
  createCleanupPlan,
  getCleanupPlan,
  updateCleanupPlan,
  deleteCleanupPlan,
} from '../controllers/cleanupController.js';

const router = Router();

router.use(authenticate);

router.get('/', getCleanupPlans);
router.post('/', createCleanupPlan);
router.get('/:id', getCleanupPlan);
router.patch('/:id', updateCleanupPlan);
router.delete('/:id', deleteCleanupPlan);

export default router;
