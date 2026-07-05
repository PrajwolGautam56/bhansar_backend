import { Router } from 'express';
import { createReminder, deleteReminder, listReminders, updateReminder } from '../controllers/reminderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listReminders);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export default router;
