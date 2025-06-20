import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', authenticateUser, isAdmin, createProduct);
router.put('/:id', authenticateUser, isAdmin, updateProduct);
router.delete('/:id', authenticateUser, isAdmin, deleteProduct);

export default router;