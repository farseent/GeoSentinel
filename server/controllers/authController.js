const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); 
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

    const { name, email, password, phone, dob, address } = req.body;
    let existingUser  = await User.findOne({ email });
    if (existingUser ) return res.status(400).json({ success: false, message: 'Email already registered' });
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered' })

        // Generate email verification token (valid for 24 hours)
    // const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

    // Create new user with verification fields
    const user = new User({
      name,
      email,
      password,
      phone,
      dob,
      address
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

    res.status(201).json({ success: true, message: 'Signup successful! Please verify your email before logging in.', user: { id: user._id, name, email, } });
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

    // 🔧 MAINTENANCE MODE CHECK
    const settings = await Settings.findOne();
    if (
      settings?.maintenanceMode.enabled &&
      user.role !== 'admin' &&
      !settings.maintenanceMode.allowedEmails.includes(user.email)
    ) {
      return res.status(503).json({
        success: false,
        message: settings.maintenanceMode.message,
        maintenanceMode: true
      });
    }

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "User not found" });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const html = `
      <h2>Password Reset OTP - GeoSentinel</h2>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Use the OTP below to reset your password:</p>
      <h1 style="letter-spacing: 8px; color: #2563eb;">${otp}</h1>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, "Your GeoSentinel Password Reset OTP", html);

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    // OTP is valid — confirm to frontend so it can show the new password form
    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    user.password = password;           // pre-save hook hashes it automatically
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Password reset failed" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id; // comes from authMiddleware
    const { currentPassword, newPassword } = req.body;

    // 1. Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // 2. Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3. Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // 4. Prevent same password reuse (optional but good)
    const isSame = await user.matchPassword(newPassword);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // 5. Update password
    user.password = newPassword; // 🔥 your pre-save hook will hash this
    await user.save();

    // 6. (Recommended) Logout user
    // res.clearCookie('token', COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update password"
    });
  }
};