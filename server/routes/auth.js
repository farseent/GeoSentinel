const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.get('/me',authMiddleware, authController.checkAuth);
// router.get("/verify/:token", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post("/reset-password/", authController.resetPassword);
router.put('/change-password', authMiddleware, authController.changePassword);



module.exports = router;