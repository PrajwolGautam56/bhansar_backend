import { Router } from 'express';
import { createLead, deleteLead, getLead, listLeads, updateLead } from '../controllers/leadController.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listLeads);
router.post('/', createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', adminMiddleware, deleteLead);

export default router;
