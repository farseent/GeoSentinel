const Settings = require('../models/Settings');

const checkMaintenance = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.maintenanceMode.enabled) {
      return next();
    }

    // Allow admins
    if (req.user?.role === 'admin') {
      return next();
    }

    // Allow whitelisted emails
    if (
      req.user &&
      settings.maintenanceMode.allowedEmails.includes(req.user.email)
    ) {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: settings.maintenanceMode.message,
      maintenanceMode: true
    });

  } catch (error) {
    next(error);
  }
};

module.exports = checkMaintenance;
