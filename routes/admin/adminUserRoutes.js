import express from "express";
import {
  createUser, getUsers, getOneUser, updateOneUser, deleteOneUser
} from "../../controllers/admin/usermanagement.js";
import {
  authenticateUser, isAdmin
} from "../../middlewares/authorizedUser.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/", authenticateUser, isAdmin, getUsers);
router.get("/:id", getOneUser);
router.put("/:id", updateOneUser);
router.delete("/:id", deleteOneUser);

export default router;
// Note: The `authenticateUser` and `isAdmin` middleware are used to protect the routes that require authentication and admin privileges.
// The `createUser` route does not require authentication, allowing new users to be created without