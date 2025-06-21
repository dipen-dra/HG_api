// import express from "express";
// import { registerUser, loginUser } from "../controllers/userController.js";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);


// export default router;


import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/authorizedUser.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// NEW: Route to get the currently logged-in user's profile
// router.get("/profile", authenticateUser, getUserProfile);


export default router;