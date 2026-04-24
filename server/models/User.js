const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true, unique: true, match: [/^\+\d{8,15}$/, 'Please use a valid phone number with country code'] },
  dob: { type: Date, required: true },
  address: { type: String, required: true, maxlength: 200, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  lastLogin: Date,
  // isVerified: { type: Boolean, default: false },
  // verificationToken: { type: String },
  // verificationTokenExpires: { type: Date },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
},
{
  timestamps: true
}
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);