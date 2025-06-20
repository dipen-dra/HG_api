// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import userRoutes from "./routes/userRoutes.js"; // This works now after fixing userRoutes.js

// // Load environment variables
// dotenv.config();

// // Create Express app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// // Routes
// app.use("/api/auth", userRoutes);

// // Root route for testing
// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the hamrogrocery-backend API!");
// });

// // Start server
// const PORT = process.env.PORT || 8081;
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });


import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import adminUserRoutes from './routes/admin/adminUserRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Root route for testing
app.get("/", (req, res) => {
    res.status(200).send("Welcome to the hamrogrocery-backend API!");
});

// Start server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});