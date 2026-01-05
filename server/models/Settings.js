const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'System is under maintenance. Please check back later.'
    },
    allowedEmails: [{
      type: String,
      lowercase: true
    }]
  },
  systemStats: {
    totalRequests: {
      type: Number,
      default: 0
    },
    totalUsers: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);