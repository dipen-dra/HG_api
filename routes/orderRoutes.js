import express from 'express';
import { getOrders, updateOrderStatus, createOrder, getMyOrders, getOrderById, getPaymentHistory } from '../controllers/orderController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

// --- USER ROUTES ---
// POST /api/orders - Create a new order
router.post('/', authenticateUser, createOrder);

// GET Specific User Routes (must be before dynamic :id)
// GET /api/orders/myorders - Get completed orders for the logged-in user
router.get('/myorders', authenticateUser, getMyOrders);
// GET /api/orders/payment-history - Get all financial transactions for the logged-in user
router.get('/payment-history', authenticateUser, getPaymentHistory);


// --- ADMIN ROUTES ---
// GET /api/orders - Get all orders (admin only)
router.get('/', authenticateUser, isAdmin, getOrders);

// GET Dynamic Admin Route (must be last among GET routes)
// GET /api/orders/:id - Get a single order by ID (admin only)
router.get('/:id', authenticateUser, isAdmin, getOrderById);

// PUT /api/orders/:id - Update an order's status (admin only)
router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


export default router;