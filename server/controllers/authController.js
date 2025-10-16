const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); 
const { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_OPTIONS } = require('../config/jwt');
const { validationResult } = require('express-validator');

const generateToken = user => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    let existingUser  = await User.findOne({ email });
    if (existingUser ) return res.status(400).json({ success: false, message: 'Email already registered' });

        // Generate email verification token (valid for 24 hours)
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

    // Create new user with verification fields
    const user = new User({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      isVerified: false,
    });
    await user.save();

    // Prepare and send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify/${verificationToken}`;
    const html = `
      <h2>Email Verification - GeoSentinel</h2>
      <p>Hello ${name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
    `;

    await sendEmail(email, 'Verify Your GeoSentinel Account', html);

    res.status(201).json({ success: true, message: 'Signup successful! Please verify your email before logging in.', user: { id: user._id, name, email } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// -------------------------
// Verify Email Controller
// -------------------------
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Decode and verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user matching token and within expiry
    const user = await User.findOne({
      email: decoded.email,
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });

    // Mark email as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    // 🔑 NEW: Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Your email is not verified. Please check your inbox for the verification link.' 
      });
    }
    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ message: 'Logged in Succesfully!', user: { id: user._id, name: user.name, email }, "success": true });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
};

// Add this function to your authController.js

exports.checkAuth = (req, res) => {
  
  if (!req.user) {
    return res.json({ success: false, message: "Not authenticated", user: null });
  }
  const { _id, name, email, isAdmin } = req.user;
  res.json({
    success: true,
    user: { id: _id, name, email, isAdmin }
  });
};