const mongoose = require("mongoose");
const { REQUEST_STATUS } = require("../utils/constants");

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: "",
    },

    // AOI bounding box (from MapContainer bounds)
    coordinates: {
      north: { type: Number, required: true },
      south: { type: Number, required: true },
      east:  { type: Number, required: true },
      west:  { type: Number, required: true },
    },

    // Two specific dates for change detection (not a range)
    dateFrom: { type: Date, required: true }, // Date 1
    dateTo:   { type: Date, required: true }, // Date 2

    // Sentinel-2 fetched images (Cloudinary URLs)
    imageFrom: { type: String, default: null }, // image at dateFrom
    imageTo:   { type: String, default: null }, // image at dateTo

    // Change detection result from teammate's model
    resultUrl: { type: String, default: null },

    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
    },

    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

requestSchema.index({ user: 1, createdAt: -1 });
requestSchema.index({ status: 1 });

module.exports = mongoose.model("Request", requestSchema);