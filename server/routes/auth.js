const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.get('/me',authMiddleware, authController.checkAuth);
router.get("/verify/:token", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);



module.exports = router;