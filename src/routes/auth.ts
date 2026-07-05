import { Router } from 'express';
import { login, logout, me, refresh } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, me);

export default router;
