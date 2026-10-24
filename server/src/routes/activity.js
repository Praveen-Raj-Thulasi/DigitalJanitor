import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getActivity } from '../controllers/activityController.js';

const router = Router();

router.use(authenticate);
router.get('/', getActivity);

export default router;
