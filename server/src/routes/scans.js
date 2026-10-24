import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getScans, getScan, createScan, deleteScan, getScanStats } from '../controllers/scanController.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getScanStats);
router.get('/', getScans);
router.get('/:id', getScan);
router.post('/', createScan);
router.delete('/:id', deleteScan);

export default router;
