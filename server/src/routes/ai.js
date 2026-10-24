import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { getAiStatus, analyzeFiles, suggestOrganization } from '../controllers/aiController.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many AI requests, please slow down' },
});

router.get('/status', authenticate, getAiStatus);
router.post('/analyze', authenticate, aiLimiter, analyzeFiles);
router.post('/suggest-organization', authenticate, aiLimiter, suggestOrganization);

export default router;
