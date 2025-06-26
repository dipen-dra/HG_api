import express from 'express';
import { initiateEsewaPayment, verifyEsewaPayment } from '../controllers/paymentController.js';
import { authenticateUser } from '../middlewares/authorizedUser.js';

const router = express.Router();

router.post('/initiate-esewa', authenticateUser, initiateEsewaPayment);
router.get('/esewa/verify', verifyEsewaPayment); // eSewa will redirect the user here

export default router;