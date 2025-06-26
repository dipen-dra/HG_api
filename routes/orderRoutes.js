
// import express from 'express';
// // 1. Import getOrderById from the controller
// import { getOrders, updateOrderStatus, createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
// import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

// const router = express.Router();

// // --- USER ROUTES ---
// router.post('/', authenticateUser, createOrder);
// router.get('/myorders', authenticateUser, getMyOrders);

// // --- ADMIN ROUTES ---
// router.get('/', authenticateUser, isAdmin, getOrders);
// // 2. Add this GET route for a single order
// router.get('/:id', authenticateUser, isAdmin, getOrderById);
// router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


// export default router;
// // This code sets up the order routes for the application, allowing users to create orders, view their own orders, and enabling admins to manage all orders.
// // It includes user authentication and admin authorization checks to ensure that only authorized users can access certain routes.


import express from 'express';
// 1. Import getOrderById from the controller
import { getOrders, updateOrderStatus, createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

// --- USER ROUTES ---
// POST /api/orders - Create a new order
router.post('/', authenticateUser, createOrder);
// GET /api/orders/myorders - Get orders for the logged-in user
router.get('/myorders', authenticateUser, getMyOrders);

// --- ADMIN ROUTES ---
// GET /api/orders - Get all orders (admin only)
router.get('/', authenticateUser, isAdmin, getOrders);
// GET /api/orders/:id - Get a single order by ID (admin only)
router.get('/:id', authenticateUser, isAdmin, getOrderById);
// PUT /api/orders/:id - Update an order's status (admin only)
router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


export default router;
// This code sets up the order routes for the application, allowing users to create orders, view their own orders, and enabling admins to manage all orders.
// It includes user authentication and admin authorization checks to ensure that only authorized users can access certain routes.