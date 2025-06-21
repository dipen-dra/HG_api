
// import express from "express";
// // FIX: Added getUserProfile to the import list.
// import { registerUser, loginUser, getUserProfile } from "../controllers/userController.js";
// import { authenticateUser } from "../middlewares/authorizedUser.js";

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);

// // FIX: Added the route to get the currently logged-in user's profile.
// // This endpoint is protected and requires a valid token.
// router.get("/profile", authenticateUser, getUserProfile);

// export default router;


import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/authorizedUser.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticateUser, getUserProfile);

export default router;