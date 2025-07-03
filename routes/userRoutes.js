import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfilePicture, updateUserProfile } from '../controllers/userController.js';
import { authenticateUser } from '../middlewares/authorizedUser.js';
import multerUpload from '../middlewares/multerUpload.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- PROTECTED ROUTES ---
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);

router.put(
    '/profile/picture',
    authenticateUser,
    multerUpload.single('profilePicture'),
    updateUserProfilePicture
);

export default router;