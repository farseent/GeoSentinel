const User = require('../models/User');
const jwt = require('jsonwebtoken');
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
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: 'Email already registered' });

    user = new User({ name, email, password });
    await user.save();

    // const token = generateToken(user);
    // res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ success: true, message: 'Signup successful! Please log in.', user: { id: user._id, name, email } });
  } catch (err) {
    next(err);
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