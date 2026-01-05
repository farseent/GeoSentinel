const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  toggleUserBlock,
  deleteUser,
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
  getSettings,
  updateSettings
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorizeRoles('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:userId/toggle-block', toggleUserBlock);
router.delete('/users/:userId', deleteUser);

// Request Management
router.get('/requests', getAllRequests);
router.patch('/requests/:requestId/status', updateRequestStatus);
router.delete('/requests/:requestId', deleteRequest);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;