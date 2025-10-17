const User = require('../models/User');
const Request = require('../models/Request');
const { successResponse, errorResponse } = require('../utils/response');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, 'Profile fetched successfully', user);
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 'Server error', 500);
  }
};

exports.updateUserProfile  = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return errorResponse(res, 'Email is already in use', 400);
      }
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;

    const updatedUser = await user.save();
    
    // Remove password from response
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin
    };

    successResponse(res, 'Profile updated successfully', userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, 'Server error', 500);
  }
};

exports.getUserRequests  = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const requests = await Request.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    const total = await Request.countDocuments({ user: req.user.id });
    const totalPages = Math.ceil(total / limit);

    const response = {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    successResponse(res, 'Requests fetched successfully', response);
  } catch (error) {
    console.error('Get user requests error:', error);
    errorResponse(res, 'Server error', 500);
  }
};

exports.getUserStats  = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get request counts by status
    const stats = await Request.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total requests
    const totalRequests = await Request.countDocuments({ user: userId });

    // Get recent requests count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRequests = await Request.countDocuments({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Format stats
    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    const response = {
      totalRequests,
      recentRequests,
      statusBreakdown: statusStats
    };

    successResponse(res, 'User stats fetched successfully', response);
  } catch (error) {
    console.error('Get user stats error:', error);
    errorResponse(res, 'Server error', 500);
  }
};