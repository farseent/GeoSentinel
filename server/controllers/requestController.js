const Request = require("../models/Request");
const fetchGEEImage = require('../utils/fetchSatelliteImage');

// Create a new AOI request
exports.createRequest = async (req, res, next) => {
  try {
    const { coordinates, dateFrom, dateTo } = req.body;

    if (!coordinates || !dateFrom || !dateTo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create the DB record first to get an ID
    const request = await Request.create({
      user: req.user._id,
      coordinates,
      dateFrom,
      dateTo,
      status: "Pending",
    });

    // Fetch satellite images for both dates asynchronously
    // Don't await here — let it process in background
    (async () => {
      try {
        // Fetch image around dateFrom (±15 day window for cloud-free image)
        const fromDate = new Date(request.dateFrom);
        const fromStart = new Date(fromDate);
        fromStart.setDate(fromStart.getDate() - 15);

        const toDate = new Date(request.dateTo);
        const toEnd = new Date(toDate);
        toEnd.setDate(toEnd.getDate() + 15);

        const imageFrom = await fetchGEEImage(
          request.coordinates,
          fromStart.toISOString().split('T')[0],  // "YYYY-MM-DD"
          request.dateFrom.toISOString().split('T')[0],
          request._id,
          'from'
        );

        const imageTo = await fetchGEEImage(
          request.coordinates,
          request.dateTo.toISOString().split('T')[0],
          toEnd.toISOString().split('T')[0],
          request._id,
          'to'
        );

        await Request.findByIdAndUpdate(request._id, {
          imageFrom,
          imageTo,
          status: 'Processing',
        });

      } catch (err) {
        console.error('GEE fetch failed:', err.message);
        await Request.findByIdAndUpdate(request._id, { status: 'Failed' });
      }
    })();

    res.status(201).json({ 
      message: "Request submitted successfully", 
      request 
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