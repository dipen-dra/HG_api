import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticateUser, isAdmin, createCategory);
router.put('/:id', authenticateUser, isAdmin, updateCategory);
router.delete('/:id', authenticateUser, isAdmin, deleteCategory);

export default router;