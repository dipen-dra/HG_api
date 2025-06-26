// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import path from 'path'; // --- ADD THIS
// import { fileURLToPath } from 'url'; // --- ADD THIS
// import { connectDB } from "./config/db.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminUserRoutes from './routes/admin/adminUserRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';
// import errorHandler from './middlewares/errorHandler.js';

// dotenv.config();
// const app = express();
// connectDB();

// // --- ADD THESE LINES TO GET __dirname IN ES MODULES ---
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const corsOptions = {
//   origin: "*", 
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   allowedHeaders: "Content-Type, Authorization",
// };

// app.use(cors(corsOptions));
// app.use(express.json());

// // --- ADD THIS LINE TO SERVE STATIC FILES ---
// // This makes the 'public' folder accessible, e.g., http://localhost:8081/images/profile.jpg
// app.use(express.static(path.join(__dirname, 'public')));


// // --- Routes ---
// app.use("/api/auth", userRoutes);
// app.use('/api/admin/users', adminUserRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// app.get("/", (req, res) => {
//     res.status(200).send("Welcome to the hamrogrocery-backend API!");
// });

// app.use(errorHandler);

// const PORT = process.env.PORT || 8081;
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });




// -----------------------------------------------------------------------------

// FILE: hg_api/server.js
// ACTION: The main server file, updated to include the payment routes.

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import adminUserRoutes from './routes/admin/adminUserRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();
const app = express();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: "*", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/auth", userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the hamrogrocery-backend API!");
});

app.use(errorHandler);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
