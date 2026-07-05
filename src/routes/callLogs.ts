import { Router } from 'express';
import { createCallLog, listCallLogs } from '../controllers/callLogController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listCallLogs);
router.post('/', createCallLog);

export default router;
