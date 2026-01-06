const User = require('../models/User');
const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail'); 
const { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_OPTIONS } = require('../config/jwt');
const { validationResult } = require('express-validator');

const generateToken = user => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
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
    // const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

    // Create new user with verification fields
    const user = new User({
      name,
      email,
      password,
      // verificationToken,
      // verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      // isVerified: false,
    });
    await user.save();

    // Prepare and send verification email
    // const verifyUrl = `${process.env.CLIENT_URL}/verify/${verificationToken}`;
    // const html = `
    //   <h2>Email Verification - GeoSentinel</h2>
    //   <p>Hello ${name},</p>
    //   <p>Please verify your email by clicking the link below:</p>
    //   <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
    //   <p>This link expires in 24 hours.</p>
    // `;

    // await sendEmail(email, 'Verify Your GeoSentinel Account', html);

    res.status(201).json({ success: true, message: 'Signup successful! Please verify your email before logging in.', user: { id: user._id, name, email } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// -------------------------
// Verify Email Controller
// -------------------------
// exports.verifyEmail = async (req, res, next) => {
//   try {
//     const { token } = req.params;

//     // 1. Decode token to get the email
//     const decoded = jwt.verify(token, JWT_SECRET);
    
//     // 2. Find the user by the email in the token
//     const user = await User.findOne({ email: decoded.email });

//     if (!user) {
//         return res.status(404).json({ success: false, message: 'User not found.' });
//     }

//     // 3. Handle Already Verified Case (Returns the standard success message)
//     if (user.isVerified) {
//         console.log(`✅ Email for ${user.email} is already verified.`);
//         // RETURN THE SAME MESSAGE AS THE FIRST SUCCESS
//         return res.status(200).json({
//             success: true,
//             message: 'Email verified successfully. You can now log in.', 
//         });
//     }

//     // 4. Handle Invalid/Expired Token for UNVERIFIED Users
//     const isTokenValid = user.verificationToken === token && user.verificationTokenExpires && user.verificationTokenExpires > Date.now();

//     if (!isTokenValid) {
//         console.log(`❌ Invalid/Expired token attempt for ${user.email}.`);
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid or expired verification token',
//         });
//     }

//     // 5. Final Verification (Only runs if token is valid and user is NOT verified)
//     user.isVerified = true;
//     user.verificationToken = undefined;
//     user.verificationTokenExpires = undefined;
//     await user.save();
    
//     console.log(`✅ Email for ${user.email} verified successfully.`);

//     // RETURN THE STANDARD SUCCESS MESSAGE
//     res.status(200).json({
//       success: true,
//       message: 'Email verified successfully. You can now log in.',
//     });

//   } catch (err) {
//     console.error("❌ JWT/General Error:", err.message);
//     res.status(400).json({ success: false, message: 'Invalid or expired token' });
//   }
// };

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'User not found' });
    
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact admin.'
      });
    }
    // 🔑 NEW: Check if the user's email is verified
    // if (!user.isVerified) {
    //   return res.status(401).json({ 
    //     success: false, 
    //     message: 'Your email is not verified. Please check your inbox for the verification link.' 
    //   });
    // }

    if(!(await user.matchPassword(password)))
      return res.status(401).json({message:'Invalid credentials'})

    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ message: 'Logged in Succesfully!', user: { id: user._id, name: user.name, email, role: user.role }, "success": true });
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
  const { _id, name, email, role } = req.user;
  res.json({
    success: true,
    user: { id: _id, name, email, role }
  });
};

// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ success: false, message: "User not found" });

//     // Generate reset token valid for 1 hour
//     const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     await user.save();

//     const resetUrl = `${process.env.CLIENT_URL}/reset-password/${encodeURIComponent(resetToken)}`;
//     const html = `
//       <h2>Password Reset Request - GeoSentinel</h2>
//       <p>Hello ${user.name},</p>
//       <p>You requested a password reset. Click the link below to reset your password:</p>
//       <a href="${resetUrl}" target="_blank">${resetUrl}</a>
//       <p>This link expires in 1 hour.</p>
//     `;

//     await sendEmail(user.email, "Reset Your GeoSentinel Password", html);

//     res.status(200).json({ success: true, message: "Password reset link sent to your email." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Error sending password reset link" });
//   }
// };

// exports.resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     const decoded = jwt.verify(decodeURIComponent(token), JWT_SECRET);

//     const user = await User.findOne({
//       email: decoded.email,
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ success: false, message: "Invalid or expired token" });
//     }

//     user.password = password; // Assuming your schema hashes it via pre-save middleware
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     res.status(200).json({ success: true, message: "Password reset successful. You can now log in." });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ success: false, message: "Invalid or expired reset link" });
//   }
// };
