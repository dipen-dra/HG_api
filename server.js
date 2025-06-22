


// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminUserRoutes from './routes/admin/adminUserRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';

// // Load environment variables from .env file FIRST
// dotenv.config();

// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// // Diagnostic middleware to log every incoming request
// app.use((req, res, next) => {
//   console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
//   next();
// });

// // Routes
// app.use("/api/auth", userRoutes);
// app.use('/api/admin/users', adminUserRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the hamrogrocery-backend API!");
// });

// const PORT = process.env.PORT || 8081;
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });



// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminUserRoutes from './routes/admin/adminUserRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';

// // Load environment variables from .env file FIRST
// dotenv.config();

// const app = express();

// // Connect to MongoDB
// connectDB();

// // --- START: MODIFIED CORS CONFIGURATION ---
// // This is the crucial change. We are now explicitly allowing credentials
// // and the 'Authorization' header from any origin.
// const corsOptions = {
//   origin: "*", // Or you can be more specific, e.g., 'http://localhost:5173'
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true, // Allow cookies to be sent
//   allowedHeaders: "Content-Type, Authorization", // Explicitly allow Authorization header
// };

// app.use(cors(corsOptions));
// // --- END: MODIFIED CORS CONFIGURATION ---

// app.use(express.json());

// // Diagnostic middleware to log every incoming request
// app.use((req, res, next) => {
//   console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
//   // Log headers to see if Authorization is arriving
//   console.log('Headers:', req.headers);
//   next();
// });

// // Routes
// app.use("/api/auth", userRoutes);
// app.use('/api/admin/users', adminUserRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the hamrogrocery-backend API!");
// });

// const PORT = process.env.PORT || 8081;
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });


// Filename: backend/server.js

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
// --- 1. IMPORT THE NEW ERROR HANDLER ---
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();
const app = express();
connectDB();

const corsOptions = {
  origin: "*", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());

// Diagnostic middleware (great for development!)
// app.use((req, res, next) => {
//   console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
//   next();
// });

// --- Routes ---
app.use("/api/auth", userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the hamrogrocery-backend API!");
});

// --- 2. ADD THE ERROR HANDLER AS THE LAST MIDDLEWARE ---
// This will catch any errors from the routes above.
app.use(errorHandler);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});