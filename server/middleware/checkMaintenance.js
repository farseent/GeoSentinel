const Settings = require('../models/Settings');

const checkMaintenance = async (req, res, next) => {
  try {
    // Skip maintenance check for admin users
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const settings = await Settings.findOne();
    
    if (settings && settings.maintenanceMode.enabled) {
      // Check if user's email is in allowed list
      if (req.user && settings.maintenanceMode.allowedEmails.includes(req.user.email)) {
        return next();
      }

      return res.status(503).json({
        success: false,
        message: settings.maintenanceMode.message,
        maintenanceMode: true
      });
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = checkMaintenance;