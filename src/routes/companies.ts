import { Router } from 'express';
import { createCompany, deleteCompany, getCompany, listCompanies, updateCompany } from '../controllers/companyController.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listCompanies);
router.post('/', createCompany);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.delete('/:id', adminMiddleware, deleteCompany);

export default router;
