// import express from 'express';
// import { getOrders, updateOrderStatus } from '../controllers/orderController.js';
// import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

// const router = express.Router();

// router.get('/', authenticateUser, isAdmin, getOrders);
// router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);

// export default router;


import express from 'express';
import { getOrders, updateOrderStatus, createOrder, getMyOrders } from '../controllers/orderController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

// --- USER ROUTES ---
router.post('/', authenticateUser, createOrder);
router.get('/myorders', authenticateUser, getMyOrders);

// --- ADMIN ROUTES ---
router.get('/', authenticateUser, isAdmin, getOrders);
router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


export default router;