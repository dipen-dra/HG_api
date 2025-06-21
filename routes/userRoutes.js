

// import express from "express";
// import { registerUser, loginUser, getUserProfile } from "../controllers/userController.js";
// import { authenticateUser } from "../middlewares/authorizedUser.js";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/profile", authenticateUser, getUserProfile);

// export default router;



import express from 'express';
// Import the new controller function we will create
import { getOrders, updateOrderStatus, createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

// --- USER ROUTES ---
router.post('/', authenticateUser, createOrder);
router.get('/myorders', authenticateUser, getMyOrders);

// --- ADMIN ROUTES ---
router.get('/', authenticateUser, isAdmin, getOrders);
// ADD THIS LINE for fetching a single order
router.get('/:id', authenticateUser, isAdmin, getOrderById);
router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


export default router;