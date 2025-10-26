const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');


router.get('/profile', auth, authorizeRoles('user'), userController.getUserProfile);
router.put('/profile', auth, authorizeRoles('user'), userController.updateUserProfile);
router.get('/requests', auth, authorizeRoles('user'), userController.getUserRequests);
router.get('/stats', auth, authorizeRoles('user'), userController.getUserStats);

module.exports = router;