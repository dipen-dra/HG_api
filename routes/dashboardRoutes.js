import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

const router = express.Router();

router.get('/stats', authenticateUser, isAdmin, getDashboardStats);

export default router;


// import express from 'express';
// import { getDashboardStats } from '../controllers/dashboardController.js';
// import { authenticateUser, isAdmin } from '../middlewares/authorizedUser.js';

// const router = express.Router();

// // This will now correctly correspond to /api/admin/dashboard-stats
// router.get('/dashboard-stats', authenticateUser, isAdmin, getDashboardStats); 

// export default router;