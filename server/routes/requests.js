const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const auth = require("../middleware/auth");

// Create new AOI request
router.post("/", auth, requestController.createRequest);

// Get all requests by a specific user (admin)
router.get("/user/:userId", auth, requestController.getUserRequests);

// Get current user's requests
router.get("/my", auth, requestController.getMyRequests);

// Get request stats
router.get('/stats', auth, requestController.getMyStats);

// Get request by ID
router.get("/:requestId", auth, requestController.getRequestById);

// Update request status (admin only)
router.patch("/:requestId/status", auth, requestController.updateStatus);

// Delete a request
router.delete("/:requestId", auth, requestController.deleteRequest);

module.exports = router;