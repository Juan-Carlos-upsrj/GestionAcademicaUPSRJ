import { Router } from 'express';
import { pullState, pushState } from '../controllers/syncController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/pull', authenticateToken, pullState);
router.post('/push', authenticateToken, pushState);

export default router;
