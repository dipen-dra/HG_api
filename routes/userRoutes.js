

// import express from "express";
// import { registerUser, loginUser, getUserProfile } from "../controllers/userController.js";
// import { authenticateUser } from "../middlewares/authorizedUser.js";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/profile", authenticateUser, getUserProfile);

// export default router;



// import express from 'express';
// // Import the new controller function we will create
// import { getOrders, updateOrderStatus, createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
// import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

// const router = express.Router();

// // --- USER ROUTES ---
// router.post('/', authenticateUser, createOrder);
// router.get('/myorders', authenticateUser, getMyOrders);

// // --- ADMIN ROUTES ---
// router.get('/', authenticateUser, isAdmin, getOrders);
// // ADD THIS LINE for fetching a single order
// router.get('/:id', authenticateUser, isAdmin, getOrderById);
// router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


// export default router;

// Filename: backend/routes/userRoutes.js

import express from 'express';
// 1. Import the controller functions you already created
import { registerUser, loginUser, getUserProfile } from '../controllers/userController.js';
import { authenticateUser } from '../middlewares/authorizedUser.js'; // Assuming this is the correct path for your auth middleware

const router = express.Router();

// --- PUBLIC ROUTES ---

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (THIS IS THE MISSING ROUTE)
// @access  Public
router.post('/login', loginUser);


// --- PROTECTED ROUTES ---

// @route   GET /api/auth/profile
// @desc    Get the logged-in user's profile
// @access  Private (Requires a token)
// Note: The path here will resolve to GET /api/auth/profile
router.get('/profile', authenticateUser, getUserProfile);


export default router;