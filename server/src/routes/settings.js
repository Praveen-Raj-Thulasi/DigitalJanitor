import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(authenticate);
router.get('/', getSettings);
router.patch('/', updateSettings);

export default router;
