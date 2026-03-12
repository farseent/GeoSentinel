const Request = require("../models/Request");
const User = require("../models/User");
const { fetchAndSaveImagePair } = require("../utils/sentinelHub");
const { REQUEST_STATUS } = require("../utils/constants");
const { resultReadyEmail } = require("../utils/emailTemplates");
const sendEmail = require("../utils/sendEmail");
const axios = require("axios");
const path = require("path");

const MODEL_API_URL = process.env.MODEL_API_URL;

exports.createRequest = async (req, res, next) => {
  try {
    const { coordinates, dateFrom, dateTo } = req.body;

    if (!coordinates || !dateFrom || !dateTo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const { north, south, east, west } = coordinates;
    if ([north, south, east, west].some((v) => v === undefined)) {
      return res.status(400).json({ message: "Invalid AOI coordinates." });
    }

    // Save request with Pending status
    const request = await Request.create({
      user: req.user._id,
      coordinates,
      dateFrom,
      dateTo,
      status: REQUEST_STATUS.PENDING,
    });

    // Run everything in background
    (async () => {
      try {
        // Step 1: Fetch Sentinel images
        const { imageFrom, imageTo } = await fetchAndSaveImagePair(
          coordinates, dateFrom, dateTo, request._id
        );

        await Request.findByIdAndUpdate(request._id, {
          imageFrom,
          imageTo,
          status: REQUEST_STATUS.PROCESSING,
        });

        // Step 2: Build absolute paths for Flask
        const serverRoot = path.join(__dirname, "..");
        const abs1 = path.join(serverRoot, imageFrom);
        const abs2 = path.join(serverRoot, imageTo);
        const outputDir = path.join(
          serverRoot, "uploads", "requests", request._id.toString()
        );

        // Step 3: Call Flask model API
        const modelResponse = await axios.post(`${MODEL_API_URL}/predict`, {
          image1_path: abs1,
          image2_path: abs2,
          output_dir: outputDir,
        });

        const { stats } = modelResponse.data;
        const requestId = request._id.toString();

        // Step 4: Update request as Completed
        await Request.findByIdAndUpdate(request._id, {
          resultUrl: `uploads/requests/${requestId}/post_map.png`,
          stats,
          status: REQUEST_STATUS.COMPLETED,
          completedAt: new Date(),
        });

        console.log(`✅ Request ${requestId} completed. Change: ${stats?.change_percentage}%`);

        // Step 5: Send result email (non-blocking — won't fail request if email fails)
        try {
          const user = await User.findById(request.user).select('name email');
          if (user?.email) {
            const { subject, html } = resultReadyEmail({
              userName:         user.name || 'User',
              requestId:        requestId,
              dateFrom:         dateFrom,
              dateTo:           dateTo,
              changePercentage: stats?.change_percentage ?? 'N/A',
            });
            await sendEmail(user.email, subject, html);
            console.log(`📧 Result email sent to ${user.email}`);
          }
        } catch (emailErr) {
          console.error(`⚠️ Email failed (request still completed):`, emailErr.message);
        }

      } catch (err) {
        console.error(`❌ Request ${request._id} failed:`, err.message);
        await Request.findByIdAndUpdate(request._id, {
          status: REQUEST_STATUS.FAILED,
        });
      }
    })();

    // Respond immediately
    res.status(201).json({
      message: "Request submitted successfully",
      request,
    });

  } catch (err) {
    next(err);
  }
};

// Get all requests by a specific user (for admin)
exports.getUserRequests = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const requests = await Request.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

// Get all requests for the current (authenticated) user
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

// Get request by ID (if owner or admin)
exports.getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Allow owner or admin to access
    if (request.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ request });
  } catch (err) {
    next(err);
  }
};

// Update request status (admin only)
exports.updateStatus = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admins only" });
    }
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.requestId,
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Status updated", request });
  } catch (err) {
    next(err);
  }
};

// Delete a request (owner or admin)
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    await request.deleteOne();
    res.json({ message: "Request deleted" });
  } catch (err) {
    next(err);
  }
};

exports.getMyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total requests
    const totalRequests = await Request.countDocuments({ user: userId });

    // Recent requests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRequests = await Request.countDocuments({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Status breakdown
    const statusAgg = await Request.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const statusBreakdown = {};
    statusAgg.forEach(s => { statusBreakdown[s._id] = s.count; });
    console.log("status breakdown: ",statusBreakdown);
    
    res.json({
      totalRequests,
      recentRequests,
      statusBreakdown
    });
  } catch (err) {
    next(err);
  }
};